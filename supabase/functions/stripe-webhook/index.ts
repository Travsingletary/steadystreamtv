
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

serve(async (req) => {
  console.log("=== WEBHOOK DEBUG START ===");
  
  // Check environment variables
  const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  
  console.log("Environment check:");
  console.log("- STRIPE_WEBHOOK_SECRET exists:", !!endpointSecret);
  console.log("- STRIPE_SECRET_KEY exists:", !!stripeSecretKey);
  console.log("- Webhook secret length:", endpointSecret?.length || 0);
  console.log("- Webhook secret starts with whsec_:", endpointSecret?.startsWith('whsec_') || false);
  
  // Check request headers
  const sig = req.headers.get("stripe-signature");
  console.log("- Stripe signature exists:", !!sig);
  console.log("- Request method:", req.method);
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });
  }

  // Basic validation
  if (!sig || !endpointSecret) {
    console.log("FAILING: Missing signature or endpoint secret");
    console.log("- sig exists:", !!sig);
    console.log("- endpointSecret exists:", !!endpointSecret);
    
    return new Response(JSON.stringify({
      error: "Missing signature or endpoint secret",
      debug: {
        hasSignature: !!sig,
        hasSecret: !!endpointSecret,
        secretLength: endpointSecret?.length || 0
      }
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // Try to parse the webhook
  try {
    const stripe = new Stripe(stripeSecretKey || '', {
      apiVersion: '2023-10-16'
    });
    
    const body = await req.text();
    console.log("- Request body length:", body.length);
    
    const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    console.log("SUCCESS: Webhook verified! Event type:", event.type);
    
    return new Response(JSON.stringify({
      success: true,
      eventType: event.type,
      message: "Webhook verified successfully!"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.log("WEBHOOK VERIFICATION FAILED:", error.message);
    
    return new Response(JSON.stringify({
      error: "Webhook verification failed",
      message: error.message
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
