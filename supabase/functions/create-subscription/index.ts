import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSubscriptionRequest {
  userId: string;
  planType: string;
  email: string;
  name: string;
  packageId: number;
  templateId?: number;
  maxConnections?: number;
  forcedCountry?: string;
  adult?: boolean;
  enableVpn?: boolean;
  whatsappTelegram?: string;
  note?: string;
}

function log(message: string, data?: any) {
  console.log(`[create-subscription] ${message}`, data ? JSON.stringify(data) : '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: CreateSubscriptionRequest = await req.json();
    log('Creating MegaOTT subscription', payload);

    // Validate required fields
    if (!payload.userId || !payload.planType || !payload.email || !payload.packageId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: userId, planType, email, packageId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get MegaOTT API credentials
    const megaottApiUrl = Deno.env.get('MEGAOTT_API_URL');
    const megaottApiKey = Deno.env.get('MEGAOTT_API_KEY');

    if (!megaottApiUrl || !megaottApiKey) {
      log('Missing MegaOTT API credentials');
      return new Response(JSON.stringify({ 
        error: 'MegaOTT API credentials not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate username for M3U subscription
    const username = `USR${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    // Prepare subscription data according to API spec
    const subscriptionData = new URLSearchParams({
      type: 'M3U',
      username: username,
      package_id: payload.packageId.toString(),
      max_connections: (payload.maxConnections || 1).toString(),
      forced_country: payload.forcedCountry || 'ALL',
      adult: (payload.adult || false).toString(),
      enable_vpn: (payload.enableVpn || false).toString(),
      paid: 'true', // Mark as paid since user completed payment
      whatsapp_telegram: payload.whatsappTelegram || '',
      note: payload.note || `Created for ${payload.email}`
    });

    if (payload.templateId) {
      subscriptionData.append('template_id', payload.templateId.toString());
    }

    log('Calling MegaOTT API to create subscription', {
      url: `${megaottApiUrl}/subscriptions`,
      username: username
    });

    // Create subscription via MegaOTT API
    const megaottResponse = await fetch(`${megaottApiUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${megaottApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: subscriptionData.toString()
    });

    if (!megaottResponse.ok) {
      const errorData = await megaottResponse.text();
      log('MegaOTT API error', { 
        status: megaottResponse.status, 
        statusText: megaottResponse.statusText,
        error: errorData 
      });
      throw new Error(`MegaOTT API error: ${megaottResponse.status} ${errorData}`);
    }

    const megaottResult = await megaottResponse.json();
    log('MegaOTT subscription created successfully', megaottResult);

    // Store subscription in our database
    const { error: dbError } = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: payload.userId,
        customer_email: payload.email,
        customer_name: payload.name,
        plan_id: payload.planType,
        plan_name: payload.planType,
        payment_id: `megaott_${megaottResult.id}`,
        payment_method: 'crypto',
        payment_status: 'completed',
        status: 'active',
        megaott_subscription_id: megaottResult.id,
        iptv_username: megaottResult.username,
        iptv_password: megaottResult.password,
        package_id: payload.packageId,
        package_name: megaottResult.package?.name,
        template_id: payload.templateId,
        template_name: megaottResult.template?.name,
        max_connections: megaottResult.max_connections,
        adult_content: megaottResult.adult,
        enable_vpn: payload.enableVpn || false,
        forced_country: megaottResult.forced_country,
        note: megaottResult.note,
        whatsapp_telegram: megaottResult.whatsapp_telegram,
        paid: true,
        expiring_at: megaottResult.expiring_at,
        dns_link: megaottResult.dns_link,
        dns_link_samsung_lg: megaottResult.dns_link_for_samsung_lg,
        portal_link: megaottResult.portal_link,
        subscription_type: 'm3u',
        start_date: new Date().toISOString(),
        end_date: megaottResult.expiring_at,
        plan_price: 0 // Will be updated with actual price
      });

    if (dbError) {
      log('Database error storing subscription', dbError);
      // Don't fail the request if DB storage fails, subscription was created successfully
    }

    // Generate playlist URLs
    const playlistUrls = {
      m3u: megaottResult.dns_link ? `${megaottResult.dns_link}/get.php?username=${megaottResult.username}&password=${megaottResult.password}&type=m3u_plus&output=ts` : null,
      m3u_plus: megaottResult.dns_link ? `${megaottResult.dns_link}/get.php?username=${megaottResult.username}&password=${megaottResult.password}&type=m3u_plus&output=ts` : null,
      xspf: megaottResult.dns_link ? `${megaottResult.dns_link}/get.php?username=${megaottResult.username}&password=${megaottResult.password}&type=xspf&output=ts` : null
    };

    return new Response(JSON.stringify({
      success: true,
      message: 'IPTV subscription created successfully',
      data: {
        subscriptionId: megaottResult.id,
        username: megaottResult.username,
        password: megaottResult.password,
        playlistUrls: playlistUrls,
        expiringAt: megaottResult.expiring_at,
        dnsLink: megaottResult.dns_link,
        portalLink: megaottResult.portal_link
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log('Error creating subscription', error);
    return new Response(JSON.stringify({ 
      error: `Failed to create subscription: ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});