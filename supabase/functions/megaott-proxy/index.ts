
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
    
    // Use the working credentials from environment or fallback
    const MEGAOTT_USERNAME = Deno.env.get('MEGAOTT_USERNAME') || 'IX5E3YZZ';
    const MEGAOTT_PASSWORD = Deno.env.get('MEGAOTT_PASSWORD') || '2N1xXXid';
    let MEGAOTT_URL = Deno.env.get('MEGAOTT_API_URL') || 'https://megaott.net/player_api.php';
    
    // Fix URL format if it's missing protocol
    if (MEGAOTT_URL && !MEGAOTT_URL.startsWith('http://') && !MEGAOTT_URL.startsWith('https://')) {
      console.log(`⚠️ Fixing URL format: ${MEGAOTT_URL} -> https://${MEGAOTT_URL}`);
      MEGAOTT_URL = `https://${MEGAOTT_URL}`;
    }
    
    // Validate URL format before proceeding
    try {
      new URL(MEGAOTT_URL);
    } catch (urlError) {
      console.error(`❌ Invalid MegaOTT URL: ${MEGAOTT_URL}`, urlError);
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid MegaOTT API URL configuration: ${MEGAOTT_URL}`,
        code: 'INVALID_URL_CONFIG',
        userFriendlyMessage: 'MegaOTT service configuration error. Please contact administrator.'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
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

    // Handle different HTTP status codes
    if (response.status === 404) {
      console.error(`❌ MegaOTT API endpoint not found (404)`);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'MegaOTT API endpoint not found. Service may be temporarily unavailable.',
        code: 'HTTP_404',
        endpoint: MEGAOTT_URL,
        userFriendlyMessage: 'MegaOTT service is temporarily unavailable. Please try again later.'
      }), {
        status: 200, // Return 200 to prevent 502 errors in the client
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (response.status === 502 || response.status === 503) {
      console.error(`❌ MegaOTT API server error (${response.status})`);
      
      return new Response(JSON.stringify({
        success: false,
        error: `MegaOTT service unavailable (${response.status})`,
        code: `HTTP_${response.status}`,
        endpoint: MEGAOTT_URL,
        userFriendlyMessage: 'MegaOTT service is experiencing issues. Please try again in a few minutes.'
      }), {
        status: 200, // Return 200 to prevent 502 errors in the client
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
        error: `MegaOTT API error (${response.status})`,
        code: `HTTP_${response.status}`,
        endpoint: MEGAOTT_URL,
        userFriendlyMessage: 'MegaOTT service is temporarily unavailable. Please try again later.'
      }), {
        status: 200, // Return 200 to prevent 502 errors in the client
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
      console.error(`❌ MegaOTT returned HTML error page instead of JSON`);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'MegaOTT service returned an error page',
        code: 'HTML_ERROR_PAGE',
        details: 'Received HTML instead of JSON response',
        userFriendlyMessage: 'MegaOTT service is currently unavailable. Please try again later.'
      }), {
        status: 200, // Return 200 to prevent 502 errors in the client
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Handle empty responses
    if (!responseText || responseText.trim() === '') {
      console.error(`❌ MegaOTT returned empty response`);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'MegaOTT returned empty response',
        code: 'EMPTY_RESPONSE',
        userFriendlyMessage: 'MegaOTT service is not responding properly. Please try again later.'
      }), {
        status: 200, // Return 200 to prevent 502 errors in the client
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
      if (responseText.trim().length < 500) {
        return new Response(JSON.stringify({
          success: true,
          data: { message: responseText.trim(), raw: responseText }
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
        code: 'INVALID_JSON',
        userFriendlyMessage: 'MegaOTT returned an unexpected response format.'
      }), {
        status: 200, // Return 200 to prevent 502 errors in the client
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    console.log(`✅ MegaOTT response parsed successfully:`, JSON.stringify(data).substring(0, 500));
    
    // Handle different response formats from MegaOTT
    if (data && typeof data === 'object') {
      // Check if it's an error response from MegaOTT
      if (data.error || data.message === 'Error') {
        console.warn(`⚠️ MegaOTT API returned error:`, data);
        return new Response(JSON.stringify({
          success: false,
          error: data.error || data.message || 'MegaOTT API error',
          code: 'MEGAOTT_ERROR',
          data: data,
          userFriendlyMessage: data.error || 'MegaOTT service returned an error.'
        }), {
          status: 200, // Return 200 to prevent 502 errors in the client
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
        data: { message: data, raw: responseText }
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    }
    
  } catch (error) {
    console.error('❌ MegaOTT proxy fatal error:', error);
    
    // Check if it's a URL-related error
    if (error.message?.includes('Invalid URL')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'MegaOTT API URL configuration error',
          code: 'INVALID_URL_CONFIG',
          details: error.message,
          userFriendlyMessage: 'MegaOTT service configuration error. Please contact administrator.'
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Ensure we always return a valid response even on catastrophic errors
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Unknown proxy error',
        code: 'PROXY_ERROR',
        stack: error.stack,
        userFriendlyMessage: 'Service temporarily unavailable. Please try again later.'
      }),
      { 
        status: 200, // Return 200 to prevent 502 errors in the client
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
