
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check if all required MegaOTT environment variables are configured
    const config = {
      api_key_configured: !!Deno.env.get('MEGAOTT_USER_READ_TOKEN'),
      api_url_configured: !!Deno.env.get('MEGAOTT_API_URL'),
      username_configured: !!Deno.env.get('MEGAOTT_USERNAME'),
      password_configured: !!Deno.env.get('MEGAOTT_PASSWORD')
    };

    console.log('MegaOTT configuration check:', config);

    return new Response(
      JSON.stringify(config),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Configuration check failed:', error);
    return new Response(
      JSON.stringify({ error: 'Configuration check failed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
