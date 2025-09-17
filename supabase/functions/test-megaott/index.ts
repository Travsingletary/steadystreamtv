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

    // Test 1: Get User Information
    console.log('Testing GET /user endpoint...');
    const userResponse = await fetch(`${megaottApiUrl}/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${megaottApiKey}`,
        'Accept': 'application/json'
      }
    });

    console.log('User endpoint response status:', userResponse.status);
    console.log('User endpoint response headers:', Object.fromEntries(userResponse.headers.entries()));

    let userResult = null;
    if (userResponse.ok) {
      userResult = await userResponse.json();
      console.log('User data received:', userResult);
    } else {
      const errorText = await userResponse.text();
      console.error('User endpoint error:', errorText);
    }

    // Test 2: Try to get packages (if available)
    console.log('Testing package availability...');
    const packagesResponse = await fetch(`${megaottApiUrl}/packages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${megaottApiKey}`,
        'Accept': 'application/json'
      }
    });

    console.log('Packages endpoint response status:', packagesResponse.status);
    let packagesResult = null;
    if (packagesResponse.ok) {
      packagesResult = await packagesResponse.json();
      console.log('Packages data received:', packagesResult);
    } else {
      const errorText = await packagesResponse.text();
      console.log('Packages endpoint error (might not exist):', errorText);
    }

    // Return test results
    const results = {
      success: true,
      apiUrl: megaottApiUrl,
      hasApiKey: !!megaottApiKey,
      tests: {
        userEndpoint: {
          status: userResponse.status,
          success: userResponse.ok,
          data: userResult,
          error: !userResponse.ok ? await userResponse.text().catch(() => 'Failed to read error') : null
        },
        packagesEndpoint: {
          status: packagesResponse.status,
          success: packagesResponse.ok,
          data: packagesResult,
          error: !packagesResponse.ok ? await packagesResponse.text().catch(() => 'Failed to read error') : null
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