import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const elements = signature.split(',');
    const timestamp = elements.find(el => el.startsWith('t='))?.substring(2);
    const v1 = elements.find(el => el.startsWith('v1='))?.substring(3);
    
    if (!timestamp || !v1) return false;
    
    const payload = `${timestamp}.${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature_bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expected = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return expected === v1;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function generateUsername(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'user_';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return new Response('Missing signature', { status: 400 });
    }

    const body = await req.text();
    
    // Verify webhook signature
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid signature');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Webhook event:', event.type, event.id);

    // Check for duplicate events
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', event.id)
      .eq('provider', 'stripe')
      .single();

    if (existingEvent) {
      console.log('Duplicate event, ignoring:', event.id);
      return new Response('OK', { status: 200 });
    }

    // Store webhook event
    await supabase
      .from('webhook_events')
      .insert({
        provider: 'stripe',
        event_id: event.id,
        payload: event,
        status_code: 200
      });

    // Process payment events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentId = session.metadata?.payment_id;
      const planId = session.metadata?.plan_id;
      const userId = session.client_reference_id;

      if (!paymentId || !planId || !userId) {
        console.error('Missing required metadata in session:', session.id);
        throw new Error('Missing required metadata');
      }

      console.log('Processing successful payment:', { paymentId, planId, userId });

      // Update payment status
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({ 
          status: 'succeeded',
          metadata: { stripe_session_completed: true }
        })
        .eq('id', paymentId);

      if (paymentUpdateError) {
        console.error('Failed to update payment:', paymentUpdateError);
        throw new Error('Failed to update payment status');
      }

      // Check if user already has an active subscription
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .single();

      if (existingSubscription) {
        // Extend existing subscription
        console.log('Extending existing subscription:', existingSubscription.id);
        
        const megaottUrl = Deno.env.get('MEGAOTT_API_URL');
        const megaottToken = Deno.env.get('MEGAOTT_API_KEY');

        if (megaottUrl && megaottToken && existingSubscription.megaott_subscription_id) {
          try {
            // Get package details - default to package 1 for simplicity
            const packageId = 1;
            
            const extendResponse = await fetch(`${megaottUrl}/v1/subscriptions/${existingSubscription.megaott_subscription_id}/extend`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${megaottToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                package_id: String(packageId),
                paid: '1'
              })
            });

            if (extendResponse.ok) {
              const extendResult = await extendResponse.json();
              
              await supabase
                .from('subscriptions')
                .update({
                  expiring_at: extendResult.new_expiration_date,
                  end_date: extendResult.new_expiration_date,
                  active: true
                })
                .eq('id', existingSubscription.id);
              
              console.log('Subscription extended successfully');
            } else {
              console.error('Failed to extend MegaOTT subscription:', await extendResponse.text());
            }
          } catch (error) {
            console.error('Error extending subscription:', error);
          }
        }
      } else {
        // Create new subscription
        console.log('Creating new subscription for user:', userId);
        
        const megaottUrl = Deno.env.get('MEGAOTT_API_URL');
        const megaottToken = Deno.env.get('MEGAOTT_API_KEY');

        if (megaottUrl && megaottToken) {
          try {
            const username = generateUsername();
            const packageId = 1; // Default package
            
            const createResponse = await fetch(`${megaottUrl}/v1/subscriptions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${megaottToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                type: 'M3U',
                username: username,
                package_id: String(packageId),
                max_connections: '1',
                forced_country: 'ALL',
                adult: '0',
                enable_vpn: '0',
                paid: '1'
              })
            });

            if (createResponse.ok) {
              const megaottResult = await createResponse.json();
              
              // Store subscription in database
              const { error: subscriptionError } = await supabase
                .from('subscriptions')
                .insert({
                  user_id: userId,
                  plan_id: planId,
                  plan_name: planId,
                  customer_email: session.customer_details?.email || '',
                  payment_method: 'stripe',
                  payment_status: 'completed',
                  status: 'active',
                  active: true,
                  megaott_subscription_id: megaottResult.id,
                  iptv_username: megaottResult.username,
                  iptv_password: megaottResult.password,
                  username_generated: username,
                  password_generated: megaottResult.password,
                  m3u_url: megaottResult.dns_link,
                  xtream_url: megaottResult.dns_link,
                  epg_url: megaottResult.dns_link,
                  subscription_type: 'm3u',
                  max_connections: 1,
                  forced_country: 'ALL',
                  adult_content: false,
                  enable_vpn: false,
                  paid: true,
                  expiring_at: megaottResult.expiring_at,
                  dns_link: megaottResult.dns_link,
                  dns_link_samsung_lg: megaottResult.dns_link_for_samsung_lg,
                  portal_link: megaottResult.portal_link,
                  package_id_megaott: packageId,
                  plan_price: session.amount_total / 100 // Convert from cents
                });

              if (subscriptionError) {
                console.error('Failed to store subscription:', subscriptionError);
                throw new Error('Failed to store subscription');
              }

              console.log('Subscription created successfully:', megaottResult.id);
            } else {
              const errorText = await createResponse.text();
              console.error('Failed to create MegaOTT subscription:', errorText);
              throw new Error('Failed to create IPTV subscription');
            }
          } catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
          }
        } else {
          console.warn('MegaOTT API not configured, creating placeholder subscription');
          
          // Create placeholder subscription for testing
          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan_id: planId,
              plan_name: planId,
              customer_email: session.customer_details?.email || '',
              payment_method: 'stripe',
              payment_status: 'completed',
              status: 'active',
              active: true,
              subscription_type: 'm3u',
              max_connections: 1,
              plan_price: session.amount_total / 100
            });
        }
      }

      // Mark webhook as processed
      await supabase
        .from('webhook_events')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('event_id', event.id);
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});