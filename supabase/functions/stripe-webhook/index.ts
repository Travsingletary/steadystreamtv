
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    console.log("Processing Stripe event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing completed checkout session:", session.id);
      
      // Get customer email and plan info
      const customerEmail = session.customer_details?.email;
      const planType = session.metadata?.plan || "standard";
      
      if (!customerEmail) {
        console.error("No customer email found in session");
        return new Response("No customer email", { status: 400 });
      }

      // Find or create user
      let user;
      try {
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(customerEmail);
        user = existingUser.user;
        
        if (!user) {
          // Create user if doesn't exist
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: customerEmail,
            email_confirm: true,
            user_metadata: {
              plan: planType,
              stripe_session_id: session.id
            }
          });
          
          if (createError) throw createError;
          user = newUser.user;
        }
      } catch (error) {
        console.error("Error handling user:", error);
        return new Response("User handling failed", { status: 500 });
      }

      try {
        // Create MegaOTT subscription using the new function
        const { data: megaottResult, error: megaottError } = await supabase
          .rpc('create_megaott_subscription_v2', {
            user_id_param: user!.id,
            customer_email: customerEmail,
            customer_name: session.customer_details?.name || 'Unknown',
            plan_type: planType,
            stripe_session_id: session.id
          });

        if (megaottError) {
          console.error('Error creating MegaOTT subscription:', megaottError);
          throw megaottError;
        }

        if (!megaottResult.success) {
          console.error('MegaOTT subscription creation failed:', megaottResult.error);
          throw new Error(megaottResult.error);
        }

        console.log("MegaOTT subscription created successfully:", megaottResult);

        // Update purchase automation log
        await supabase.from("purchase_automations").insert({
          user_id: user!.id,
          stripe_session_id: session.id,
          payment_intent_id: session.payment_intent,
          automation_status: "completed",
          megaott_response: megaottResult
        });

      } catch (error) {
        console.error("MegaOTT automation failed:", error);
        
        // Log the failure
        await supabase.from("purchase_automations").insert({
          user_id: user!.id,
          stripe_session_id: session.id,
          automation_status: "failed",
          error_message: error.message
        });
      }
    }

    // Handle subscription status changes
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase
        .from('iptv_accounts')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('stripe_session_id', invoice.subscription);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('iptv_accounts')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('stripe_session_id', subscription.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
