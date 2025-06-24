
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
    
    const formData = new URLSearchParams({
      username: MEGAOTT_USERNAME,
      password: MEGAOTT_PASSWORD,
      action: action,
      ...params
    });

    console.log(`📡 Calling MegaOTT API: ${action} to ${MEGAOTT_URL}`);
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
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON response from MegaOTT',
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
    
    return new Response(JSON.stringify({
      success: true,
      data: data
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
    
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
