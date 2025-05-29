
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
    
    // Log all available environment variables (for debugging)
    log("Available environment variables", {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasSupabaseKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasStripeKey: !!Deno.env.get('STRIPE_SECRET_KEY'),
      stripeKeyPrefix: Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 7) || 'not found'
    });
    
    const payload = await req.json() as RequestPayload
    log("Received payload", payload);

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate request
    if (!payload.userId || !payload.planId) {
      log("Missing required fields", { userId: payload.userId, planId: payload.planId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Stripe with better error handling
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      log("Missing Stripe secret key - check Supabase secrets configuration");
      return new Response(
        JSON.stringify({ 
          error: 'Payment service configuration error',
          detail: 'STRIPE_SECRET_KEY not configured in Supabase secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!stripeKey.startsWith('sk_')) {
      log("Invalid Stripe secret key format", { keyPrefix: stripeKey.substring(0, 7) });
      return new Response(
        JSON.stringify({ 
          error: 'Payment service configuration error',
          detail: 'Invalid Stripe secret key format'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    log("Stripe initialized successfully");

    // Get plan details
    const planDetails = PLAN_MAPPING[payload.planId as keyof typeof PLAN_MAPPING]
    if (!planDetails) {
      log("Invalid plan type", { planId: payload.planId });
      return new Response(
        JSON.stringify({ error: 'Invalid plan type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already has a Stripe customer ID - use maybeSingle() to handle missing profiles gracefully
    let customerId;
    log("Looking up user profile", { userId: payload.userId });
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', payload.userId)
      .maybeSingle() // Use maybeSingle() instead of single() to handle missing profiles

    if (profileError) {
      log("Error fetching profile", { error: profileError.message });
      // Continue without existing customer ID - we'll create a new one
    }

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
      log("Found existing Stripe customer", { customerId });
    } else {
      log("No existing Stripe customer found, will create new one");
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: payload.customerEmail,
        name: payload.customerName,
        metadata: {
          userId: payload.userId
        }
      })
      customerId = customer.id;
      log("Created new Stripe customer", { customerId });

      // Update the profile with the new customer ID if profile exists, or handle gracefully if it doesn't
      try {
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', payload.userId);
        log("Updated profile with new Stripe customer ID");
      } catch (updateError) {
        log("Could not update profile with Stripe customer ID", { error: updateError });
        // This is not critical - payment can still proceed
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
    }]

    // Create checkout session
    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: payload.isRecurring ? 'subscription' : 'payment',
      success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?canceled=true`,
      client_reference_id: payload.userId, // Important: Pass user ID to webhook
      metadata: {
        userId: payload.userId,
        planId: payload.planId
      }
    })

    log("Checkout session created", { sessionId: session.id });

    // Update user profile with subscription tier - handle gracefully if profile doesn't exist
    try {
      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_tier: payload.planId,
          updated_at: new Date().toISOString()
        })
        .eq('id', payload.userId);
      log("Updated profile with subscription tier");
    } catch (updateError) {
      log("Could not update profile with subscription tier", { error: updateError });
      // This is not critical - payment can still proceed
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
        sessionId: session.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    log("Payment error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create payment session',
        detail: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
