
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
    const { email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Get subscription from the new subscriptions table
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('customer_email', email)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return new Response(JSON.stringify({
        success: false,
        error: "No active subscription found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        status: subscription.status,
        username: subscription.megaott_username,
        password: subscription.megaott_password,
        expires_at: subscription.expiration_date,
        max_connections: subscription.max_connections || 1,
        plan_type: subscription.plan_type,
        server_url: subscription.server_url,
        playlist_url: subscription.playlist_url
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
