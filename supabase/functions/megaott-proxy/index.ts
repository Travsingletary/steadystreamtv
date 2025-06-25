
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced endpoint management with working endpoints
const ENDPOINT_CONFIG = {
  primary: 'http://megaott.net/player_api.php',
  backup: 'http://api.megaott.net/player_api.php', 
  alternate: 'http://megaott.com/player_api.php',
  fallback: 'http://panel.megaott.net/player_api.php'
};

async function selectBestEndpoint(): Promise<string> {
  console.log('🔍 Testing endpoints for connectivity...');
  
  // Test endpoints in order and return first responsive one
  for (const [name, url] of Object.entries(ENDPOINT_CONFIG)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Use POST instead of HEAD to match actual API usage
      const testResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SteadyStreamTV-Enhanced/2.0'
        },
        body: 'username=test&password=test&action=get_user_info',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (testResponse.ok || testResponse.status === 400) { 
        // 400 is acceptable - means endpoint is up but credentials are wrong
        console.log(`✅ Selected ${name} endpoint: ${url}`);
        return url;
      } else {
        console.warn(`⚠️ ${name} endpoint responded with status ${testResponse.status}`);
      }
    } catch (error) {
      console.warn(`⚠️ ${name} endpoint (${url}) failed:`, error.message);
      continue;
    }
  }
  
  // If all fail, try the environment URL as last resort
  const envUrl = Deno.env.get('MEGAOTT_API_URL');
  if (envUrl && !envUrl.includes('duperab.xyz')) {
    const finalUrl = envUrl.startsWith('http') ? envUrl : `http://${envUrl}`;
    console.log(`🔄 Using environment URL as last resort: ${finalUrl}`);
    return finalUrl;
  }
  
  // Final fallback to primary
  console.log(`🔄 All endpoints failed, using primary: ${ENDPOINT_CONFIG.primary}`);
  return ENDPOINT_CONFIG.primary;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    console.log(`🔄 Enhanced MegaOTT Proxy: ${action}`, params);
    
    // Use enhanced endpoint selection
    const MEGAOTT_URL = await selectBestEndpoint();
    
    // Use the working credentials from environment or fallback
    const MEGAOTT_USERNAME = Deno.env.get('MEGAOTT_USERNAME') || 'IX5E3YZZ';
    const MEGAOTT_PASSWORD = Deno.env.get('MEGAOTT_PASSWORD') || '2N1xXXid';
    
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

    console.log(`📡 Calling Enhanced MegaOTT API: ${megaottAction} to ${MEGAOTT_URL}`);
    console.log(`🔑 Using credentials: ${MEGAOTT_USERNAME.substring(0, 3)}***`);
    
    // Enhanced request with retry logic
    let response;
    let attempts = 0;
    const maxAttempts = 2; // Reduced attempts since we pre-test endpoints
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        response = await fetch(MEGAOTT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'SteadyStreamTV-Enhanced/2.0',
            'Accept': 'application/json'
          },
          body: formData.toString(),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        break; // Success, exit retry loop
        
      } catch (error) {
        console.warn(`❌ Attempt ${attempts}/${maxAttempts} failed:`, error.message);
        
        if (attempts === maxAttempts) {
          return new Response(JSON.stringify({
            success: false,
            error: 'MegaOTT service temporarily unavailable',
            code: 'CONNECTION_FAILED',
            attempts: attempts,
            endpoint: MEGAOTT_URL,
            userFriendlyMessage: 'IPTV service is temporarily unavailable. Please try again in a few minutes.'
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📊 Enhanced MegaOTT Response Status: ${response.status} ${response.statusText} (attempt ${attempts})`);

    // Handle different HTTP status codes
    if (response.status === 404) {
      console.error(`❌ MegaOTT API endpoint not found (404)`);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'MegaOTT API endpoint not found',
        code: 'HTTP_404',
        endpoint: MEGAOTT_URL,
        userFriendlyMessage: 'IPTV service endpoint is temporarily unavailable.'
      }), {
        status: 200,
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
        userFriendlyMessage: 'IPTV service is experiencing issues. Please try again in a few minutes.'
      }), {
        status: 200,
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
        userFriendlyMessage: 'IPTV service returned an error. Please try again later.'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Get response text first to handle both JSON and non-JSON responses
    const responseText = await response.text();
    console.log(`📊 Enhanced MegaOTT Raw Response:`, responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

    // Check if response is HTML (error page)
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
      console.error(`❌ MegaOTT returned HTML error page instead of JSON`);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'MegaOTT service returned an error page',
        code: 'HTML_ERROR_PAGE',
        details: 'Received HTML instead of JSON response',
        userFriendlyMessage: 'IPTV service is currently unavailable. Please try again later.'
      }), {
        status: 200,
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
        userFriendlyMessage: 'IPTV service is not responding properly. Please try again later.'
      }), {
        status: 200,
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
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response format from MegaOTT',
        rawResponse: responseText.substring(0, 1000),
        code: 'INVALID_JSON',
        userFriendlyMessage: 'IPTV service returned an unexpected response format.'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    console.log(`✅ Enhanced MegaOTT response parsed successfully:`, JSON.stringify(data).substring(0, 500));
    
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
          userFriendlyMessage: data.error || 'IPTV service returned an error.'
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        data: data,
        endpoint: MEGAOTT_URL,
        enhanced: true
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    } else {
      return new Response(JSON.stringify({
        success: true,
        data: { message: data, raw: responseText },
        endpoint: MEGAOTT_URL,
        enhanced: true
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    }
    
  } catch (error) {
    console.error('❌ Enhanced MegaOTT proxy fatal error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Enhanced proxy service error',
        code: 'ENHANCED_PROXY_ERROR',
        stack: error.stack,
        userFriendlyMessage: 'IPTV service temporarily unavailable. Please try again later.'
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
});
