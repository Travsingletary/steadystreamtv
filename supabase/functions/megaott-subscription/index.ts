import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MegaOTTCreateRequest {
  userId: string;
  subscriptionType: 'm3u' | 'mag' | 'enigma';
  packageId: number;
  templateId?: number;
  maxConnections: number;
  forcedCountry: string;
  adultContent: boolean;
  enableVpn: boolean;
  macAddress?: string;
  note?: string;
  whatsappTelegram?: string;
}

interface MegaOTTExtendRequest {
  subscriptionId: string;
  packageId: number;
  paid: boolean;
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

    const megaottApiKey = Deno.env.get('MEGAOTT_API_KEY');
    const megaottApiUrl = Deno.env.get('MEGAOTT_API_URL');

    if (!megaottApiKey || !megaottApiUrl) {
      throw new Error('MegaOTT API configuration missing');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';
    const requestBody = await req.json();
    
    // Support action passed in body as well
    const finalAction = requestBody.action || action;

    console.log(`MegaOTT API action: ${finalAction}`, requestBody);

    switch (finalAction) {
      case 'create':
        return await createSubscription(supabase, megaottApiUrl, megaottApiKey, requestBody as MegaOTTCreateRequest);
      case 'extend':
        return await extendSubscription(supabase, megaottApiUrl, megaottApiKey, requestBody as MegaOTTExtendRequest);
      case 'activate':
        return await activateSubscription(supabase, megaottApiUrl, megaottApiKey, requestBody);
      case 'deactivate':
        return await deactivateSubscription(supabase, megaottApiUrl, megaottApiKey, requestBody);
      case 'get-user':
        return await getUser(megaottApiUrl, megaottApiKey);
      default:
        throw new Error(`Unknown action: ${finalAction}`);
    }
  } catch (error) {
    console.error('MegaOTT API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function createSubscription(
  supabase: any, 
  apiUrl: string, 
  apiKey: string, 
  data: MegaOTTCreateRequest
) {
  console.log('Creating MegaOTT subscription:', data);

  // Get package details
  const { data: packageData, error: packageError } = await supabase
    .from('packages')
    .select('*')
    .eq('megaott_package_id', data.packageId)
    .single();

  if (packageError) {
    throw new Error(`Package not found: ${packageError.message}`);
  }

  // Get template details if provided
  let templateData = null;
  if (data.templateId) {
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('megaott_template_id', data.templateId)
      .single();

    if (templateError) {
      console.warn('Template not found:', templateError.message);
    } else {
      templateData = template;
    }
  }

  // Prepare MegaOTT API request
  const megaottPayload = new URLSearchParams({
    type: data.subscriptionType.toUpperCase(),
    package_id: data.packageId.toString(),
    max_connections: data.maxConnections.toString(),
    forced_country: data.forcedCountry,
    adult: data.adultContent ? '1' : '0',
    enable_vpn: data.enableVpn ? '1' : '0',
    paid: '1', // Always mark as paid since they completed payment
    ...(data.subscriptionType === 'm3u' && { username: generateUsername() }),
    ...(data.subscriptionType !== 'm3u' && data.macAddress && { mac_address: data.macAddress }),
    ...(data.templateId && { template_id: data.templateId.toString() }),
    ...(data.note && { note: data.note }),
    ...(data.whatsappTelegram && { whatsapp_telegram: data.whatsappTelegram })
  });

  console.log('MegaOTT API payload:', Object.fromEntries(megaottPayload));

  // Call MegaOTT API
  const response = await fetch(`${apiUrl}/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: megaottPayload
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('MegaOTT API error:', response.status, errorText);
    throw new Error(`MegaOTT API error: ${response.status} - ${errorText}`);
  }

  const megaottResult = await response.json();
  console.log('MegaOTT subscription created:', megaottResult);

  // Calculate expiration date
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + packageData.duration_days);

  // Update subscription in Supabase
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      subscription_type: data.subscriptionType,
      package_id: data.packageId,
      package_name: packageData.name,
      template_id: data.templateId,
      template_name: templateData?.name,
      max_connections: data.maxConnections,
      forced_country: data.forcedCountry,
      adult_content: data.adultContent,
      enable_vpn: data.enableVpn,
      paid: true,
      megaott_subscription_id: megaottResult.id,
      iptv_username: megaottResult.username,
      iptv_password: megaottResult.password,
      mac_address: megaottResult.mac_address,
      dns_link: megaottResult.dns_link,
      dns_link_samsung_lg: megaottResult.dns_link_for_samsung_lg,
      portal_link: megaottResult.portal_link,
      expiring_at: megaottResult.expiring_at,
      start_date: new Date().toISOString(),
      end_date: expirationDate.toISOString(),
      note: data.note,
      whatsapp_telegram: data.whatsappTelegram
    })
    .eq('user_id', data.userId)
    .eq('status', 'pending');

  if (updateError) {
    console.error('Failed to update subscription:', updateError);
    throw new Error(`Failed to update subscription: ${updateError.message}`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      subscription: megaottResult,
      message: 'Subscription created successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function extendSubscription(
  supabase: any,
  apiUrl: string,
  apiKey: string,
  data: MegaOTTExtendRequest
) {
  console.log('Extending subscription:', data);

  // Get subscription details
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', data.subscriptionId)
    .single();

  if (subError) {
    throw new Error(`Subscription not found: ${subError.message}`);
  }

  // Call MegaOTT API to extend
  const response = await fetch(`${apiUrl}/subscriptions/${subscription.megaott_subscription_id}/extend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      package_id: data.packageId.toString(),
      paid: data.paid ? '1' : '0'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MegaOTT API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Subscription extended:', result);

  // Update expiration in Supabase
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      expiring_at: result.new_expiration_date,
      end_date: result.new_expiration_date
    })
    .eq('id', data.subscriptionId);

  if (updateError) {
    throw new Error(`Failed to update expiration: ${updateError.message}`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: result.message,
      new_expiration_date: result.new_expiration_date
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function activateSubscription(
  supabase: any,
  apiUrl: string,
  apiKey: string,
  data: { subscriptionId: string }
) {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', data.subscriptionId)
    .single();

  if (error) {
    throw new Error(`Subscription not found: ${error.message}`);
  }

  const response = await fetch(`${apiUrl}/subscriptions/${subscription.megaott_subscription_id}/activate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MegaOTT API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // Update status in Supabase
  await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('id', data.subscriptionId);

  return new Response(
    JSON.stringify({ success: true, message: result.message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function deactivateSubscription(
  supabase: any,
  apiUrl: string,
  apiKey: string,
  data: { subscriptionId: string }
) {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', data.subscriptionId)
    .single();

  if (error) {
    throw new Error(`Subscription not found: ${error.message}`);
  }

  const response = await fetch(`${apiUrl}/subscriptions/${subscription.megaott_subscription_id}/deactivate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MegaOTT API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // Update status in Supabase
  await supabase
    .from('subscriptions')
    .update({ status: 'inactive' })
    .eq('id', data.subscriptionId);

  return new Response(
    JSON.stringify({ success: true, message: result.message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getUser(apiUrl: string, apiKey: string) {
  const response = await fetch(`${apiUrl}/user`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MegaOTT API error: ${response.status} - ${errorText}`);
  }

  const user = await response.json();

  return new Response(
    JSON.stringify({ success: true, user }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generateUsername(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}