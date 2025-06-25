
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const {
      userId,
      email,
      name,
      deviceLimit,
      currentDevices,
      planType,
      attemptedDevice
    } = await req.json();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Device Limit Reached</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #fff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: #fff;
      padding: 30px;
      text-align: center;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      padding: 15px 30px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #000;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 10px;
    }
    .warning-box {
      background: #fef2f2;
      border: 2px solid #dc2626;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .device-list {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚫 Device Limit Reached</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Too many devices connected</p>
    </div>
    
    <div class="content">
      <p>Hi ${name},</p>
      
      <div class="warning-box">
        <h2 style="margin-top: 0; color: #dc2626;">Maximum devices reached (${currentDevices}/${deviceLimit})</h2>
        <p style="font-size: 16px;">Your ${planType} plan allows up to ${deviceLimit} device${deviceLimit > 1 ? 's' : ''}</p>
      </div>
      
      <p>We detected an attempt to connect a new device${attemptedDevice ? ` (${attemptedDevice})` : ''} to your SteadyStream TV account, but you've already reached your device limit.</p>
      
      <h3>🔧 What can you do?</h3>
      
      <h4>Option 1: Manage Your Devices</h4>
      <p>Visit your dashboard to see all connected devices and remove any you no longer use:</p>
      <div style="text-align: center;">
        <a href="https://steadystreamtv.com/dashboard/devices?user=${userId}" class="button">Manage Devices</a>
      </div>
      
      <h4>Option 2: Upgrade Your Plan</h4>
      <p>Get more device slots with a higher plan:</p>
      <ul>
        <li><strong>Duo Plan:</strong> Up to 2 devices</li>
        <li><strong>Family Plan:</strong> Up to 3 devices</li>
        <li><strong>Premium Plan:</strong> Up to 3 devices</li>
        <li><strong>Ultimate Plan:</strong> Up to 5 devices</li>
      </ul>
      <div style="text-align: center;">
        <a href="https://steadystreamtv.com/upgrade?user=${userId}" class="button">Upgrade Plan</a>
      </div>

      <h3>📱 Currently Connected Devices</h3>
      <div class="device-list">
        <p><strong>Your ${planType} plan:</strong> ${currentDevices}/${deviceLimit} devices used</p>
        <p><em>Log into your dashboard to see detailed device information and manage connections.</em></p>
      </div>

      <h3>🛡️ Security Note</h3>
      <p>If you don't recognize the device attempting to connect, please change your password immediately and contact support.</p>
    </div>
    
    <div class="footer">
      <p><strong>Need Help?</strong><br>
      Contact support at support@steadystreamtv.com</p>
      <p style="margin-top: 15px;">This notification was sent to ${email}</p>
      <p>© 2024 SteadyStream TV. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'SteadyStream TV <security@steadystreamtv.com>',
        to: [email],
        subject: '🚫 Device limit reached on your SteadyStream TV account',
        html: emailHtml,
        text: `Hi ${name},

Your SteadyStream TV account has reached its device limit (${currentDevices}/${deviceLimit} devices).

${attemptedDevice ? `A new device (${attemptedDevice}) tried to connect but was blocked.` : 'A new device tried to connect but was blocked.'}

Options:
1. Manage devices: https://steadystreamtv.com/dashboard/devices?user=${userId}
2. Upgrade plan: https://steadystreamtv.com/upgrade?user=${userId}

Your ${planType} plan allows ${deviceLimit} device${deviceLimit > 1 ? 's' : ''}. Consider upgrading for more device slots.

If you don't recognize this connection attempt, please change your password immediately.

Need help? Contact support@steadystreamtv.com

Best regards,
SteadyStream TV Security Team`
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to send device limit warning: ${response.status} - ${errorData}`);
    }

    // Log email sent
    await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        email_type: 'device_limit_warning',
        recipient: email,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });

    console.log("Device limit warning sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: 'Device limit warning sent successfully' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Device limit warning error:', error);
    
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
