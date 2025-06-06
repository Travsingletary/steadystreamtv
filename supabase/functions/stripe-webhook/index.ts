
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("=== WEBHOOK DEBUG START ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Timestamp:", new Date().toISOString());

  try {
    // Environment check
    console.log("=== ENVIRONMENT CHECK ===");
    console.log("- STRIPE_WEBHOOK_SECRET exists:", !!Deno.env.get('STRIPE_WEBHOOK_SECRET'));
    console.log("- STRIPE_SECRET_KEY exists:", !!Deno.env.get('STRIPE_SECRET_KEY'));

    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeWebhookSecret || !stripeSecretKey) {
      console.error("❌ Missing Stripe environment variables");
      throw new Error('Missing Stripe configuration');
    }

    console.log("- Webhook secret length:", stripeWebhookSecret.length);
    console.log("- Webhook secret starts with whsec_:", stripeWebhookSecret.startsWith('whsec_'));

    // Import Stripe
    const stripe = (await import('https://esm.sh/stripe@13.11.0?target=deno')).default(stripeSecretKey);

    // Get request details
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    console.log("=== SIGNATURE CHECK ===");
    console.log("- Stripe signature header:", signature);
    console.log("- Alt signature header:", req.headers.get('stripe-signature') || req.headers.get('Stripe-Signature'));
    console.log("- User-Agent:", req.headers.get('user-agent'));

    console.log("=== REQUEST BODY ===");
    console.log("- Body length:", body.length);
    console.log("- Body preview:", body.substring(0, 200) + "...");

    if (!signature) {
      console.error("❌ No Stripe signature found");
      throw new Error('No Stripe signature found');
    }

    // SECURITY FIX: Use constructEventAsync instead of constructEvent
    console.log("=== WEBHOOK VERIFICATION ===");
    console.log("- Using signature:", signature.substring(0, 20) + "...");
    
    let event;
    try {
      // Use the async version to avoid SubtleCryptoProvider sync context errors
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
      console.log("✅ WEBHOOK VERIFICATION SUCCESSFUL");
      console.log("- Event type:", event.type);
      console.log("- Event ID:", event.id);
    } catch (err) {
      console.log("❌ WEBHOOK VERIFICATION FAILED");
      console.log("- Error type:", err.constructor.name);
      console.log("- Error message:", err.message);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== PROCESSING EVENT ===");
    console.log("- Event type:", event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log("💳 Payment succeeded:", paymentIntent.id);
        
        // Update user subscription status
        if (paymentIntent.metadata?.userId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              stripe_customer_id: paymentIntent.customer,
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentIntent.metadata.userId);

          if (error) {
            console.error("❌ Failed to update user profile:", error);
          } else {
            console.log("✅ User profile updated successfully");
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log("📋 Subscription event:", subscription.id);
        
        // Update subscription details
        if (subscription.metadata?.userId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: subscription.status,
              subscription_tier: subscription.metadata.tier || 'basic',
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.metadata.userId);

          if (error) {
            console.error("❌ Failed to update subscription:", error);
          } else {
            console.log("✅ Subscription updated successfully");
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log("🗑️ Subscription cancelled:", subscription.id);
        
        // Update subscription status to cancelled
        if (subscription.metadata?.userId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.metadata.userId);

          if (error) {
            console.error("❌ Failed to cancel subscription:", error);
          } else {
            console.log("✅ Subscription cancelled successfully");
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log("💸 Payment failed:", invoice.id);
        
        // Handle failed payment - could update user status or send notification
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    console.log("✅ WEBHOOK PROCESSING COMPLETE");
    
    return new Response(
      JSON.stringify({ received: true, eventType: event.type }), 
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error("💥 WEBHOOK ERROR:", error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed', 
        message: error.message 
      }), 
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
