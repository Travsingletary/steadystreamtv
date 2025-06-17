
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return new Response('Missing signature or webhook secret', { status: 400 });
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('Webhook processed', { status: 200 });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
});

async function handleCheckoutCompleted(session: any, supabase: any) {
  console.log('Processing checkout completion:', session.id);

  try {
    // Update checkout session status
    await supabase
      .from('checkout_sessions')
      .update({ 
        status: 'completed',
        stripe_customer_id: session.customer,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', session.id);

    // Create MegaOTT subscription if needed
    if (session.metadata?.userId) {
      await createMegaOTTSubscription(session.metadata.userId, session.metadata.planName, supabase);
    }

  } catch (error) {
    console.error('Checkout completion handling failed:', error);
  }
}

async function handleSubscriptionCreated(subscription: any, supabase: any) {
  console.log('Processing subscription creation:', subscription.id);

  try {
    const userId = subscription.metadata?.userId;
    const planName = subscription.metadata?.planName;

    if (!userId) {
      console.error('No user ID in subscription metadata');
      return;
    }

    // Store subscription in database
    await supabase
      .from('stripe_subscriptions')
      .insert({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        user_id: userId,
        plan_name: planName,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        amount: subscription.items.data[0]?.price?.unit_amount || 0,
        currency: subscription.currency,
      });

    // Update user profile
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_tier: planName,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

  } catch (error) {
    console.error('Subscription creation handling failed:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  console.log('Processing subscription update:', subscription.id);

  try {
    // Update subscription in database
    await supabase
      .from('stripe_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    // Update user profile if status changed
    if (subscription.metadata?.userId) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: subscription.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.metadata.userId);
    }

  } catch (error) {
    console.error('Subscription update handling failed:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  console.log('Processing subscription deletion:', subscription.id);

  try {
    // Update subscription status
    await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    // Update user profile
    if (subscription.metadata?.userId) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.metadata.userId);
    }

  } catch (error) {
    console.error('Subscription deletion handling failed:', error);
  }
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  console.log('Processing successful payment:', invoice.id);

  try {
    // Record payment in database
    await supabase
      .from('payments')
      .insert({
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: invoice.subscription,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
      });

  } catch (error) {
    console.error('Payment success handling failed:', error);
  }
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  console.log('Processing failed payment:', invoice.id);

  try {
    // Record failed payment
    await supabase
      .from('payments')
      .insert({
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: invoice.subscription,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
      });

  } catch (error) {
    console.error('Payment failure handling failed:', error);
  }
}

async function createMegaOTTSubscription(userId: string, planName: string, supabase: any) {
  try {
    console.log(`Creating MegaOTT subscription for user ${userId}, plan ${planName}`);

    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Use existing MegaOTT function
    const { data: megaOttResult, error } = await supabase.rpc('create_megaott_subscription_v2', {
      user_id_param: userId,
      customer_email: user.email,
      customer_name: user.name || 'SteadyStream User',
      plan_type: planName.toLowerCase(),
      stripe_session_id: null
    });

    if (error) {
      console.error('MegaOTT subscription creation failed:', error);
      return;
    }

    console.log('MegaOTT subscription created successfully:', megaOttResult);

    // Store in new megaott_subscriptions table
    await supabase
      .from('megaott_subscriptions')
      .insert({
        user_id: userId,
        megaott_subscription_id: megaOttResult.subscription_id,
        plan_name: planName,
        status: 'active',
      });

  } catch (error) {
    console.error('MegaOTT subscription creation failed:', error);
  }
}
