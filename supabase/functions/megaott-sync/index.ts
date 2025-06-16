
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { reseller_id, sync_type } = await req.json();
    console.log('MegaOTT Sync request:', { reseller_id, sync_type });

    // Get MegaOTT credentials
    const megaOTTApiKey = Deno.env.get('MEGAOTT_API_KEY');
    const megaOTTApiUrl = Deno.env.get('MEGAOTT_API_URL') || 'https://api.megaott.com';
    const megaOTTUsername = Deno.env.get('MEGAOTT_USERNAME');
    const megaOTTPassword = Deno.env.get('MEGAOTT_PASSWORD');

    if (!megaOTTApiKey || !megaOTTUsername || !megaOTTPassword) {
      throw new Error('MegaOTT credentials not configured');
    }

    // Authenticate with MegaOTT
    console.log('Authenticating with MegaOTT...');
    const authResponse = await fetch(`${megaOTTApiUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': megaOTTApiKey
      },
      body: JSON.stringify({
        username: megaOTTUsername,
        password: megaOTTPassword
      })
    });

    if (!authResponse.ok) {
      throw new Error('MegaOTT authentication failed');
    }

    const authData = await authResponse.json();
    const token = authData.token;

    let syncResults = {
      credits_synced: 0,
      subscribers_synced: 0,
      errors: []
    };

    // Sync Credits
    if (sync_type === 'all' || sync_type === 'credits') {
      try {
        console.log('Syncing credits data...');
        
        const creditsResponse = await fetch(`${megaOTTApiUrl}/credits`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': megaOTTApiKey
          }
        });

        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          
          // Update or insert credits data
          const { error: creditsError } = await supabase
            .from('megaott_credits')
            .upsert([
              {
                reseller_id: reseller_id,
                amount: creditsData.amount || 0,
                last_updated: new Date().toISOString()
              }
            ]);

          if (creditsError) {
            syncResults.errors.push(`Credits sync error: ${creditsError.message}`);
          } else {
            syncResults.credits_synced = 1;
          }
        } else {
          syncResults.errors.push('Failed to fetch credits from MegaOTT API');
        }

      } catch (error) {
        syncResults.errors.push(`Credits sync error: ${error.message}`);
      }
    }

    // Sync Subscribers
    if (sync_type === 'all' || sync_type === 'subscribers') {
      try {
        console.log('Syncing subscribers data...');
        
        const subscribersResponse = await fetch(`${megaOTTApiUrl}/subscribers`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-Key': megaOTTApiKey
          }
        });

        if (subscribersResponse.ok) {
          const subscribersData = await subscribersResponse.json();
          
          // Prepare batch upsert for subscribers
          const subscribersToUpsert = subscribersData.subscribers?.map((sub: any) => ({
            external_id: sub.id.toString(),
            reseller_id: reseller_id,
            username: sub.username,
            password: sub.password,
            status: sub.status || 'active',
            plan: sub.plan || 'basic',
            max_connections: sub.max_connections || 1,
            expires_at: sub.expires_at ? new Date(sub.expires_at).toISOString() : null,
            last_synced: new Date().toISOString()
          })) || [];

          if (subscribersToUpsert.length > 0) {
            // Update existing subscribers and insert new ones
            const { error: subscribersError } = await supabase
              .from('megaott_subscribers')
              .upsert(subscribersToUpsert, {
                onConflict: 'external_id'
              });

            if (subscribersError) {
              syncResults.errors.push(`Subscribers sync error: ${subscribersError.message}`);
            } else {
              syncResults.subscribers_synced = subscribersToUpsert.length;
            }
          }

        } else {
          syncResults.errors.push('Failed to fetch subscribers from MegaOTT API');
        }

      } catch (error) {
        syncResults.errors.push(`Subscribers sync error: ${error.message}`);
      }
    }

    // Log sync operation
    await supabase.from('megaott_diagnostics').insert({
      test_type: 'data_sync',
      status: syncResults.errors.length === 0 ? 'success' : 'failure',
      response_data: syncResults,
      error_message: syncResults.errors.length > 0 ? syncResults.errors.join(', ') : null
    });

    return new Response(
      JSON.stringify({
        success: true,
        results: syncResults,
        message: `Sync completed: ${syncResults.credits_synced} credits, ${syncResults.subscribers_synced} subscribers synced`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('MegaOTT sync error:', error);
    
    // Log sync error
    await supabase.from('megaott_diagnostics').insert({
      test_type: 'data_sync',
      status: 'failure',
      error_message: error.message
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
