import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelRequest {
  user_id: string;
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

    const { user_id }: CancelRequest = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    console.log('Cancelling subscription for user:', user_id);

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

    // Deactivate subscription in MegaOTT
    const megaottUrl = Deno.env.get('MEGAOTT_API_URL');
    const megaottToken = Deno.env.get('MEGAOTT_API_KEY');

    if (megaottUrl && megaottToken && subscription.megaott_subscription_id) {
      try {
        const deactivateResponse = await fetch(`${megaottUrl}/v1/subscriptions/${subscription.megaott_subscription_id}/deactivate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${megaottToken}`,
            'Accept': 'application/json',
          }
        });

        if (deactivateResponse.ok) {
          const deactivateResult = await deactivateResponse.json();
          console.log('Subscription deactivated in MegaOTT:', deactivateResult);
        } else {
          console.error('Failed to deactivate in MegaOTT:', await deactivateResponse.text());
        }
      } catch (error) {
        console.error('Error deactivating MegaOTT subscription:', error);
      }
    }

    // Update subscription in database
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        active: false,
        status: 'cancelled'
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
        message: 'Subscription cancelled successfully',
        subscription: updatedSubscription
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Cancel subscription error:', error);
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