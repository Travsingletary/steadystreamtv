import { supabase } from "@/integrations/supabase/client";
import type { Channel } from "./channelService";

export type XtreamCredentials = {
  username: string;
  password: string;
  host: string;
  m3uUrl?: string;
};

export type XtreamCatalogResult = {
  success: boolean;
  channels: Channel[];
  error?: string;
  message?: string;
  host?: string;
  username?: string;
  total?: number;
  playlistUrls?: { m3u?: string };
};

const DEFAULT_HOST = "https://megaott.net";

function normalizeHost(raw?: string | null): string {
  if (!raw?.trim()) return DEFAULT_HOST;
  let host = raw.trim().replace(/\/$/, "");
  if (host.includes("get.php") || host.includes("player_api.php")) {
    try {
      const u = new URL(host.startsWith("http") ? host : `http://${host}`);
      return `${u.protocol}//${u.host}`;
    } catch {
      return DEFAULT_HOST;
    }
  }
  if (!/^https?:\/\//i.test(host)) host = `http://${host}`;
  return host.replace(/\/$/, "");
}

/** Resolve provisioned MegaOTT / Xtream credentials for the signed-in user. */
export async function getXtreamCredentials(): Promise<XtreamCredentials | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: subs } = await supabase
    .from("subscriptions")
    .select(
      "iptv_username, iptv_password, m3u_url, dns_link, xtream_url, portal_link, status, active, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const active = (subs || []).find(
    (s) =>
      s.iptv_username &&
      s.iptv_password &&
      (s.status === "active" || s.active === true || !s.status),
  );

  if (active?.iptv_username && active?.iptv_password) {
    const host = normalizeHost(
      active.dns_link || active.xtream_url || active.portal_link || active.m3u_url,
    );
    return {
      username: active.iptv_username,
      password: active.iptv_password,
      host,
      m3uUrl:
        active.m3u_url ||
        `${host}/get.php?username=${encodeURIComponent(active.iptv_username)}&password=${encodeURIComponent(active.iptv_password)}&type=m3u_plus&output=ts`,
    };
  }

  // Soft fallback for environments that still put credentials on profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    const row = profile as Record<string, unknown>;
    const username = String(
      row.xtream_username || row.megaott_username || row.iptv_username || "",
    );
    const password = String(row.xtream_password || row.iptv_password || "");
    if (username && password) {
      const host = normalizeHost(
        String(row.xtream_server || row.xtream_url || row.dns_link || ""),
      );
      return {
        username,
        password,
        host,
        m3uUrl: `${host}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`,
      };
    }
  }

  return null;
}

/**
 * Load live channels via Supabase edge proxy (preferred — avoids CORS).
 * Falls back to empty + error code when credentials or proxy are missing.
 */
export async function fetchXtreamChannels(
  limit = 500,
): Promise<XtreamCatalogResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      success: false,
      channels: [],
      error: "not_authenticated",
      message: "Sign in to load your provisioned playlist.",
    };
  }

  const { data, error } = await supabase.functions.invoke("xtream-channels", {
    body: { limit },
  });

  if (error) {
    console.error("xtream-channels invoke failed", error);
    return {
      success: false,
      channels: [],
      error: "proxy_failed",
      message:
        error.message ||
        "Could not reach Xtream proxy. Deploy supabase/functions/xtream-channels or use TiviMate with your M3U URL.",
    };
  }

  const payload = data as XtreamCatalogResult & {
    channels?: Channel[];
  };

  return {
    success: Boolean(payload?.success),
    channels: Array.isArray(payload?.channels) ? payload.channels : [],
    error: payload?.error,
    message: payload?.message,
    host: payload?.host,
    username: payload?.username,
    total: payload?.total,
    playlistUrls: payload?.playlistUrls,
  };
}

export function buildM3uUrl(creds: XtreamCredentials): string {
  return (
    creds.m3uUrl ||
    `${creds.host}/get.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&type=m3u_plus&output=ts`
  );
}
