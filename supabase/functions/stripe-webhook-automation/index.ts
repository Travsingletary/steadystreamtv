
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    logStep("Processing Stripe event", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("Processing completed checkout session", { sessionId: session.id });
      
      const customerEmail = session.customer_details?.email;
      const customerName = session.customer_details?.name || 'SteadyStream User';
      const planType = session.metadata?.plan_type || "basic";
      
      if (!customerEmail) {
        logStep("No customer email found in session");
        return new Response("No customer email", { status: 400 });
      }

      // Initialize automation tracking
      await supabase.from("purchase_automations").insert({
        user_id: null,
        stripe_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        automation_status: "processing",
      });

      try {
        // Step 1: Create MegaOTT subscription
        logStep("Creating MegaOTT subscription", { email: customerEmail, plan: planType });
        
        const megaottResult = await createMegaOTTAccount(customerEmail, customerName, planType);
        
        if (!megaottResult.success) {
          throw new Error(`MegaOTT creation failed: ${megaottResult.error}`);
        }

        logStep("MegaOTT subscription created successfully", megaottResult);

        // Step 2: Send welcome email with credentials
        logStep("Sending welcome email");
        await sendWelcomeEmail(customerEmail, customerName, megaottResult.credentials, planType);

        // Step 3: Update automation status
        await supabase.from("purchase_automations").update({
          automation_status: "completed",
          megaott_response: megaottResult,
          email_sent: true,
        }).eq("stripe_session_id", session.id);

        logStep("Automation completed successfully");

      } catch (error) {
        logStep("Automation failed", { error: error.message });
        
        await supabase.from("purchase_automations").update({
          automation_status: "failed",
          error_message: error.message,
        }).eq("stripe_session_id", session.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Webhook error", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function createMegaOTTAccount(email: string, name: string, planType: string) {
  const MEGAOTT_API_TOKEN = "411|LglDT244VcSuG75GXMAmsqm7IiCG8E3GTvFd23QR89d97e12";
  const API_URL = "https://megaott.net/api/v1/subscriptions";
  
  // Generate unique username
  const username = `steady_${Date.now()}`;
  
  // Map plan types to package IDs
  const packageMapping = {
    'trial': { id: 1, connections: 1 },
    'basic': { id: 1, connections: 1 },
    'standard': { id: 2, connections: 2 },
    'premium': { id: 3, connections: 4 },
    'ultimate': { id: 4, connections: 6 }
  };
  
  const packageInfo = packageMapping[planType] || packageMapping['basic'];
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MEGAOTT_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        type: 'M3U',
        username: username,
        package_id: packageInfo.id.toString(),
        max_connections: packageInfo.connections.toString(),
        forced_country: 'ALL',
        adult: planType === 'ultimate' ? 'true' : 'false',
        note: `SteadyStream TV - ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        enable_vpn: 'true',
        paid: 'true'
      }),
    });

    if (!response.ok) {
      throw new Error(`MegaOTT API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    // Generate activation code
    const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    return {
      success: true,
      credentials: {
        username: result.username || username,
        password: result.password,
        server_url: result.dns_link,
        playlist_url: `${result.dns_link}/get.php?username=${result.username || username}&password=${result.password}&type=m3u_plus`,
        activationCode: activationCode,
        expiration: result.expiring_at,
        maxConnections: packageInfo.connections
      },
      megaottResponse: result
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function sendWelcomeEmail(email: string, name: string, credentials: any, planType: string) {
  const emailPayload = {
    to: email,
    subject: "🎉 Welcome to SteadyStream TV - Your IPTV Credentials Are Ready!",
    name: name,
    credentials: credentials,
    planType: planType
  };

  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-welcome-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    throw new Error(`Email service error: ${response.status}`);
  }

  return await response.json();
}
