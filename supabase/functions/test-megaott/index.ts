import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userReadToken = Deno.env.get('MEGAOTT_USER_READ_TOKEN');
    const megaottApiKey = userReadToken || Deno.env.get('MEGAOTT_API_KEY');
    let megaottApiUrl = Deno.env.get('MEGAOTT_API_URL');

    console.log('Testing MegaOTT API...');
    console.log('API URL:', megaottApiUrl);
    console.log('Auth token source:', userReadToken ? 'MEGAOTT_USER_READ_TOKEN' : (megaottApiKey ? 'MEGAOTT_API_KEY' : 'Missing'));

    if (!megaottApiKey || !megaottApiUrl) {
      throw new Error('MegaOTT API configuration missing');
    }

    // Ensure URL has protocol
    if (!megaottApiUrl.startsWith('http://') && !megaottApiUrl.startsWith('https://')) {
      megaottApiUrl = 'https://' + megaottApiUrl;
      console.log('Added https:// protocol to URL:', megaottApiUrl);
    }

    // Normalize API base path - use /api for the new endpoint
    let apiBase = megaottApiUrl.replace(/\/$/, '');
    try {
      const urlObj = new URL(apiBase);
      // Check if it already has an API path
      if (!urlObj.pathname.includes('/api')) {
        apiBase = apiBase + '/api';
        console.log('Appended /api to base URL:', apiBase);
      }
    } catch (e) {
      console.warn('Failed to parse API URL, proceeding with raw string:', apiBase, e);
    }

    // Test 1: Get User endpoint (as per the API documentation)
    console.log('Testing GET /user endpoint...');
    let userResponse: Response | null = null;
    let userFetchError: string | null = null;
    try {
      userResponse = await fetch(`${apiBase}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${megaottApiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'LovableApp/megaott-test (SupabaseEdge)',
          'Cache-Control': 'no-cache'
        }
      });
    } catch (e: any) {
      userFetchError = e?.message || String(e);
      console.error('User endpoint fetch error:', userFetchError);
    }

    console.log('User endpoint response status:', userResponse?.status ?? 'fetch_error');
    console.log('User endpoint response headers:', userResponse ? Object.fromEntries(userResponse.headers.entries()) : {});

    let userResult: any = null;
    let userErrorBody: string | null = null;
    if (userResponse && userResponse.ok) {
      try {
        userResult = await userResponse.json();
        console.log('User data received:', userResult);
      } catch (e) {
        console.warn('Failed to parse user JSON:', e);
        userErrorBody = 'Invalid JSON response';
      }
    } else if (userResponse) {
      userErrorBody = await userResponse.text().catch(() => 'Failed to read error');
      console.error('User endpoint error:', userErrorBody);
    }

    // Test 2: Try to get subscriptions/plans (common alternative to packages)
    console.log('Testing GET /subscriptions endpoint...');
    let subscriptionsResponse: Response | null = null;
    let subscriptionsFetchError: string | null = null;
    try {
      subscriptionsResponse = await fetch(`${apiBase}/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${megaottApiKey}`,
          'Accept': 'application/json'
        }
      });
    } catch (e: any) {
      subscriptionsFetchError = e?.message || String(e);
      console.error('Subscriptions endpoint fetch error:', subscriptionsFetchError);
    }

    console.log('Subscriptions endpoint response status:', subscriptionsResponse?.status ?? 'fetch_error');
    let subscriptionsResult: any = null;
    let subscriptionsErrorBody: string | null = null;
    if (subscriptionsResponse && subscriptionsResponse.ok) {
      try {
        subscriptionsResult = await subscriptionsResponse.json();
        console.log('Subscriptions data received:', subscriptionsResult);
      } catch (e) {
        console.warn('Failed to parse subscriptions JSON:', e);
        subscriptionsErrorBody = 'Invalid JSON response';
      }
    } else if (subscriptionsResponse) {
      subscriptionsErrorBody = await subscriptionsResponse.text().catch(() => 'Failed to read error');
      console.log('Subscriptions endpoint error:', subscriptionsErrorBody);
    }

    // Test 3: Try to get plans/packages endpoint (alternative path)
    console.log('Testing GET /plans endpoint...');
    let plansResponse: Response | null = null;
    let plansFetchError: string | null = null;
    try {
      plansResponse = await fetch(`${apiBase}/plans`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${megaottApiKey}`,
          'Accept': 'application/json'
        }
      });
    } catch (e: any) {
      plansFetchError = e?.message || String(e);
      console.error('Plans endpoint fetch error:', plansFetchError);
    }

    console.log('Plans endpoint response status:', plansResponse?.status ?? 'fetch_error');
    let plansResult: any = null;
    let plansErrorBody: string | null = null;
    if (plansResponse && plansResponse.ok) {
      try {
        plansResult = await plansResponse.json();
        console.log('Plans data received:', plansResult);
      } catch (e) {
        console.warn('Failed to parse plans JSON:', e);
        plansErrorBody = 'Invalid JSON response';
      }
    } else if (plansResponse) {
      plansErrorBody = await plansResponse.text().catch(() => 'Failed to read error');
      console.log('Plans endpoint error:', plansErrorBody);
    }

    // Return test results
    const results = {
      success: true,
      apiUrl: apiBase,
      hasApiKey: !!megaottApiKey,
      tests: {
        userEndpoint: {
          status: userResponse ? userResponse.status : -1,
          success: !!(userResponse && userResponse.ok),
          data: userResult,
          error: userErrorBody || userFetchError
        },
        subscriptionsEndpoint: {
          status: subscriptionsResponse ? subscriptionsResponse.status : -1,
          success: !!(subscriptionsResponse && subscriptionsResponse.ok),
          data: subscriptionsResult,
          error: subscriptionsErrorBody || subscriptionsFetchError
        },
        plansEndpoint: {
          status: plansResponse ? plansResponse.status : -1,
          success: !!(plansResponse && plansResponse.ok),
          data: plansResult,
          error: plansErrorBody || plansFetchError
        }
      },
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(results, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Test error:', error);
    
    const errorResult = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResult, null, 2),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});