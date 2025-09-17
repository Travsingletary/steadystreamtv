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
    const megaottApiKey = Deno.env.get('MEGAOTT_API_KEY');
    let megaottApiUrl = Deno.env.get('MEGAOTT_API_URL');

    console.log('Testing MegaOTT API...');
    console.log('API URL:', megaottApiUrl);
    console.log('API Key:', megaottApiKey ? 'Present' : 'Missing');

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

    // Test 1: Get Users endpoint (as per the API documentation)
    console.log('Testing GET /users endpoint...');
    let userResponse: Response | null = null;
    let userFetchError: string | null = null;
    try {
      userResponse = await fetch(`${apiBase}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `${megaottApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*'
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

    // Test 2: Try to get packages (if available)
    console.log('Testing package availability...');
    let packagesResponse: Response | null = null;
    let packagesFetchError: string | null = null;
    try {
      packagesResponse = await fetch(`${apiBase}/packages`, {
        method: 'GET',
        headers: {
          'Authorization': `${megaottApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': '*/*'
        }
      });
    } catch (e: any) {
      packagesFetchError = e?.message || String(e);
      console.error('Packages endpoint fetch error:', packagesFetchError);
    }

    console.log('Packages endpoint response status:', packagesResponse?.status ?? 'fetch_error');
    let packagesResult: any = null;
    let packagesErrorBody: string | null = null;
    if (packagesResponse && packagesResponse.ok) {
      try {
        packagesResult = await packagesResponse.json();
        console.log('Packages data received:', packagesResult);
      } catch (e) {
        console.warn('Failed to parse packages JSON:', e);
        packagesErrorBody = 'Invalid JSON response';
      }
    } else if (packagesResponse) {
      packagesErrorBody = await packagesResponse.text().catch(() => 'Failed to read error');
      console.log('Packages endpoint error (might not exist):', packagesErrorBody);
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
        packagesEndpoint: {
          status: packagesResponse ? packagesResponse.status : -1,
          success: !!(packagesResponse && packagesResponse.ok),
          data: packagesResult,
          error: packagesErrorBody || packagesFetchError
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