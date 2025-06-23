
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
    
    // Get credentials from environment
    const MEGAOTT_USERNAME = Deno.env.get('MEGAOTT_USERNAME') || 'IX5E3YZZ';
    const MEGAOTT_PASSWORD = Deno.env.get('MEGAOTT_PASSWORD') || '2N1xXXid';
    const MEGAOTT_URL = 'https://megaott.net/player_api.php';
    
    const formData = new URLSearchParams({
      username: MEGAOTT_USERNAME,
      password: MEGAOTT_PASSWORD,
      action: action,
      ...params
    });

    console.log(`📡 Calling MegaOTT API: ${action}`);
    
    const response = await fetch(MEGAOTT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`MegaOTT API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ MegaOTT response:`, data);
    
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
        error: error.message 
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
