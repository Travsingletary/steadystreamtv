import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4"
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface WebhookPayload {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  purchase_id: string
  outcome_amount: number
  outcome_currency: string
  created_at: string
  updated_at: string
}

interface MegaOTTCreateUserRequest {
  username: string
  password: string
  email: string
  package_id: string
  max_connections?: number
  notes?: string
}

interface MegaOTTResponse {
  success: boolean
  user_id?: string
  username?: string
  password?: string
  message?: string
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('x-nowpayments-sig')
    const payload = await req.text()

    // Verify webhook signature
    const ipnSecret = Deno.env.get('NOWPAYMENTS_IPN_SECRET')
    if (!signature || !ipnSecret) {
      console.error('Missing signature or IPN secret')
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders
      })
    }

    // Verify HMAC signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(ipnSecret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )

    const computedSignature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(payload)
    )

    const computedHex = Array.from(new Uint8Array(computedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (computedHex !== signature) {
      console.error('Invalid signature')
      return new Response('Invalid signature', {
        status: 401,
        headers: corsHeaders
      })
    }

    // Parse webhook payload
    const webhookData: WebhookPayload = JSON.parse(payload)

    console.log('Webhook received:', {
      payment_id: webhookData.payment_id,
      status: webhookData.payment_status,
      order_id: webhookData.order_id
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Process payment based on status
    if (webhookData.payment_status === 'finished') {
      await processSuccessfulPayment(supabase, webhookData)
    } else if (webhookData.payment_status === 'failed') {
      await processFailedPayment(supabase, webhookData)
    } else if (webhookData.payment_status === 'partially_paid') {
      await processPartialPayment(supabase, webhookData)
    }

    return new Response('OK', {
      headers: corsHeaders
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal Server Error', {
      status: 500,
      headers: corsHeaders
    })
  }
})

async function processSuccessfulPayment(supabase: any, webhookData: WebhookPayload) {
  try {
    console.log('Processing successful payment:', webhookData.payment_id)

    // Create automation record
    const { data: automation, error: automationError } = await supabase
      .from('purchase_automations')
      .insert({
        payment_id: webhookData.payment_id,
        subscription_plan: extractPlanFromOrder(webhookData.order_description),
        status: 'processing'
      })
      .select()
      .single()

    if (automationError) {
      console.error('Failed to create automation record:', automationError)
      return
    }

    // Extract email from order description or use a default
    const email = extractEmailFromOrder(webhookData.order_description) || 'customer@example.com'
    const subscriptionPlan = extractPlanFromOrder(webhookData.order_description)

    // Create MegaOTT user
    const megaOTTResult = await createMegaOTTUser(email, subscriptionPlan)

    if (megaOTTResult.success) {
      // Create user profile if not exists
      const userId = await createOrGetUser(supabase, email, subscriptionPlan)

      // Create subscription record
      const subscriptionResult = await createSubscriptionRecord(
        supabase,
        userId,
        subscriptionPlan,
        megaOTTResult
      )

      // Create IPTV account record
      await createIPTVAccountRecord(
        supabase,
        userId,
        megaOTTResult,
        subscriptionResult.id
      )

      // Update automation status
      await supabase
        .from('purchase_automations')
        .update({
          status: 'completed',
          megaott_response: megaOTTResult
        })
        .eq('id', automation.id)

      // Send welcome email
      await sendWelcomeEmail(supabase, email, megaOTTResult, subscriptionPlan)

      console.log('Payment processing completed successfully')
    } else {
      // Update automation status to failed
      await supabase
        .from('purchase_automations')
        .update({
          status: 'failed',
          error_message: megaOTTResult.error,
          megaott_response: megaOTTResult
        })
        .eq('id', automation.id)

      console.error('MegaOTT user creation failed:', megaOTTResult.error)
    }

  } catch (error) {
    console.error('Error processing successful payment:', error)
  }
}

async function processFailedPayment(supabase: any, webhookData: WebhookPayload) {
  console.log('Processing failed payment:', webhookData.payment_id)

  // Log the failed payment
  await supabase
    .from('purchase_automations')
    .insert({
      payment_id: webhookData.payment_id,
      subscription_plan: extractPlanFromOrder(webhookData.order_description),
      status: 'failed',
      error_message: 'Payment failed'
    })
}

async function processPartialPayment(supabase: any, webhookData: WebhookPayload) {
  console.log('Processing partial payment:', webhookData.payment_id)

  // Log the partial payment
  await supabase
    .from('purchase_automations')
    .insert({
      payment_id: webhookData.payment_id,
      subscription_plan: extractPlanFromOrder(webhookData.order_description),
      status: 'pending',
      error_message: 'Partial payment received'
    })
}

async function createMegaOTTUser(email: string, subscriptionPlan: string): Promise<MegaOTTResponse> {
  try {
    const megaOTTApiUrl = Deno.env.get('MEGAOTT_API_URL')
    const megaOTTApiKey = Deno.env.get('MEGAOTT_API_KEY')
    const megaOTTUsername = Deno.env.get('MEGAOTT_USERNAME')
    const megaOTTPassword = Deno.env.get('MEGAOTT_PASSWORD')

    if (!megaOTTApiUrl || !megaOTTApiKey || !megaOTTUsername || !megaOTTPassword) {
      throw new Error('MegaOTT credentials not configured')
    }

    // Generate random credentials
    const username = generateUsername()
    const password = generatePassword()
    const planMapping = mapSubscriptionToPlan(subscriptionPlan)

    const userRequest: MegaOTTCreateUserRequest = {
      username,
      password,
      email,
      package_id: planMapping.packageId,
      max_connections: subscriptionPlan.includes('premium') ? 3 : 1,
      notes: `Auto-created via crypto payment - Plan: ${subscriptionPlan}`
    }

    const credentials = btoa(`${megaOTTUsername}:${megaOTTPassword}`)

    const response = await fetch(`${megaOTTApiUrl}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'X-API-Key': megaOTTApiKey
      },
      body: JSON.stringify(userRequest)
    })

    const result = await response.json()

    if (response.ok && result.success) {
      return {
        success: true,
        user_id: result.user_id || username,
        username: username,
        password: password,
        message: result.message
      }
    } else {
      return {
        success: false,
        error: result.error || 'Unknown error'
      }
    }

  } catch (error) {
    console.error('MegaOTT API error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function createOrGetUser(supabase: any, email: string, subscriptionPlan: string): Promise<string> {
  // Try to find existing user
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    return existingUser.id
  }

  // Create new user profile
  const userId = crypto.randomUUID()

  const { data: newUser, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      email: email,
      subscription_tier: subscriptionPlan,
      full_name: email.split('@')[0]
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create user profile:', error)
    throw error
  }

  return userId
}

async function createSubscriptionRecord(
  supabase: any,
  userId: string,
  subscriptionPlan: string,
  megaOTTResult: MegaOTTResponse
) {
  const planMapping = mapSubscriptionToPlan(subscriptionPlan)
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + planMapping.duration)

  const { data, error } = await supabase
    .from('megaott_subscriptions')
    .insert({
      user_id: userId,
      subscription_plan: subscriptionPlan,
      status: 'active',
      megaott_user_id: megaOTTResult.user_id,
      expires_at: expiryDate.toISOString(),
      auto_renew: false
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create subscription record:', error)
    throw error
  }

  return data
}

async function createIPTVAccountRecord(
  supabase: any,
  userId: string,
  megaOTTResult: MegaOTTResponse,
  subscriptionId: string
) {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30)

  const { data, error } = await supabase
    .from('iptv_accounts')
    .insert({
      user_id: userId,
      username: megaOTTResult.username,
      password: megaOTTResult.password,
      status: 'active',
      expires_at: expiryDate.toISOString(),
      megaott_subscription_id: subscriptionId
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create IPTV account record:', error)
    throw error
  }

  return data
}

async function sendWelcomeEmail(
  supabase: any,
  email: string,
  megaOTTResult: MegaOTTResponse,
  subscriptionPlan: string
) {
  try {
    // Call welcome email edge function
    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email,
        username: megaOTTResult.username,
        password: megaOTTResult.password,
        plan: subscriptionPlan,
        credentials: getConnectionDetails(megaOTTResult.username!, megaOTTResult.password!)
      }
    })

    if (error) {
      console.error('Failed to send welcome email:', error)
    }
  } catch (error) {
    console.error('Welcome email error:', error)
  }
}

// Helper functions
function generateUsername(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6)
  return `iptv_${timestamp}_${random}`
}

function generatePassword(): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

function mapSubscriptionToPlan(subscriptionPlan: string): { packageId: string; duration: number } {
  const planMappings: { [key: string]: { packageId: string; duration: number } } = {
    'basic_monthly': { packageId: 'basic_package', duration: 30 },
    'premium_monthly': { packageId: 'premium_package', duration: 30 },
    'premium_yearly': { packageId: 'premium_package', duration: 365 }
  }

  return planMappings[subscriptionPlan] || { packageId: 'basic_package', duration: 30 }
}

function extractPlanFromOrder(orderDescription: string): string {
  if (orderDescription.includes('Premium Yearly')) return 'premium_yearly'
  if (orderDescription.includes('Premium Monthly')) return 'premium_monthly'
  if (orderDescription.includes('Basic Monthly')) return 'basic_monthly'
  return 'basic_monthly'
}

function extractEmailFromOrder(orderDescription: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const match = orderDescription.match(emailRegex)
  return match ? match[0] : null
}

function getConnectionDetails(username: string, password: string) {
  const baseUrl = 'https://megaott.net' // Update with actual server URL

  return {
    m3u_url: `${baseUrl}/get.php?username=${username}&password=${password}&type=m3u_plus&output=ts`,
    xtream_url: baseUrl,
    xtream_username: username,
    xtream_password: password
  }
}