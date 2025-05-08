
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
  'standard': { packageId: 1, duration: 30, maxConnections: 2 },
  'premium': { packageId: 2, duration: 30, maxConnections: 4 },
  'ultimate': { packageId: 3, duration: 30, maxConnections: 6 }
}

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for consistent logging
const log = (message: string, data?: any) => {
  console.log(`[CREATE-XTREAM-ACCOUNT] ${message}`, data ? JSON.stringify(data) : '');
};

// Helper function to retry API calls
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || i === retries - 1) {
        return response;
      }
      throw new Error(`Request failed with status ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      log(`Retry attempt ${i + 1} failed, retrying in ${delay}ms`, { error: error.message });
      await new Promise(r => setTimeout(r, delay));
      // Exponential backoff
      delay *= 2;
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    log("Function started");
    const payload = await req.json() as RequestPayload;
    log("Received payload", payload);

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate request
    if (!payload.userId || !payload.planType || !payload.email) {
      log("Missing required fields", { 
        userId: payload.userId, 
        planType: payload.planType, 
        email: payload.email 
      });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get MegaOTT credentials from environment variables
    const megaottApiUrl = 'https://megaott.net/api/v1/user';
    const megaottApiKey = Deno.env.get('MEGAOTT_API_KEY');
    
    if (!megaottApiKey) {
      log("Missing MegaOTT API key");
      throw new Error('MEGAOTT_API_KEY is not set');
    }

    // Get plan details
    const planDetails = PLAN_MAPPING[payload.planType as keyof typeof PLAN_MAPPING]
    if (!planDetails) {
      log("Invalid plan type", { planType: payload.planType });
      return new Response(
        JSON.stringify({ error: 'Invalid plan type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already has IPTV credentials
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('xtream_username, xtream_password')
      .eq('id', payload.userId)
      .single();
      
    if (profileError) {
      log("Error fetching user profile", profileError);
      throw profileError;
    }
    
    // If user already has credentials, return those instead of creating new ones
    if (userProfile?.xtream_username && userProfile?.xtream_password) {
      log("User already has IPTV credentials, returning existing ones", {
        username: userProfile.xtream_username
      });
      
      // Generate playlist URLs with existing credentials
      const baseUrl = `http://megaott.net/get.php?username=${userProfile.xtream_username}&password=${userProfile.xtream_password}`;
      const m3uUrl = `${baseUrl}&type=m3u_plus&output=ts`;
      const m3uPlusUrl = `${baseUrl}&type=m3u_plus&output=ts`;
      const xspfUrl = `${baseUrl}&type=xspf&output=ts`;
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Existing IPTV account retrieved',
          data: {
            username: userProfile.xtream_username,
            password: userProfile.xtream_password,
            playlistUrls: {
              m3u: m3uUrl,
              m3u_plus: m3uPlusUrl,
              xspf: xspfUrl
            }
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate username and password
    // Format: steady_[first letter of name][random string]
    const nameLetter = payload.name.charAt(0).toLowerCase();
    const randomString = Math.random().toString(36).substring(2, 8);
    const username = `steady_${nameLetter}${randomString}`;
    
    // Generate secure password
    const password = Math.random().toString(36).substring(2, 10) + 
                    Math.random().toString(36).substring(2, 10);

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planDetails.duration);

    log("Creating user in MegaOTT", {
      username,
      packageId: planDetails.packageId,
      connections: planDetails.maxConnections,
      expDate: endDate.toISOString().split('T')[0]
    });

    // Make request to MegaOTT API to create user
    const response = await fetchWithRetry(megaottApiUrl, {
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
    });

    const megaottResponse = await response.json();

    if (!response.ok) {
      log("MegaOTT API Error:", megaottResponse);
      throw new Error(megaottResponse.message || 'Failed to create IPTV account');
    }

    log("MegaOTT account created successfully", { responseId: megaottResponse.id });

    // Update the user profile with IPTV credentials
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        xtream_username: username,
        xtream_password: password,
        subscription_status: 'active',
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.userId);

    if (updateError) {
      log("Supabase update error:", updateError);
      throw updateError;
    }

    // Generate playlist URLs
    const baseUrl = `http://megaott.net/get.php?username=${username}&password=${password}`;
    const m3uUrl = `${baseUrl}&type=m3u_plus&output=ts`;
    const m3uPlusUrl = `${baseUrl}&type=m3u_plus&output=ts`;
    const xspfUrl = `${baseUrl}&type=xspf&output=ts`;

    log("Account creation complete, returning credentials");

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
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    log("Error creating IPTV account:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create IPTV account',
        detail: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
