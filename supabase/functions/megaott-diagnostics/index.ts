
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticResult {
  test_type: string;
  status: 'success' | 'failure';
  response_data?: any;
  error_message?: string;
}

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
    const { action } = await req.json();
    console.log('MegaOTT Diagnostics action:', action);

    // Get MegaOTT credentials
    const megaOTTApiKey = Deno.env.get('MEGAOTT_API_KEY');
    const megaOTTApiUrl = Deno.env.get('MEGAOTT_API_URL') || 'https://api.megaott.com';
    const megaOTTUsername = Deno.env.get('MEGAOTT_USERNAME');
    const megaOTTPassword = Deno.env.get('MEGAOTT_PASSWORD');

    const results: DiagnosticResult[] = [];

    // Test 1: Configuration Check
    const configResult: DiagnosticResult = {
      test_type: 'configuration_check',
      status: 'success',
      response_data: {
        api_key_configured: !!megaOTTApiKey,
        api_url_configured: !!megaOTTApiUrl,
        username_configured: !!megaOTTUsername,
        password_configured: !!megaOTTPassword
      }
    };

    if (!megaOTTApiKey || !megaOTTUsername || !megaOTTPassword) {
      configResult.status = 'failure';
      configResult.error_message = 'Missing required MegaOTT credentials';
    }

    results.push(configResult);

    // Log configuration check
    await supabase.from('megaott_diagnostics').insert(configResult);

    // Only proceed with API tests if configuration is valid
    if (configResult.status === 'success') {
      
      // Test 2: Authentication Test
      try {
        console.log('Testing MegaOTT authentication...');
        
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

        const authData = await authResponse.json();
        
        const authResult: DiagnosticResult = {
          test_type: 'authentication_test',
          status: authResponse.ok ? 'success' : 'failure',
          response_data: authData
        };

        if (!authResponse.ok) {
          authResult.error_message = `Authentication failed: ${authData.message || 'Unknown error'}`;
        }

        results.push(authResult);
        await supabase.from('megaott_diagnostics').insert(authResult);

        // Test 3: Credits API Test (if authentication succeeded)
        if (authResponse.ok && authData.token) {
          try {
            console.log('Testing credits API...');
            
            const creditsResponse = await fetch(`${megaOTTApiUrl}/credits`, {
              headers: {
                'Authorization': `Bearer ${authData.token}`,
                'X-API-Key': megaOTTApiKey
              }
            });

            const creditsData = await creditsResponse.json();
            
            const creditsResult: DiagnosticResult = {
              test_type: 'credits_api_test',
              status: creditsResponse.ok ? 'success' : 'failure',
              response_data: creditsData
            };

            if (!creditsResponse.ok) {
              creditsResult.error_message = `Credits API failed: ${creditsData.message || 'Unknown error'}`;
            }

            results.push(creditsResult);
            await supabase.from('megaott_diagnostics').insert(creditsResult);

          } catch (error) {
            const creditsErrorResult: DiagnosticResult = {
              test_type: 'credits_api_test',
              status: 'failure',
              error_message: `Credits API error: ${error.message}`
            };
            results.push(creditsErrorResult);
            await supabase.from('megaott_diagnostics').insert(creditsErrorResult);
          }

          // Test 4: Subscribers API Test
          try {
            console.log('Testing subscribers API...');
            
            const subscribersResponse = await fetch(`${megaOTTApiUrl}/subscribers?limit=5`, {
              headers: {
                'Authorization': `Bearer ${authData.token}`,
                'X-API-Key': megaOTTApiKey
              }
            });

            const subscribersData = await subscribersResponse.json();
            
            const subscribersResult: DiagnosticResult = {
              test_type: 'subscribers_api_test',
              status: subscribersResponse.ok ? 'success' : 'failure',
              response_data: subscribersData
            };

            if (!subscribersResponse.ok) {
              subscribersResult.error_message = `Subscribers API failed: ${subscribersData.message || 'Unknown error'}`;
            }

            results.push(subscribersResult);
            await supabase.from('megaott_diagnostics').insert(subscribersResult);

          } catch (error) {
            const subscribersErrorResult: DiagnosticResult = {
              test_type: 'subscribers_api_test',
              status: 'failure',
              error_message: `Subscribers API error: ${error.message}`
            };
            results.push(subscribersErrorResult);
            await supabase.from('megaott_diagnostics').insert(subscribersErrorResult);
          }
        }

      } catch (error) {
        const authErrorResult: DiagnosticResult = {
          test_type: 'authentication_test',
          status: 'failure',
          error_message: `Authentication error: ${error.message}`
        };
        results.push(authErrorResult);
        await supabase.from('megaott_diagnostics').insert(authErrorResult);
      }
    }

    // Test 5: Database Connectivity Test
    try {
      console.log('Testing database connectivity...');
      
      const { data: testData, error: dbError } = await supabase
        .from('megaott_diagnostics')
        .select('count')
        .limit(1);

      const dbResult: DiagnosticResult = {
        test_type: 'database_connectivity_test',
        status: dbError ? 'failure' : 'success',
        response_data: { records_found: testData?.length || 0 }
      };

      if (dbError) {
        dbResult.error_message = `Database error: ${dbError.message}`;
      }

      results.push(dbResult);
      await supabase.from('megaott_diagnostics').insert(dbResult);

    } catch (error) {
      const dbErrorResult: DiagnosticResult = {
        test_type: 'database_connectivity_test',
        status: 'failure',
        error_message: `Database connectivity error: ${error.message}`
      };
      results.push(dbErrorResult);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total_tests: results.length,
          passed: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'failure').length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('MegaOTT diagnostics error:', error);
    
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
