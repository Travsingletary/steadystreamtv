
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Define request payload type
type RequestPayload = {
  userId: string
  planType: string
  email: string
  name: string
}

// Types for improved readability
type MegaOTTPlan = {
  packageId: number
  duration: number
  maxConnections: number
}

type MegaOTTResponse = {
  id: string
  [key: string]: any
}

type MegaOTTCredentials = {
  username: string
  password: string
}

type PlaylistUrls = {
  m3u: string
  m3u_plus: string
  xspf: string
}

// Plan mapping for MegaOTT packages - updated to match frontend plans
const PLAN_MAPPING: Record<string, MegaOTTPlan> = {
  'standard': { packageId: 1, duration: 30, maxConnections: 2 },
  'premium': { packageId: 2, duration: 30, maxConnections: 4 },
  'ultimate': { packageId: 3, duration: 30, maxConnections: 6 },
  // Legacy mappings for compatibility
  'solo': { packageId: 1, duration: 30, maxConnections: 2 },
  'duo': { packageId: 2, duration: 30, maxConnections: 4 },
  'family': { packageId: 3, duration: 30, maxConnections: 6 },
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

// Create Supabase client
const createSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

// Validate request payload
const validateRequestPayload = (payload: RequestPayload) => {
  if (!payload.userId || !payload.planType || !payload.email) {
    log("Missing required fields", { 
      userId: payload.userId, 
      planType: payload.planType, 
      email: payload.email 
    });
    
    return {
      isValid: false,
      error: 'Missing required fields'
    };
  }
  
  // Get plan details
  const planDetails = PLAN_MAPPING[payload.planType as keyof typeof PLAN_MAPPING];
  if (!planDetails) {
    log("Invalid plan type", { planType: payload.planType, availablePlans: Object.keys(PLAN_MAPPING) });
    
    return {
      isValid: false,
      error: `Invalid plan type: ${payload.planType}. Available plans: ${Object.keys(PLAN_MAPPING).join(', ')}`
    };
  }
  
  return {
    isValid: true,
    planDetails
  };
};

// Check if user already has IPTV credentials
const checkExistingCredentials = async (supabaseAdmin: any, userId: string) => {
  const { data: userProfiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('xtream_username, xtream_password')
    .eq('id', userId);
    
  if (profileError) {
    log("Error fetching user profile", profileError);
    throw profileError;
  }
  
  if (userProfiles && userProfiles.length > 0) {
    // Get the first profile with valid credentials (if there are multiple, use the first one)
    const userProfile = userProfiles.find(profile => profile.xtream_username && profile.xtream_password);
    
    if (userProfile) {
      log("User already has IPTV credentials", { username: userProfile.xtream_username });
      return userProfile;
    }
  }
  
  return null;
};

// Generate playlist URLs
const generatePlaylistUrls = (username: string, password: string): PlaylistUrls => {
  const baseUrl = `https://megaott.net/get.php?username=${username}&password=${password}`;
  return {
    m3u: `${baseUrl}&type=m3u_plus&output=ts`,
    m3u_plus: `${baseUrl}&type=m3u_plus&output=ts`,
    xspf: `${baseUrl}&type=xspf&output=ts`
  };
};

// Create MegaOTT account
const createMegaOTTAccount = async (
  name: string, 
  planDetails: MegaOTTPlan
): Promise<{ username: string, password: string, response: MegaOTTResponse }> => {
  // Generate username and password
  const nameLetter = name.charAt(0).toLowerCase();
  const randomString = Math.random().toString(36).substring(2, 8);
  const username = `steady_${nameLetter}${randomString}`;
  
  // Generate secure password
  const password = Math.random().toString(36).substring(2, 10) + 
                  Math.random().toString(36).substring(2, 10);

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + planDetails.duration);

  const megaottApiKey = Deno.env.get('MEGAOTT_API_KEY');
  if (!megaottApiKey) {
    log("Missing MegaOTT API key");
    throw new Error('MEGAOTT_API_KEY is not set');
  }

  log("Creating user in MegaOTT", {
    username,
    packageId: planDetails.packageId,
    connections: planDetails.maxConnections,
    expDate: endDate.toISOString().split('T')[0]
  });

  // Make REAL request to MegaOTT API
  const response = await fetchWithRetry('https://megaott.net/api/v1/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${megaottApiKey}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      password: password,
      package_id: planDetails.packageId,
      max_connections: planDetails.maxConnections,
      exp_date: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      admin_notes: `SteadyStream customer: ${name} - Plan: ${planDetails.packageId}`
    })
  });

  const megaottResponse = await response.json();

  if (!response.ok) {
    log("MegaOTT API Error:", megaottResponse);
    throw new Error(megaottResponse.message || `Failed to create IPTV account: ${response.status} ${response.statusText}`);
  }

  log("MegaOTT account created successfully", { 
    responseId: megaottResponse.id,
    username: username
  });

  return { username, password, response: megaottResponse };
};

// Update user profile with IPTV credentials
const updateUserProfile = async (
  supabaseAdmin: any,
  userId: string,
  username: string,
  password: string,
  startDate: Date,
  endDate: Date
) => {
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
    .eq('id', userId);

  if (updateError) {
    log("Supabase update error:", updateError);
    throw updateError;
  }
  
  log("User profile updated with IPTV credentials");
};

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    log("Function started");
    const payload = await req.json() as RequestPayload;
    log("Received payload", payload);

    // Create Supabase admin client
    const supabaseAdmin = createSupabaseClient();

    // Validate request
    const validation = validateRequestPayload(payload);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing credentials
    const existingCredentials = await checkExistingCredentials(supabaseAdmin, payload.userId);
    if (existingCredentials) {
      const playlistUrls = generatePlaylistUrls(
        existingCredentials.xtream_username, 
        existingCredentials.xtream_password
      );
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Existing IPTV account retrieved',
          data: {
            username: existingCredentials.xtream_username,
            password: existingCredentials.xtream_password,
            playlistUrls
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new MegaOTT account
    const planDetails = validation.planDetails;
    const { username, password, response: megaottResponse } = 
      await createMegaOTTAccount(payload.name, planDetails);

    // Calculate dates for profile update
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planDetails.duration);

    // Update user profile with credentials
    await updateUserProfile(supabaseAdmin, payload.userId, username, password, startDate, endDate);

    // Generate playlist URLs
    const playlistUrls = generatePlaylistUrls(username, password);

    log("Account creation complete, returning credentials");

    return new Response(
      JSON.stringify({
        success: true,
        message: 'IPTV account created successfully in MegaOTT panel',
        data: {
          username,
          password,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          playlistUrls,
          megaottId: megaottResponse.id,
          planType: payload.planType
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    log("Error creating IPTV account:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create IPTV account',
        detail: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
