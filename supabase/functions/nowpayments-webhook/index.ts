import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Sort object keys recursively for HMAC verification
function sortObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sortObject(item));
  }

  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: any = {};

  for (const key of sortedKeys) {
    sortedObj[key] = sortObject(obj[key]);
  }

  return sortedObj;
}

interface NOWPaymentsWebhookPayload {
  payment_id: string;
  invoice_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  outcome_amount: number;
  outcome_currency: string;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // Get the webhook payload
    const payload: NOWPaymentsWebhookPayload = await req.json();

    console.log('Received NOWPayments webhook:', payload);

    // Verify webhook signature for security
    const receivedSignature = req.headers.get('x-nowpayments-sig');
    const ipnSecretKey = Deno.env.get('NOWPAYMENTS_IPN_SECRET_KEY');

    if (!receivedSignature || !ipnSecretKey) {
      console.error('Missing signature or IPN secret key');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Verify HMAC signature according to NOWPayments docs
    const sortedPayload = sortObject(payload);
    const sortedJson = JSON.stringify(sortedPayload);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(ipnSecretKey),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(sortedJson));
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature !== receivedSignature) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    console.log('Webhook signature verified successfully');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update payment record in database
    const { error: updateError } = await supabase
      .from('nowpayments_records')
      .update({
        payment_status: payload.payment_status,
        actually_paid: payload.actually_paid,
        outcome_amount: payload.outcome_amount,
        outcome_currency: payload.outcome_currency,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', payload.payment_id);

    if (updateError) {
      console.error('Failed to update payment record:', updateError);
      throw updateError;
    }

    console.log('Updated payment record for payment_id:', payload.payment_id);

    // Get the payment record to find user_id and plan_id
    const { data: paymentRecord, error: fetchError } = await supabase
      .from('nowpayments_records')
      .select('user_id, plan_id, order_id')
      .eq('payment_id', payload.payment_id)
      .single();

    if (fetchError || !paymentRecord) {
      console.error('Failed to fetch payment record:', fetchError);
      throw new Error('Payment record not found');
    }

    // Handle different payment statuses
    switch (payload.payment_status) {
      case 'finished':
      case 'confirmed':
        // Payment successful - activate subscription
        await activateSubscription(supabase, paymentRecord.user_id, paymentRecord.plan_id);
        console.log('Subscription activated for user:', paymentRecord.user_id);
        break;

      case 'partially_paid':
        // Partial payment - log but don't activate
        console.log('Partial payment received:', {
          paid: payload.actually_paid,
          required: payload.pay_amount,
          currency: payload.pay_currency
        });
        break;

      case 'failed':
      case 'expired':
        // Payment failed - log for analytics
        console.log('Payment failed:', {
          status: payload.payment_status,
          order_id: payload.order_id
        });
        break;

      default:
        console.log('Payment status update:', {
          status: payload.payment_status,
          order_id: payload.order_id
        });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function activateSubscription(supabase: any, userId: string, planId: string) {
  try {
    // Update user profile with active subscription
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_tier: planId,
        trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to update user profile:', profileError);
      throw profileError;
    }

    // Get user details for Xtream account creation
    const { data: profile, error: getProfileError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (getProfileError || !profile) {
      console.error('Failed to get user profile:', getProfileError);
      return; // Don't throw, subscription is still activated
    }

    // Create Xtream account if not a free trial
    if (planId !== 'free-trial') {
      try {
        const { error: xtreamError } = await supabase.functions.invoke('create-xtream-account', {
          body: {
            email: profile.email,
            name: profile.name,
            planId: planId
          }
        });

        if (xtreamError) {
          console.error('Xtream account creation failed:', xtreamError);
          // Don't throw - subscription is still valid
        } else {
          console.log('Xtream account created successfully for user:', userId);
        }
      } catch (xtreamError) {
        console.error('Xtream account creation error:', xtreamError);
        // Don't throw - subscription is still valid
      }
    }

    // Send welcome email
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: profile.email,
          name: profile.name
        }
      });
      console.log('Welcome email sent to:', profile.email);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't throw - not critical
    }

  } catch (error) {
    console.error('Subscription activation error:', error);
    throw error;
  }
}