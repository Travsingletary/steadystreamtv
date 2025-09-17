import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      throw new Error('user_id parameter is required');
    }

    console.log('Checking subscription status for user:', userId);

    // Get user's active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        active,
        status,
        expiring_at,
        end_date,
        plan_name,
        iptv_username,
        iptv_password,
        m3u_url,
        subscription_type,
        max_connections
      `)
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    const response = {
      active: !!subscription?.active,
      expires_at: subscription?.expiring_at || subscription?.end_date,
      subscription: subscription ? {
        id: subscription.id,
        plan_name: subscription.plan_name,
        status: subscription.status,
        subscription_type: subscription.subscription_type,
        max_connections: subscription.max_connections,
        credentials: subscription.iptv_username ? {
          username: subscription.iptv_username,
          password: subscription.iptv_password,
          m3u_url: subscription.m3u_url
        } : null
      } : null
    };

    console.log('Subscription status response:', response);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Subscription status error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        active: false,
        expires_at: null,
        subscription: null
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});