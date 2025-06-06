
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

serve(async (req) => {
  console.log("=== WEBHOOK DEBUG START ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Timestamp:", new Date().toISOString());
  
  // Log ALL headers to see what Stripe is actually sending
  console.log("=== ALL HEADERS ===");
  for (const [key, value] of req.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  
  // Check environment variables
  const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  
  console.log("=== ENVIRONMENT CHECK ===");
  console.log("- STRIPE_WEBHOOK_SECRET exists:", !!endpointSecret);
  console.log("- STRIPE_SECRET_KEY exists:", !!stripeSecretKey);
  console.log("- Webhook secret length:", endpointSecret?.length || 0);
  console.log("- Webhook secret starts with whsec_:", endpointSecret?.startsWith('whsec_') || false);
  
  // Check signature headers specifically
  const stripeSignature = req.headers.get("stripe-signature");
  const altSignature = req.headers.get("x-stripe-signature");
  console.log("=== SIGNATURE CHECK ===");
  console.log("- Stripe signature header:", stripeSignature);
  console.log("- Alt signature header:", altSignature);
  console.log("- User-Agent:", req.headers.get("user-agent"));
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature"
      }
    });
  }

  // Basic validation - but let's see what we're getting first
  if (!stripeSignature && !altSignature) {
    console.log("❌ NO SIGNATURE FOUND");
    
    // Still return debug info even without signature
    return new Response(JSON.stringify({
      error: "Missing stripe signature",
      debug: {
        method: req.method,
        hasEndpointSecret: !!endpointSecret,
        hasStripeSignature: !!stripeSignature,
        hasAltSignature: !!altSignature,
        userAgent: req.headers.get("user-agent"),
        allHeaders: Object.fromEntries(req.headers.entries()),
        timestamp: new Date().toISOString()
      }
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  if (!endpointSecret) {
    console.log("❌ NO ENDPOINT SECRET CONFIGURED");
    return new Response(JSON.stringify({
      error: "Webhook endpoint secret not configured",
      debug: {
        hasSignature: !!stripeSignature,
        hasSecret: !!endpointSecret
      }
    }), {
      status: 500,
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
    console.log("=== REQUEST BODY ===");
    console.log("- Body length:", body.length);
    console.log("- Body preview:", body.substring(0, 200) + "...");
    
    const sig = stripeSignature || altSignature;
    console.log("=== WEBHOOK VERIFICATION ===");
    console.log("- Using signature:", sig?.substring(0, 20) + "...");
    
    const event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
    console.log("✅ WEBHOOK VERIFIED SUCCESSFULLY!");
    console.log("- Event type:", event.type);
    console.log("- Event ID:", event.id);
    
    // Log the event data for debugging
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("=== CHECKOUT SESSION ===");
      console.log("- Session ID:", session.id);
      console.log("- Customer email:", session.customer_email);
      console.log("- Payment status:", session.payment_status);
      console.log("- Success URL:", session.success_url);
    }
    
    return new Response(JSON.stringify({
      success: true,
      eventType: event.type,
      eventId: event.id,
      message: "Webhook verified and processed successfully!"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.log("❌ WEBHOOK VERIFICATION FAILED");
    console.log("- Error message:", error.message);
    console.log("- Error type:", error.constructor.name);
    
    return new Response(JSON.stringify({
      error: "Webhook verification failed",
      message: error.message,
      debug: {
        hasSignature: !!stripeSignature,
        hasAltSignature: !!altSignature,
        signatureLength: (stripeSignature || altSignature)?.length || 0,
        secretLength: endpointSecret?.length || 0,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
