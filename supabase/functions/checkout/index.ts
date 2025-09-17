import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  plan_id: string;
  user_id: string;
  amount: number;
  currency?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { plan_id, user_id, amount, currency = 'usd' }: CheckoutRequest = await req.json();

    if (!plan_id || !user_id || !amount) {
      throw new Error('Missing required fields: plan_id, user_id, amount');
    }

    console.log('Creating checkout for:', { plan_id, user_id, amount, currency });

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id,
        plan_id,
        amount,
        currency,
        status: 'pending',
        provider: 'stripe',
        metadata: { created_via: 'checkout_api' }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      throw new Error(`Failed to create payment: ${paymentError.message}`);
    }

    // Create Stripe checkout session
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const frontendUrl = Deno.env.get('FRONTEND_URL') || Deno.env.get('SITE_URL') || 'https://your-site.com';

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'line_items[0][price_data][currency]': currency,
        'line_items[0][price_data][product_data][name]': `IPTV Subscription - ${plan_id}`,
        'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)), // Convert to cents
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${frontendUrl}/dashboard`,
        'client_reference_id': user_id,
        'metadata[payment_id]': payment.id,
        'metadata[plan_id]': plan_id,
      })
    });

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text();
      console.error('Stripe API error:', error);
      throw new Error(`Stripe error: ${stripeResponse.status} - ${error}`);
    }

    const stripeSession = await stripeResponse.json();

    // Update payment record with Stripe session info
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        provider_payment_id: stripeSession.id,
        metadata: {
          ...payment.metadata,
          stripe_session_id: stripeSession.id
        }
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment with session ID:', updateError);
    }

    console.log('Checkout session created:', stripeSession.id);

    return new Response(
      JSON.stringify({
        checkout_url: stripeSession.url,
        payment_id: payment.id,
        session_id: stripeSession.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});