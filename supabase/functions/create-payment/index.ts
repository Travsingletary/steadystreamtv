import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePaymentRequest {
  planType: string;
  customerEmail: string;
  customerName: string;
}

const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const payload: CreatePaymentRequest = await req.json();
    log("Crypto payment request received", { planType: payload.planType, email: payload.customerEmail });

    // Plan mapping for crypto payments
    const planPricing = {
      'basic': { price: 15, name: 'Basic Plan' },
      'standard': { price: 15, name: 'Standard Plan' },
      'premium': { price: 25, name: 'Premium Plan' },
      'ultimate': { price: 35, name: 'Ultimate Plan' },
      'duo': { price: 25, name: 'Duo Plan' },
      'family': { price: 35, name: 'Family Plan' }
    };

    const selectedPlan = planPricing[payload.planType as keyof typeof planPricing];
    
    if (!selectedPlan) {
      log("Invalid plan type", { planType: payload.planType });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid plan type',
          availablePlans: Object.keys(planPricing)
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get NowPayments API key
    const nowPaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    if (!nowPaymentsApiKey) {
      log("ERROR: Missing NowPayments API key");
      return new Response(
        JSON.stringify({
          error: 'Payment system configuration error',
          detail: 'NOWPAYMENTS_API_KEY not configured'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create NowPayments invoice
    const paymentData = {
      price_amount: selectedPlan.price,
      price_currency: 'USD',
      pay_currency: '', // Let user choose crypto
      order_id: `ss_${Date.now()}_${payload.planType}`,
      order_description: `SteadyStream TV - ${selectedPlan.name}`,
      success_url: `${Deno.env.get('FRONTEND_URL') || 'https://steadystreamtv.com'}/payment-success`,
      cancel_url: `${Deno.env.get('FRONTEND_URL') || 'https://steadystreamtv.com'}/onboarding`,
      customer_email: payload.customerEmail
    };

    log("Creating NowPayments invoice", { paymentData });

    const nowPaymentsResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': nowPaymentsApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const invoiceData = await nowPaymentsResponse.json();

    if (!nowPaymentsResponse.ok) {
      log("NowPayments API error", { error: invoiceData });
      return new Response(
        JSON.stringify({
          error: 'Failed to create crypto payment',
          detail: invoiceData.message || 'Unknown error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    log("NowPayments invoice created successfully", { invoiceId: invoiceData.id });

    return new Response(
      JSON.stringify({
        url: invoiceData.invoice_url,
        invoiceId: invoiceData.id,
        amount: selectedPlan.price,
        currency: 'USD',
        planType: payload.planType
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    log("ERROR: Unexpected error in create-payment", { error });
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});