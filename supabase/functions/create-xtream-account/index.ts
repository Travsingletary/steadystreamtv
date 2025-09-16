
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Define request payload type
type RequestPayload = {
  userId?: string
  planType: string
  email: string
  name?: string
}

// Plan mapping for MegaOTT packages - updated to match frontend plans
const PLAN_MAPPING = {
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

    // Validate request (allow userId to be omitted if email is provided for lookup)
    if (!payload.planType || !payload.email) {
      log("Missing required fields", { 
        userId: payload.userId, 
        planType: payload.planType, 
        email: payload.email 
      });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email and planType are required' }),
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
      log("Invalid plan type", { planType: payload.planType, availablePlans: Object.keys(PLAN_MAPPING) });
      return new Response(
        JSON.stringify({ error: `Invalid plan type: ${payload.planType}. Available plans: ${Object.keys(PLAN_MAPPING).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resolve user by ID or email
    let resolvedUserId = payload.userId;
    let resolvedName = payload.name;

    if (!resolvedUserId) {
      const { data: byEmail, error: byEmailError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, xtream_username, xtream_password')
        .eq('email', payload.email)
        .maybeSingle();

      if (byEmailError) {
        log('Error looking up user by email', byEmailError);
        throw byEmailError;
      }

      if (!byEmail?.id) {
        // Auto-create auth user and linked profile
        log('No profile found. Auto-creating auth user + profile for email', { email: payload.email });
        // Create auth user using service role
        let authUserId: string | null = null;
        const desiredName = (payload.name || payload.email.split('@')[0]).trim();
        const createUserRes = await supabaseAdmin.auth.admin.createUser({
          email: payload.email,
          email_confirm: true,
          user_metadata: { name: desiredName }
        });
        if (createUserRes.error) {
          // If user already exists, try to find existing auth user by email
          const alreadyExists = (createUserRes.error as any)?.message?.toLowerCase?.().includes('already been registered');
          if (!alreadyExists) {
            log('Failed to create auth user', createUserRes.error);
            throw createUserRes.error;
          }
          log('Auth user already exists, attempting to locate by email');
          // Fallback: iterate through users to find match by email (bounded pages)
          let found = null;
          for (let page = 1; page <= 10; page++) {
            const listRes = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
            if (listRes.error) {
              log('Failed to list users', listRes.error);
              throw listRes.error;
            }
            const match = listRes.data.users.find((u: any) => u.email?.toLowerCase() === payload.email.toLowerCase());
            if (match) { found = match; break; }
            if (listRes.data.users.length < 1000) break; // no more pages
          }
          if (!found?.id) {
            throw new Error('Existing auth user not found by email');
          }
          authUserId = found.id;
        } else {
          authUserId = createUserRes.data?.user?.id ?? null;
        }
        if (!authUserId) {
          throw new Error('Auth user id missing after create/find flow');
        }

        // If profile already exists, select it; otherwise create it
        const { data: existingProfile, error: selectProfileError } = await supabaseAdmin
          .from('profiles')
          .select('id, name, email')
          .eq('id', authUserId)
          .maybeSingle();

        let profileId = existingProfile?.id;
        let profileName = existingProfile?.name;

        if (!profileId) {
          const { data: newProfile, error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: authUserId,
              email: payload.email,
              name: desiredName,
              subscription_status: 'inactive'
            })
            .select('id, name, email')
            .single();

          if (insertError) {
            log('Failed to auto-create profile', insertError);
            throw insertError;
          }
          profileId = newProfile.id;
          profileName = newProfile.name;
        }

        resolvedUserId = profileId as string;
        resolvedName = profileName || desiredName;
      } else {
        resolvedUserId = byEmail.id;
        resolvedName = resolvedName || byEmail.name || payload.email.split('@')[0];
      }
    }

    // Check if user already has IPTV credentials
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('xtream_username, xtream_password')
      .eq('id', resolvedUserId)
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

    // Generate username and password
    // Format: steady_[first letter of name][random string]
    const safeName = (resolvedName || payload.email).trim();
    const nameLetter = safeName.charAt(0).toLowerCase();
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

    // Make REAL request to MegaOTT API to create user (for ALL plans including trials)
    const response = await fetchWithRetry(megaottApiUrl, {
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
        admin_notes: `SteadyStream customer: ${payload.name} (${payload.email}) - Plan: ${payload.planType}`
      })
    });

    const megaottResponse = await response.json();

    if (!response.ok) {
      log("MegaOTT API Error:", megaottResponse);
      throw new Error(megaottResponse.message || `Failed to create IPTV account: ${response.status} ${response.statusText}`);
    }

    log("MegaOTT account created successfully", { 
      responseId: megaottResponse.id,
      username: username,
      plan: payload.planType 
    });

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
      .eq('id', resolvedUserId);

    if (updateError) {
      log("Supabase update error:", updateError);
      throw updateError;
    }

    // Generate playlist URLs with the real MegaOTT endpoint
    const baseUrl = `https://megaott.net/get.php?username=${username}&password=${password}`;
    const m3uUrl = `${baseUrl}&type=m3u_plus&output=ts`;
    const m3uPlusUrl = `${baseUrl}&type=m3u_plus&output=ts`;
    const xspfUrl = `${baseUrl}&type=xspf&output=ts`;

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
          playlistUrls: {
            m3u: m3uUrl,
            m3u_plus: m3uPlusUrl,
            xspf: xspfUrl
          },
          megaottId: megaottResponse.id,
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
