
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@14.21.0";

// Webhook signature verification is essential for security
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

// Configure CORS headers to allow Stripe to send events
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function for consistent logging
const log = (message: string, data?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${message}`, data ? JSON.stringify(data) : '');
};

// Helper function to invoke other edge functions
async function invokeFunction(functionName: string, payload: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseKey
  );

  try {
    const { data, error } = await supabaseAdmin.functions.invoke(functionName, {
      body: payload
    });

    if (error) throw error;
    return data;
  } catch (error) {
    log(`Failed to invoke ${functionName}:`, error);
    throw error;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // DEBUG: Log environment variables
    console.log("DEBUG: Environment check:");
    console.log("- STRIPE_WEBHOOK_SECRET exists:", !!endpointSecret);
    console.log("- STRIPE_SECRET_KEY exists:", !!stripeSecretKey);
    console.log("- Webhook secret length:", endpointSecret?.length || 0);
    console.log("- Webhook secret starts with whsec_:", endpointSecret?.startsWith('whsec_') || false);

    // Initialize Stripe and Supabase
    const stripe = new Stripe(stripeSecretKey || '', { apiVersion: '2023-10-16' });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseKey
    );

    // Get the signature from the headers
    const sig = req.headers.get("stripe-signature");
    console.log("DEBUG: Stripe signature exists:", !!sig);
    
    if (!sig || !endpointSecret) {
      console.log("FAILING: Missing signature or endpoint secret");
      console.log("- sig exists:", !!sig);
      console.log("- endpointSecret exists:", !!endpointSecret);
      
      return new Response(JSON.stringify({ error: "Missing signature or endpoint secret" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get the request body
    const body = await req.text();
    console.log("DEBUG: Request body length:", body.length);
    let event;

    // Verify the event with the signature
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
      log("Webhook verified:", { type: event.type });
    } catch (err: any) {
      log("Webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        log("Checkout session completed:", { sessionId: session.id });

        // Extract customer and subscription details
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        
        if (!customerId || !subscriptionId) {
          log("Missing customer ID or subscription ID", { customerId, subscriptionId });
          break;
        }

        // Get customer details
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          log("Customer was deleted", { customerId });
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const planId = subscription.items.data[0].price.id;
        
        // Get user by customer email
        const { data: userData, error: userError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', session.client_reference_id || '')
          .single();
          
        if (userError || !userData) {
          log("User not found:", { error: userError, clientRefId: session.client_reference_id });
          break;
        }

        log("User found:", { userId: userData.id, email: customer.email });

        // Map Stripe price to MegaOTT package
        // Here we determine the plan details based on the price
        const planMapping: Record<string, any> = {
          'standard': { packageId: 1, maxConnections: 2 },
          'premium': { packageId: 2, maxConnections: 4 },
          'ultimate': { packageId: 3, maxConnections: 6 },
        };

        const userPlan = userData.subscription_tier || 'standard';
        const planDetails = planMapping[userPlan];

        if (!planDetails) {
          log("Invalid plan type:", { planType: userPlan });
          break;
        }

        // Create IPTV account
        try {
          log("Creating IPTV account", { userId: userData.id, plan: userPlan });
          
          const iptv = await invokeFunction('create-xtream-account', {
            userId: userData.id,
            planType: userPlan,
            email: customer.email,
            name: userData.name || customer.name || customer.email
          });
          
          log("IPTV account created:", { iptv });

          // Update user profile with Stripe info
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', userData.id);

          if (updateError) {
            log("Error updating user profile:", updateError);
            throw updateError;
          }
          
          // Send welcome email with account details
          try {
            await invokeFunction('send-welcome-email', {
              userId: userData.id,
              email: customer.email,
              name: userData.name || customer.name || customer.email,
              iptv: iptv
            });
            log("Welcome email sent");
          } catch (emailError) {
            log("Failed to send welcome email:", emailError);
            // Non-critical error, don't throw
          }
        } catch (error) {
          log("Error in IPTV account creation flow:", error);
          // We don't rethrow here to avoid webhook retries that might create duplicate accounts
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        log("Subscription updated:", { subscriptionId: subscription.id });

        // Update subscription status in our database
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id);
          
        if (profilesError || !profiles.length) {
          log("User not found for subscription:", { subscriptionId: subscription.id, error: profilesError });
          break;
        }

        const userId = profiles[0].id;
        
        // Update subscription status
        const subscriptionStatus = subscription.status === 'active' ? 'active' : 
                                  subscription.status === 'canceled' ? 'canceled' : 
                                  subscription.status === 'past_due' ? 'past_due' : 'inactive';
        
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: subscriptionStatus,
            trial_end_date: subscription.trial_end ? 
              new Date(subscription.trial_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          log("Error updating subscription status:", updateError);
          throw updateError;
        }
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        log("Subscription canceled:", { subscriptionId: subscription.id });

        // Find user by subscription ID
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id);
          
        if (profilesError || !profiles.length) {
          log("User not found for subscription:", { subscriptionId: subscription.id, error: profilesError });
          break;
        }

        const userId = profiles[0].id;
        
        // Update subscription status
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          log("Error updating subscription status:", updateError);
          throw updateError;
        }
        
        break;
      }

      // Add more event types as needed

      default:
        log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    log("Error processing webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
