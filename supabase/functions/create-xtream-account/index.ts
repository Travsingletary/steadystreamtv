
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
type CustomDashboardPlan = {
  connections: number
  duration: number
  planName: string
}

type CustomDashboardResponse = {
  success: boolean
  username: string
  password: string
  playlistUrl: string
  expiresAt: string
  [key: string]: any
}

// Plan mapping for Custom Dashboard - updated to match frontend plans
const PLAN_MAPPING: Record<string, CustomDashboardPlan> = {
  'standard': { connections: 2, duration: 30, planName: 'Standard' },
  'premium': { connections: 4, duration: 30, planName: 'Premium' },
  'ultimate': { connections: 6, duration: 30, planName: 'Ultimate' },
  // Legacy mappings for compatibility
  'solo': { connections: 1, duration: 30, planName: 'Solo' },
  'duo': { connections: 2, duration: 30, planName: 'Duo' },
  'family': { connections: 3, duration: 30, planName: 'Family' },
  // Trial mapping
  'trial': { connections: 1, duration: 1, planName: 'Trial' },
  'free-trial': { connections: 1, duration: 1, planName: 'Free Trial' }
}

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for consistent logging
const log = (message: string, data?: any) => {
  console.log(`[CUSTOM-DASHBOARD-ACCOUNT] ${message}`, data ? JSON.stringify(data) : '');
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
      delay *= 2; // Exponential backoff
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
  log("Checking for existing credentials for user", { userId });
  
  try {
    const { data: userProfiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('xtream_username, xtream_password')
      .eq('id', userId);
      
    if (profileError) {
      log("Error fetching user profile", profileError);
      throw profileError;
    }
    
    log("User profiles query result", { 
      count: userProfiles?.length || 0,
      hasProfiles: userProfiles && userProfiles.length > 0
    });
    
    if (userProfiles && userProfiles.length > 0) {
      const userProfile = userProfiles.find(profile => profile.xtream_username && profile.xtream_password);
      
      if (userProfile) {
        log("User already has IPTV credentials", { username: userProfile.xtream_username });
        return userProfile;
      } else {
        log("User has profiles but no valid IPTV credentials");
      }
    } else {
      log("No user profiles found with credentials");
    }
    
    return null;
  } catch (error) {
    log("Error in checkExistingCredentials", { 
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw error;
  }
};

// Generate playlist URLs for custom dashboard
const generatePlaylistUrls = (username: string, password: string) => {
  // Use your custom dashboard playlist URL format
  const baseUrl = `https://yourdashboard.com/get.php?username=${username}&password=${password}`;
  return {
    m3u: `${baseUrl}&type=m3u_plus&output=ts`,
    m3u_plus: `${baseUrl}&type=m3u_plus&output=ts`,
    xspf: `${baseUrl}&type=xspf&output=ts`
  };
};

// Create account using Custom Dashboard API
const createCustomDashboardAccount = async (
  name: string, 
  email: string,
  planDetails: CustomDashboardPlan
): Promise<{ username: string, password: string, response: CustomDashboardResponse }> => {
  // Generate username and password for your system
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

  const customDashboardApiKey = Deno.env.get('CUSTOM_DASHBOARD_API_KEY');
  const customDashboardUrl = Deno.env.get('CUSTOM_DASHBOARD_URL') || 'https://yourdashboard.com/api/v1';
  
  if (!customDashboardApiKey) {
    log("Missing Custom Dashboard API key");
    throw new Error('CUSTOM_DASHBOARD_API_KEY is not set');
  }

  log("Creating user in Custom Dashboard", {
    username,
    email,
    connections: planDetails.connections,
    planName: planDetails.planName,
    expDate: endDate.toISOString().split('T')[0]
  });

  // Make request to your Custom Dashboard API
  const response = await fetchWithRetry(`${customDashboardUrl}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customDashboardApiKey}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      password: password,
      email: email,
      name: name,
      plan: planDetails.planName,
      max_connections: planDetails.connections,
      expires_at: endDate.toISOString(),
      metadata: {
        source: 'steadystream',
        created_via: 'automation'
      }
    })
  });

  const dashboardResponse = await response.json();

  if (!response.ok) {
    log("Custom Dashboard API Error:", dashboardResponse);
    throw new Error(dashboardResponse.message || `Failed to create IPTV account: ${response.status} ${response.statusText}`);
  }

  log("Custom Dashboard account created successfully", { 
    responseId: dashboardResponse.id,
    username: username
  });

  return { username, password, response: dashboardResponse };
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
  try {
    log("Updating user profile with IPTV credentials", { userId, username });
    
    const { data, error: updateError } = await supabaseAdmin
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
    
    log("User profile updated with IPTV credentials", { success: true });
    return { success: true, data };
  } catch (error) {
    log("Error updating user profile", { 
      errorMessage: error.message, 
      errorStack: error.stack 
    });
    throw error;
  }
};

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    log("Function started");
    
    let payload;
    try {
      payload = await req.json() as RequestPayload;
      log("Received payload", payload);
    } catch (parseError) {
      log("Failed to parse JSON payload", parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload', details: parseError.message }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    log("Creating Supabase admin client");
    let supabaseAdmin;
    try {
      supabaseAdmin = createSupabaseClient();
    } catch (clientError) {
      log("Failed to create Supabase client", clientError);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize database client', details: clientError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate request
    const validation = validateRequestPayload(payload);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing credentials
    log("Checking for existing credentials");
    let existingCredentials;
    try {
      existingCredentials = await checkExistingCredentials(supabaseAdmin, payload.userId);
    } catch (credError) {
      log("Error checking existing credentials", credError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check existing credentials', 
          details: credError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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

    // Create new Custom Dashboard account
    log("Creating new Custom Dashboard account");
    const planDetails = validation.planDetails;
    let dashboardResult;
    try {
      dashboardResult = await createCustomDashboardAccount(payload.name, payload.email, planDetails);
    } catch (dashboardError) {
      log("Failed to create Custom Dashboard account", dashboardError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create IPTV account', 
          details: dashboardError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { username, password, response: dashboardResponse } = dashboardResult;

    // Calculate dates for profile update
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planDetails.duration);

    // Update user profile with credentials
    log("Updating user profile");
    try {
      await updateUserProfile(supabaseAdmin, payload.userId, username, password, startDate, endDate);
    } catch (updateError) {
      log("Failed to update user profile", updateError);
      // We still return success since the IPTV account was created
    }

    // Generate playlist URLs
    const playlistUrls = generatePlaylistUrls(username, password);

    log("Account creation complete, returning credentials");

    return new Response(
      JSON.stringify({
        success: true,
        message: 'IPTV account created successfully via Custom Dashboard',
        data: {
          username,
          password,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          playlistUrls,
          dashboardId: dashboardResponse.id || dashboardResponse.user_id,
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
