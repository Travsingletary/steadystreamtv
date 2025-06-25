import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced endpoint management with intelligent routing
const ENDPOINT_CONFIG = {
  primary: 'https://megaott.net/player_api.php',
  backup: 'https://api.megaott.net/player_api.php',
  alternate: 'https://megaott.com/player_api.php'
};

async function selectBestEndpoint(): Promise<string> {
  const envUrl = Deno.env.get('MEGAOTT_API_URL');
  
  // If environment URL is set and valid, use it
  if (envUrl && envUrl !== 'duperab.xyz/player_api.php') {
    try {
      new URL(envUrl.startsWith('http') ? envUrl : `https://${envUrl}`);
      return envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
    } catch {
      console.warn(`⚠️ Invalid environment URL: ${envUrl}, falling back to defaults`);
    }
  }
  
  // Test endpoints in order and return first responsive one
  for (const [name, url] of Object.entries(ENDPOINT_CONFIG)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 405) { // 405 is acceptable for HEAD requests
        console.log(`✅ Selected ${name} endpoint: ${url}`);
        return url;
      }
    } catch (error) {
      console.warn(`⚠️ ${name} endpoint (${url}) failed:`, error.message);
      continue;
    }
  }
  
  // Fallback to primary
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
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        response = await fetch(MEGAOTT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'SteadyStreamTV-Enhanced/2.0',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
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
            error: 'All connection attempts failed',
            code: 'CONNECTION_FAILED',
            attempts: attempts,
            userFriendlyMessage: 'MegaOTT service is temporarily unavailable. Please try again in a few minutes.'
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.pow(2, attempts - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`📊 Enhanced MegaOTT Response Status: ${response.status} ${response.statusText} (attempt ${attempts})`);

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
        userFriendlyMessage: 'MegaOTT service is experiencing issues. Please try again in a few minutes.'
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
        userFriendlyMessage: 'MegaOTT service is temporarily unavailable. Please try again later.'
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
        userFriendlyMessage: 'MegaOTT service is currently unavailable. Please try again later.'
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
        userFriendlyMessage: 'MegaOTT service is not responding properly. Please try again later.'
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
        userFriendlyMessage: 'MegaOTT returned an unexpected response format.'
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
          userFriendlyMessage: data.error || 'MegaOTT service returned an error.'
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
        error: error.message || 'Unknown enhanced proxy error',
        code: 'ENHANCED_PROXY_ERROR',
        stack: error.stack,
        userFriendlyMessage: 'Enhanced service temporarily unavailable. Please try again later.'
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
