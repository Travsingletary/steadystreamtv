
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { name, email, password, plan = 'trial', deviceInfo } = await req.json();

    console.log(`🚀 Starting automated registration for ${email}`);

    // Validate input
    if (!name || !email || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: name, email, password'
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Generate activation code and device token
    const activationCode = crypto.randomUUID().substring(0, 6).toUpperCase();
    const deviceToken = crypto.randomUUID();

    // Create user profile directly (simplified approach)
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        full_name: name,
        email: email,
        subscription_plan: plan,
        activation_code: activationCode,
        status: 'active'
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    // Generate playlist data
    const playlistToken = btoa(JSON.stringify({
      userId: profileData.id,
      plan,
      activationCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000)
    }));

    const baseUrl = 'https://steadystream-tv.lovable.app';
    const playlistUrl = `${baseUrl}/api/playlist/${playlistToken}.m3u8`;
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(playlistUrl)}`;

    // Call MegaOTT API if available
    let megaottResult = { success: false, fallback: true };
    try {
      const megaottResponse = await supabase.rpc('create_megaott_subscription_v2', {
        user_id_param: profileData.id,
        customer_email: email,
        customer_name: name,
        plan_type: plan
      });

      if (megaottResponse.data?.success) {
        megaottResult = {
          success: true,
          userId: megaottResponse.data.subscription_id,
          credentials: megaottResponse.data.credentials
        };
      }
    } catch (megaError) {
      console.warn(`⚠️ MegaOTT integration failed: ${megaError.message}`);
    }

    // Send welcome email
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          userId: profileData.id,
          email: email,
          name: name,
          iptv: megaottResult.credentials || {
            username: activationCode,
            password: deviceToken.substring(0, 12),
            playlistUrls: {
              m3u: playlistUrl,
              m3u_plus: playlistUrl,
              xspf: playlistUrl.replace('.m3u8', '.xspf')
            }
          }
        }
      });
      console.log(`✅ Welcome email sent`);
    } catch (emailError) {
      console.warn(`⚠️ Email sending failed: ${emailError.message}`);
    }

    const subscriptionPlans = {
      trial: { name: '24-Hour Free Trial', price: 0, duration: 1, streams: 1 },
      basic: { name: 'Solo Stream', price: 20, duration: 30, streams: 1 },
      duo: { name: 'Duo Stream', price: 35, duration: 30, streams: 2 },
      family: { name: 'Family Max', price: 45, duration: 30, streams: 3 }
    };

    return new Response(JSON.stringify({
      success: true,
      message: 'Account created successfully!',
      data: {
        userId: profileData.id,
        activationCode,
        playlistUrl,
        qrCode,
        subscription: {
          plan: subscriptionPlans[plan as keyof typeof subscriptionPlans],
          active: true,
          expiresAt: plan === 'trial' ? 
            new Date(Date.now() + 24 * 60 * 60 * 1000) : 
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        megaott: megaottResult
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error('❌ Registration automation failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Automated registration process failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
