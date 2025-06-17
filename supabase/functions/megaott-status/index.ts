
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Get subscription from our database
    const { data: account, error } = await supabase
      .from('iptv_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching account:', error);
      return new Response(JSON.stringify({
        success: false,
        error: "No subscription found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        status: account.status,
        username: account.username,
        expires_at: account.expires_at,
        max_connections: account.max_connections || 1,
        plan_type: account.plan_type,
        server_url: account.server_url,
        playlist_url: account.playlist_url
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in megaott-status function:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Failed to get subscription status"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
