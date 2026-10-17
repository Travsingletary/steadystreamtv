import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Proxies Xtream Codes player_api live catalog for the authenticated user.
 * Avoids browser CORS when loading MegaOTT / provider streams into the web player.
 *
 * Returns normalized channels with HLS-friendly live URLs.
 * Does not invent content — only relays the user's provisioned panel catalog.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_XTREAM_HOST = "https://megaott.net";

type XtreamCreds = {
  username: string;
  password: string;
  host: string;
};

const log = (message: string, data?: unknown) => {
  console.log(
    `[XTREAM-CHANNELS] ${message}`,
    data ? JSON.stringify(data) : "",
  );
};

function normalizeHost(raw?: string | null): string {
  if (!raw || !raw.trim()) return DEFAULT_XTREAM_HOST;
  let host = raw.trim().replace(/\/$/, "");
  // dns_link may already be a full portal URL
  if (host.includes("get.php") || host.includes("player_api.php")) {
    try {
      const u = new URL(host.startsWith("http") ? host : `http://${host}`);
      return `${u.protocol}//${u.host}`;
    } catch {
      return DEFAULT_XTREAM_HOST;
    }
  }
  if (!/^https?:\/\//i.test(host)) {
    host = `http://${host}`;
  }
  return host.replace(/\/$/, "");
}

function buildLiveUrl(
  host: string,
  username: string,
  password: string,
  streamId: string | number,
): string {
  // Prefer HLS for Media3 / hls.js players (TiviMate RE also uses Media3+FFmpeg)
  return `${host}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.m3u8`;
}

async function resolveCredentials(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<XtreamCreds | null> {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "iptv_username, iptv_password, m3u_url, dns_link, xtream_url, portal_link, status, active",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const active = (sub || []).find(
    (s: Record<string, unknown>) =>
      s.iptv_username &&
      s.iptv_password &&
      (s.status === "active" || s.active === true || !s.status),
  ) as Record<string, unknown> | undefined;

  if (active?.iptv_username && active?.iptv_password) {
    const host = normalizeHost(
      (active.dns_link as string) ||
        (active.xtream_url as string) ||
        (active.portal_link as string) ||
        (active.m3u_url as string),
    );
    return {
      username: String(active.iptv_username),
      password: String(active.iptv_password),
      host,
    };
  }

  // Schema drift: some environments still store xtream_* on profiles
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profile) {
    const username =
      profile.xtream_username ||
      profile.megaott_username ||
      profile.iptv_username;
    const password =
      profile.xtream_password || profile.iptv_password;
    if (username && password) {
      return {
        username: String(username),
        password: String(password),
        host: normalizeHost(
          profile.xtream_server || profile.xtream_url || profile.dns_link,
        ),
      };
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const creds = await resolveCredentials(supabaseAdmin, user.id);

    if (!creds) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "no_credentials",
          message:
            "No Xtream credentials on file. Complete subscription / MegaOTT provisioning, or use TiviMate with your M3U URL.",
          channels: [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const apiBase = `${creds.host}/player_api.php`;
    const qs = (action: string) =>
      `${apiBase}?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&action=${action}`;

    log("Fetching live catalog", { host: creds.host, userId: user.id });

    const [catRes, streamRes] = await Promise.all([
      fetch(qs("get_live_categories")),
      fetch(qs("get_live_streams")),
    ]);

    if (!streamRes.ok) {
      const body = await streamRes.text().catch(() => "");
      log("player_api live streams failed", {
        status: streamRes.status,
        body: body.slice(0, 500),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "provider_unavailable",
          message: `Xtream panel returned ${streamRes.status}`,
          channels: [],
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const categoriesRaw = catRes.ok ? await catRes.json() : [];
    const streamsRaw = await streamRes.json();

    const categoryMap = new Map<string, string>();
    if (Array.isArray(categoriesRaw)) {
      for (const c of categoriesRaw) {
        if (c?.category_id != null) {
          categoryMap.set(String(c.category_id), String(c.category_name || "Live"));
        }
      }
    }

    const channels = (Array.isArray(streamsRaw) ? streamsRaw : [])
      .map((s: Record<string, unknown>, index: number) => {
        const streamId = s.stream_id ?? s.id ?? index + 1;
        const categoryId = s.category_id != null ? String(s.category_id) : "";
        return {
          id: Number(streamId) || index + 1,
          name: String(s.name || s.stream_display_name || `Channel ${streamId}`),
          category: categoryMap.get(categoryId) || "Live",
          logo: String(s.stream_icon || s.logo || ""),
          url: buildLiveUrl(creds.host, creds.username, creds.password, streamId as string | number),
          description: categoryMap.get(categoryId) || "Live TV",
          epg_id: s.epg_channel_id ? String(s.epg_channel_id) : undefined,
          stream_id: Number(streamId) || undefined,
        };
      })
      .filter((c: { url: string }) => Boolean(c.url));

    // Optional limit via query body
    let limit = 500;
    try {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        if (body?.limit && Number(body.limit) > 0) {
          limit = Math.min(Number(body.limit), 5000);
        }
      }
    } catch {
      /* ignore */
    }

    const clipped = channels.slice(0, limit);

    return new Response(
      JSON.stringify({
        success: true,
        host: creds.host,
        username: creds.username,
        total: channels.length,
        returned: clipped.length,
        channels: clipped,
        playlistUrls: {
          m3u: `${creds.host}/get.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&type=m3u_plus&output=ts`,
        },
        interimFirestick: {
          player: "TiviMate",
          note: "Stock TiviMate remains the supported Fire Stick path until SteadyStream TV shell ships.",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    log("Unhandled error", { error: String(error) });
    return new Response(
      JSON.stringify({
        success: false,
        error: "internal_error",
        message: error instanceof Error ? error.message : "Unknown error",
        channels: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
