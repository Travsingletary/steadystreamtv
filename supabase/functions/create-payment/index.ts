import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePaymentRequest {
  customerEmail: string;
  customerName: string;
  planType: string;
}

// Plan mapping for crypto payments
const planPricing = {
  standard: { price_usd: 15, name: "Standard Plan", duration_months: 1 },
  premium: { price_usd: 25, name: "Premium Plan", duration_months: 1 },
  ultimate: { price_usd: 35, name: "Ultimate Plan", duration_months: 1 }
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: CreatePaymentRequest = await req.json();
    
    console.log('Creating crypto payment for:', { 
      email: payload.customerEmail, 
      plan: payload.planType 
    });

    // Validate plan type
    if (!planPricing[payload.planType as keyof typeof planPricing]) {
      throw new Error(`Invalid plan type: ${payload.planType}`);
    }

    const planDetails = planPricing[payload.planType as keyof typeof planPricing];

    // Create payment session in database
    const { data: session, error: sessionError } = await supabase
      .from('checkout_sessions')
      .insert({
        session_id: crypto.randomUUID(),
        plan_name: planDetails.name,
        amount: planDetails.price_usd * 100, // Store in cents
        status: 'pending'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to create checkout session:', sessionError);
      throw new Error('Failed to create payment session');
    }

    // Generate crypto payment URL using NowPayments API
    const nowPaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://steadystreamtv.com';
    
    if (!nowPaymentsApiKey) {
      throw new Error('NowPayments API key not configured');
    }

    const paymentData = {
      price_amount: planDetails.price_usd,
      price_currency: 'USD',
      pay_currency: 'btc', // Default to Bitcoin
      order_id: session.session_id,
      order_description: `${planDetails.name} - SteadyStream TV`,
      success_url: `${frontendUrl}/payment-success?session_id=${session.session_id}`,
      cancel_url: `${frontendUrl}/onboarding?step=subscription`
    };

    const nowPaymentsResponse = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': nowPaymentsApiKey
      },
      body: JSON.stringify(paymentData)
    });

    if (!nowPaymentsResponse.ok) {
      const errorData = await nowPaymentsResponse.text();
      console.error('NowPayments API error:', errorData);
      throw new Error('Failed to create crypto payment');
    }

    const paymentResult = await nowPaymentsResponse.json();
    
    console.log('Crypto payment created successfully:', {
      paymentId: paymentResult.payment_id,
      payUrl: paymentResult.pay_url
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: paymentResult.pay_url,
        sessionId: session.session_id,
        paymentId: paymentResult.payment_id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Create payment error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'PAYMENT_CREATION_FAILED'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});