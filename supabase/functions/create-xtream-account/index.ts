
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Define request payload type
type RequestPayload = {
  userId: string
  planType: string
  email: string
  name: string
}

// Plan mapping for MegaOTT packages - updated to match correct connection limits
const PLAN_MAPPING = {
  // 1-Month Plans
  'standard': { packageId: 1, duration: 30, maxConnections: 1 },
  'premium': { packageId: 2, duration: 30, maxConnections: 2 },
  'ultimate': { packageId: 3, duration: 30, maxConnections: 3 },

  // 6-Month Plans
  'standard-6m': { packageId: 1, duration: 180, maxConnections: 1 },
  'premium-6m': { packageId: 2, duration: 180, maxConnections: 2 },
  'ultimate-6m': { packageId: 3, duration: 180, maxConnections: 3 },

  // 12-Month Plans
  'standard-12m': { packageId: 1, duration: 365, maxConnections: 1 },
  'premium-12m': { packageId: 2, duration: 365, maxConnections: 2 },
  'ultimate-12m': { packageId: 3, duration: 365, maxConnections: 3 },

  // Legacy mappings for compatibility
  'solo': { packageId: 1, duration: 30, maxConnections: 1 },
  'duo': { packageId: 2, duration: 30, maxConnections: 2 },
  'family': { packageId: 3, duration: 30, maxConnections: 3 },

  // Trial mapping
  'trial': { packageId: 1, duration: 1, maxConnections: 1 },
  'free-trial': { packageId: 1, duration: 1, maxConnections: 1 }
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
    const megaottApiUrl = 'https://megaott.net/api/v1/subscriptions';
    const megaottApiKey = Deno.env.get('MEGAOTT_API_KEY') || '677|pLzeayEULdsofncJ4CZ2fima0Bg1VWP5qcpI0jzjfd88977c';

    if (!megaottApiKey) {
      log("Missing MegaOTT API key");
      throw new Error('MEGAOTT_API_KEY is not set');
    }

    // Get plan details
    const planDetails = PLAN_MAPPING[payload.planType as keyof typeof PLAN_MAPPING]
    if (!planDetails) {
      log("Invalid plan type", { planType: payload.planType, availablePlans: Object.keys(PLAN_MAPPING) });
      return new Response(
        JSON.stringify({ error: `Invalid plan type: ${payload.planType}. Available plans: ${Object.keys(PLAN_MAPPING).join(', ')}` }),
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
      const baseUrl = `https://megaott.net/get.php?username=${userProfile.xtream_username}&password=${userProfile.xtream_password}`;
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

    // Generate username (under 50 characters for MegaOTT)
    // Format: steady_[timestamp_suffix]_[random]
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits
    const randomString = Math.random().toString(36).substring(2, 8); // 6 chars
    const username = `steady_${timestamp}_${randomString}`;
    
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

    // Create subscription data in the format expected by MegaOTT API
    const subscriptionData = new URLSearchParams({
      'type': 'M3U',
      'username': username,
      'package_id': planDetails.packageId.toString(),
      'max_connections': planDetails.maxConnections.toString(),
      'forced_country': 'ALL',
      'adult': '0',
      'note': `SteadyStream customer: ${payload.name} (${payload.email}) - Plan: ${payload.planType}`,
      'whatsapp_telegram': payload.name || 'SteadyStream Customer',
      'enable_vpn': '0',
      'paid': '1' // Mark as paid since customer has paid through our system
    });

    // Make REAL request to MegaOTT API to create subscription (for ALL plans including trials)
    const response = await fetchWithRetry(megaottApiUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Authorization': `Bearer ${megaottApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: subscriptionData.toString()
    });

    const megaottResponse = await response.json();

    if (!response.ok) {
      log("MegaOTT API Error:", megaottResponse);
      throw new Error(megaottResponse.message || `Failed to create IPTV account: ${response.status} ${response.statusText}`);
    }

    log("MegaOTT subscription created successfully", {
      subscriptionId: megaottResponse.id,
      username: megaottResponse.username,
      password: megaottResponse.password,
      type: megaottResponse.type,
      plan: payload.planType
    });

    // Update the user profile with IPTV credentials (use password from API response)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        xtream_username: megaottResponse.username,
        xtream_password: megaottResponse.password,
        subscription_status: 'active',
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: megaottResponse.expiring_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.userId);

    if (updateError) {
      log("Supabase update error:", updateError);
      throw updateError;
    }

    log("Subscription creation complete, returning credentials from API response");

    return new Response(
      JSON.stringify({
        success: true,
        message: 'IPTV subscription created successfully in MegaOTT panel',
        data: {
          username: megaottResponse.username,
          password: megaottResponse.password,
          subscriptionId: megaottResponse.id,
          type: megaottResponse.type,
          startDate: startDate.toISOString(),
          endDate: megaottResponse.expiring_at,
          playlistUrls: {
            dns_link: megaottResponse.dns_link,
            dns_link_samsung_lg: megaottResponse.dns_link_for_samsung_lg,
            portal_link: megaottResponse.portal_link
          },
          package: megaottResponse.package,
          maxConnections: megaottResponse.max_connections,
          planType: payload.planType
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
