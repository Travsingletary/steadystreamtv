import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtendRequest {
  user_id: string;
  package_id: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, package_id }: ExtendRequest = await req.json();

    if (!user_id || !package_id) {
      throw new Error('user_id and package_id are required');
    }

    console.log('Extending subscription for user:', user_id, 'package:', package_id);

    // Get user's active subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('active', true)
      .single();

    if (subscriptionError) {
      console.error('Subscription not found:', subscriptionError);
      throw new Error('Active subscription not found');
    }

    // Extend subscription in MegaOTT
    const megaottUrl = Deno.env.get('MEGAOTT_API_URL');
    const megaottToken = Deno.env.get('MEGAOTT_API_KEY');

    if (!megaottUrl || !megaottToken) {
      throw new Error('MegaOTT API not configured');
    }

    if (!subscription.megaott_subscription_id) {
      throw new Error('No MegaOTT subscription ID found');
    }

    const extendResponse = await fetch(`${megaottUrl}/v1/subscriptions/${subscription.megaott_subscription_id}/extend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${megaottToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        package_id: String(package_id),
        paid: '1'
      })
    });

    if (!extendResponse.ok) {
      const errorText = await extendResponse.text();
      console.error('MegaOTT extend error:', errorText);
      throw new Error(`Failed to extend subscription: ${extendResponse.status} - ${errorText}`);
    }

    const extendResult = await extendResponse.json();
    console.log('Subscription extended in MegaOTT:', extendResult);

    // Update subscription in database
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        expiring_at: extendResult.new_expiration_date,
        end_date: extendResult.new_expiration_date,
        active: true,
        package_id_megaott: package_id
      })
      .eq('id', subscription.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      throw new Error('Failed to update subscription in database');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription extended successfully',
        new_expiration_date: extendResult.new_expiration_date,
        subscription: updatedSubscription
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Extend subscription error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});