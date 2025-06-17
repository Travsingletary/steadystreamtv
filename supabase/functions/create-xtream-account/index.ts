
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
    const { userId, planType, email, name, useMegaOTT = true } = await req.json();

    console.log('Creating subscription for:', { userId, planType, email, useMegaOTT });

    if (!userId || !planType || !email || !name) {
      throw new Error("Missing required parameters");
    }

    // Use the new MegaOTT function from the database
    const { data: result, error } = await supabase
      .rpc('create_megaott_subscription_v2', {
        user_id_param: userId,
        customer_email: email,
        customer_name: name,
        plan_type: planType,
        stripe_session_id: null
      });

    if (error) {
      console.error('Database function error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!result.success) {
      console.error('MegaOTT API error:', result.error);
      throw new Error(result.error || 'Failed to create MegaOTT subscription');
    }

    console.log('MegaOTT subscription created successfully:', result);

    return new Response(JSON.stringify({
      success: true,
      message: "IPTV account created successfully",
      data: {
        megaott_subscription_id: result.subscription_id,
        username: result.credentials.username,
        password: result.credentials.password,
        server_url: result.credentials.server_url,
        playlist_url: result.credentials.playlist_url,
        max_connections: result.credentials.max_connections,
        expiration_date: result.credentials.expiration_date,
        package: result.credentials.package
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in create-xtream-account function:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Failed to create IPTV account"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
