
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@14.21.0'

// Define request payload type
type RequestPayload = {
  userId: string
  planId: string
  customerEmail: string
  customerName: string
  isRecurring: boolean
  onboardingData?: any
}

// Helper function for consistent logging
const log = (message: string, data?: any) => {
  console.log(`[CREATE-PAYMENT] ${message}`, data ? JSON.stringify(data) : '');
};

// Plan mapping for Stripe
const PLAN_MAPPING = {
  'standard': {
    price: 2000, // $20.00
    name: 'Standard Plan',
    description: '7,000+ channels, HD quality, 2 devices'
  },
  'premium': {
    price: 3500, // $35.00
    name: 'Premium Plan',
    description: '10,000+ channels, Full HD quality, 4 devices'
  },
  'ultimate': {
    price: 4500, // $45.00
    name: 'Ultimate Plan',
    description: '10,000+ channels, 4K Ultra HD, 6 devices'
  }
}

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    log("Function started");
    
    // Get and validate Stripe secret key
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    log("Checking Stripe secret key", {
      hasStripeKey: !!stripeKey,
      keyPrefix: stripeKey?.substring(0, 7) || 'not found',
      keyLength: stripeKey?.length || 0
    });

    if (!stripeKey) {
      log("ERROR: Missing Stripe secret key");
      return new Response(
        JSON.stringify({ 
          error: 'Payment service configuration error',
          detail: 'STRIPE_SECRET_KEY not configured. Please add your Stripe secret key in Supabase Edge Function secrets.',
          action: 'Configure STRIPE_SECRET_KEY in Supabase Dashboard > Edge Functions > Secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!stripeKey.startsWith('sk_')) {
      log("ERROR: Invalid Stripe secret key format", { 
        keyPrefix: stripeKey.substring(0, 10),
        expectedFormat: 'sk_test_... or sk_live_...'
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Stripe secret key format',
          detail: 'Stripe secret key must start with "sk_test_" (for test mode) or "sk_live_" (for live mode)',
          current: `Key starts with: "${stripeKey.substring(0, 7)}"`,
          expected: 'Key should start with: "sk_test_" or "sk_live_"'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log("Stripe key validation passed");
    
    // Parse and validate request payload
    let payload: RequestPayload;
    try {
      payload = await req.json() as RequestPayload;
      log("Received payload", payload);
    } catch (parseError) {
      log("ERROR: Failed to parse request payload", { error: parseError });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request payload',
          detail: 'Could not parse JSON request body'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    log("Supabase admin client created");

    // Validate request
    if (!payload.userId || !payload.planId) {
      log("ERROR: Missing required fields", { userId: payload.userId, planId: payload.planId });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          detail: 'userId and planId are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Stripe
    let stripe;
    try {
      stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });
      log("Stripe initialized successfully");
    } catch (stripeError) {
      log("ERROR: Failed to initialize Stripe", { error: stripeError });
      return new Response(
        JSON.stringify({ 
          error: 'Stripe initialization failed',
          detail: stripeError instanceof Error ? stripeError.message : 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get plan details
    const planDetails = PLAN_MAPPING[payload.planId as keyof typeof PLAN_MAPPING]
    if (!planDetails) {
      log("ERROR: Invalid plan type", { planId: payload.planId });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid plan type',
          detail: `Plan '${payload.planId}' not found. Available plans: ${Object.keys(PLAN_MAPPING).join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    log("Plan details retrieved", { planId: payload.planId, planDetails });

    // Check if user already has a Stripe customer ID
    let customerId;
    log("Looking up user profile", { userId: payload.userId });
    
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', payload.userId)
        .maybeSingle();

      if (profileError) {
        log("Warning: Error fetching profile (continuing anyway)", { error: profileError.message });
      } else if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
        log("Found existing Stripe customer", { customerId });
      } else {
        log("No existing Stripe customer found, will create new one");
      }
    } catch (profileLookupError) {
      log("Warning: Profile lookup failed (continuing anyway)", { error: profileLookupError });
    }

    // Create or use existing Stripe customer
    if (!customerId) {
      try {
        log("Creating new Stripe customer", { email: payload.customerEmail, name: payload.customerName });
        const customer = await stripe.customers.create({
          email: payload.customerEmail,
          name: payload.customerName,
          metadata: {
            userId: payload.userId
          }
        });
        customerId = customer.id;
        log("Created new Stripe customer", { customerId });

        // Update the profile with the new customer ID
        try {
          await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', payload.userId);
          log("Updated profile with new Stripe customer ID");
        } catch (updateError) {
          log("Could not update profile with Stripe customer ID (non-critical)", { error: updateError });
        }
      } catch (customerError) {
        log("ERROR: Failed to create Stripe customer", { error: customerError });
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create customer',
            detail: customerError instanceof Error ? customerError.message : 'Unknown error'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create LineItems based on plan
    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: planDetails.name,
          description: planDetails.description,
        },
        unit_amount: planDetails.price,
        ...(payload.isRecurring ? { recurring: { interval: 'month' } } : {})
      },
      quantity: 1,
    }];
    log("Line items created", { lineItems });

    // Get the origin from the request headers
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    log("Creating checkout session", { 
      customerId, 
      origin, 
      mode: payload.isRecurring ? 'subscription' : 'payment' 
    });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: payload.isRecurring ? 'subscription' : 'payment',
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&user_id=${payload.userId}`,
        cancel_url: `${origin}/onboarding?cancelled=true`,
        client_reference_id: payload.userId,
        metadata: {
          userId: payload.userId,
          planId: payload.planId,
          onboardingData: payload.onboardingData ? JSON.stringify(payload.onboardingData) : null
        }
      });
      log("Checkout session created successfully", { 
        sessionId: session.id, 
        url: session.url, 
        successUrl: session.success_url 
      });
    } catch (sessionError) {
      log("ERROR: Failed to create checkout session", { error: sessionError });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create checkout session',
          detail: sessionError instanceof Error ? sessionError.message : 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log("Payment function completed successfully", { 
      sessionId: session.id,
      customerId,
      planId: payload.planId
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
        sessionId: session.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    log("CRITICAL ERROR in payment function", { 
      message: errorMessage, 
      stack: errorStack,
      type: error?.constructor?.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Payment function failed',
        detail: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
