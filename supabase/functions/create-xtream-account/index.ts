
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Define request payload type
type RequestPayload = {
  userId: string
  planType: string
  email: string
  name: string
}

// Plan mapping for MegaOTT packages
const PLAN_MAPPING = {
  'solo': { packageId: 1, duration: 30, maxConnections: 1 },
  'duo': { packageId: 2, duration: 30, maxConnections: 2 },
  'family': { packageId: 3, duration: 30, maxConnections: 3 }
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
    if (!payload.userId || !payload.planType || !payload.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers }
      )
    }

    // Get MegaOTT credentials from environment variables
    const megaottApiUrl = 'https://megaott.net/api/v1/user'
    const megaottUsername = Deno.env.get('MEGAOTT_USERNAME') || 'JX5E3YZZ'
    const megaottPassword = Deno.env.get('MEGAOTT_PASSWORD') || '2N1xXXid'
    const megaottApiKey = Deno.env.get('MEGAOTT_API_KEY') || '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d'

    // Get plan details
    const planDetails = PLAN_MAPPING[payload.planType as keyof typeof PLAN_MAPPING]
    if (!planDetails) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan type' }),
        { status: 400, headers }
      )
    }

    // Generate username and password
    // Format: steady_[first letter of name][random string]
    const nameLetter = payload.name.charAt(0).toLowerCase()
    const randomString = Math.random().toString(36).substring(2, 8)
    const username = `steady_${nameLetter}${randomString}`
    
    // Generate secure password
    const password = Math.random().toString(36).substring(2, 10) + 
                    Math.random().toString(36).substring(2, 10)

    // Calculate dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + planDetails.duration)

    // Make request to MegaOTT API to create user
    const response = await fetch(megaottApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${megaottApiKey}`
      },
      body: JSON.stringify({
        username: username,
        password: password,
        package_id: planDetails.packageId,
        max_connections: planDetails.maxConnections,
        exp_date: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        admin_notes: `SteadyStream customer: ${payload.name} (${payload.email})`
      })
    })

    const megaottResponse = await response.json()

    if (!response.ok) {
      console.error('MegaOTT API Error:', megaottResponse)
      throw new Error(megaottResponse.message || 'Failed to create IPTV account')
    }

    // Update the user profile with IPTV credentials
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        iptv_username: username,
        iptv_password: password,
        subscription_status: 'active',
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString()
      })
      .eq('user_id', payload.userId)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      throw updateError
    }

    // Generate playlist URLs
    const baseUrl = `http://megaott.net/get.php?username=${username}&password=${password}`
    const m3uUrl = `${baseUrl}&type=m3u_plus&output=ts`
    const m3uPlusUrl = `${baseUrl}&type=m3u_plus&output=ts`
    const xspfUrl = `${baseUrl}&type=xspf&output=ts`

    return new Response(
      JSON.stringify({
        success: true,
        message: 'IPTV account created successfully',
        data: {
          username,
          password,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          playlistUrls: {
            m3u: m3uUrl,
            m3u_plus: m3uPlusUrl,
            xspf: xspfUrl
          }
        }
      }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Error creating IPTV account:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create IPTV account',
        detail: error.toString()
      }),
      { status: 500, headers }
    )
  }
})
