
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    console.log(`🔄 MegaOTT Proxy: ${action}`, params);
    
    // Use working credentials from your test
    const MEGAOTT_USERNAME = 'IX5E3YZZ';
    const MEGAOTT_PASSWORD = '2N1xXXid';
    const MEGAOTT_URL = 'https://megaott.net/player_api.php';
    
    // Map actions to the correct MegaOTT API actions
    let megaottAction = action;
    if (action === 'user_info') {
      megaottAction = 'get_user_info';
    } else if (action === 'get_users') {
      megaottAction = 'get_users';
    }
    
    const formData = new URLSearchParams({
      username: MEGAOTT_USERNAME,
      password: MEGAOTT_PASSWORD,
      action: megaottAction,
      ...params
    });

    console.log(`📡 Calling MegaOTT API: ${megaottAction} to ${MEGAOTT_URL}`);
    console.log(`🔑 Using credentials: ${MEGAOTT_USERNAME.substring(0, 3)}***`);
    
    const response = await fetch(MEGAOTT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SteadyStreamTV/1.0',
      },
      body: formData.toString()
    });

    console.log(`📊 MegaOTT Response Status: ${response.status} ${response.statusText}`);

    // Get response text first to handle both JSON and non-JSON responses
    const responseText = await response.text();
    console.log(`📊 MegaOTT Raw Response:`, responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

    // Check if response is HTML (error page)
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
      console.error(`❌ MegaOTT returned HTML error page`);
      
      // Extract error message from HTML if possible
      let errorMessage = 'MegaOTT API unavailable';
      if (responseText.includes('Not Found')) {
        errorMessage = 'MegaOTT API endpoint not found';
      } else if (responseText.includes('Unauthorized')) {
        errorMessage = 'MegaOTT API authentication failed';
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        code: `HTTP_${response.status}`,
        details: 'MegaOTT API returned HTML error page instead of JSON'
      }), {
        status: 502,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (!response.ok) {
      console.error(`❌ MegaOTT API returned ${response.status}: ${response.statusText}`);
      
      return new Response(JSON.stringify({
        success: false,
        error: `MegaOTT API returned ${response.status}`,
        details: responseText,
        code: `HTTP_${response.status}`,
        endpoint: MEGAOTT_URL
      }), {
        status: response.status,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Try to parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ Failed to parse MegaOTT response as JSON:`, parseError);
      
      // If it's not JSON, maybe it's a simple string response
      if (responseText.trim()) {
        return new Response(JSON.stringify({
          success: true,
          data: { message: responseText.trim() }
        }), {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          },
        });
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response format from MegaOTT',
        rawResponse: responseText,
        code: 'INVALID_JSON'
      }), {
        status: 502,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    console.log(`✅ MegaOTT response parsed successfully:`, data);
    
    // Handle different response formats from MegaOTT
    if (data && typeof data === 'object') {
      return new Response(JSON.stringify({
        success: true,
        data: data
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    } else {
      return new Response(JSON.stringify({
        success: true,
        data: { message: data }
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    }
    
  } catch (error) {
    console.error('❌ MegaOTT proxy error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        code: 'PROXY_ERROR',
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
