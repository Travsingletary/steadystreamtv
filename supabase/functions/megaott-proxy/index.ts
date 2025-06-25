
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
    
    // Use the working credentials from the working test
    const MEGAOTT_USERNAME = 'IX5E3YZZ';
    const MEGAOTT_PASSWORD = '2N1xXXid';
    const MEGAOTT_URL = 'https://megaott.net/player_api.php';
    
    // Map actions to the correct MegaOTT API actions
    let megaottAction = action;
    if (action === 'user_info') {
      megaottAction = 'get_user_info';
    } else if (action === 'get_users') {
      megaottAction = 'get_users';
    } else if (action === 'get_credits') {
      megaottAction = 'get_user_info'; // Credits are part of user info
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
        'Accept': 'application/json'
      },
      body: formData.toString()
    });

    console.log(`📊 MegaOTT Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`❌ MegaOTT API returned ${response.status}: ${response.statusText}`);
      
      return new Response(JSON.stringify({
        success: false,
        error: `MegaOTT API unavailable (${response.status})`,
        code: `HTTP_${response.status}`,
        endpoint: MEGAOTT_URL
      }), {
        status: 502,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Get response text first to handle both JSON and non-JSON responses
    const responseText = await response.text();
    console.log(`📊 MegaOTT Raw Response:`, responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

    // Check if response is HTML (error page)
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
      console.error(`❌ MegaOTT returned HTML error page`);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'MegaOTT service temporarily unavailable',
        code: 'HTML_ERROR_PAGE',
        details: 'Received HTML instead of JSON response'
      }), {
        status: 502,
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
        rawResponse: responseText.substring(0, 1000),
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
      // Check if it's an error response from MegaOTT
      if (data.error || data.message === 'Error') {
        return new Response(JSON.stringify({
          success: false,
          error: data.error || data.message || 'MegaOTT API error',
          code: 'MEGAOTT_ERROR',
          data: data
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
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
        error: error.message || 'Unknown proxy error',
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
