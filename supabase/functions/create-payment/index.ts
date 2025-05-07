
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

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 })
  }

  try {
    const payload = await req.json() as RequestPayload

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate request
    if (!payload.userId || !payload.planId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || 'sk_test_your_stripe_key', {
      apiVersion: '2023-10-16',
    })

    // Get plan details
    const planDetails = PLAN_MAPPING[payload.planId as keyof typeof PLAN_MAPPING]
    if (!planDetails) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan type' }),
        { status: 400, headers }
      )
    }

    // Check if user already has a Stripe customer ID
    let customerId
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', payload.userId)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: payload.customerEmail,
        name: payload.customerName,
        metadata: {
          userId: payload.userId
        }
      })
      customerId = customer.id

      // Save the customer ID to the user's profile
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', payload.userId)
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
      metadata: {
        userId: payload.userId,
        planId: payload.planId
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
        sessionId: session.id
      }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Payment error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create payment session',
        detail: error.toString()
      }),
      { status: 500, headers }
    )
  }
})
