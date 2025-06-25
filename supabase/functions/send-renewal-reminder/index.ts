
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
      daysRemaining,
      expirationDate,
      planType
    } = await req.json();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Renewal Reminder</title>
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
      background: linear-gradient(135deg, #f59e0b, #d97706);
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
      margin: 20px 0;
    }
    .warning-box {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
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
      <h1>⏰ Subscription Renewal Reminder</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Don't lose access to your favorite channels!</p>
    </div>
    
    <div class="content">
      <p>Hi ${name},</p>
      
      <div class="warning-box">
        <h2 style="margin-top: 0; color: #d97706;">Your ${planType} subscription expires in ${daysRemaining} days</h2>
        <p style="font-size: 18px; margin: 10px 0;">Expiration Date: <strong>${new Date(expirationDate).toLocaleDateString()}</strong></p>
      </div>
      
      <p>Your SteadyStream TV subscription is about to expire. To continue enjoying uninterrupted access to thousands of channels, please renew your subscription before the expiration date.</p>
      
      <h3>🎯 Why Renew Now?</h3>
      <ul>
        <li><strong>Uninterrupted Streaming:</strong> Keep watching without any service interruption</li>
        <li><strong>Same Great Price:</strong> Lock in your current rate</li>
        <li><strong>All Your Favorites:</strong> Keep your personalized channel lineup</li>
        <li><strong>Premium Support:</strong> Continue receiving 24/7 customer support</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://steadystreamtv.com/renew?user=${userId}" class="button">Renew My Subscription</a>
      </div>

      <h3>📺 What You'll Keep</h3>
      <ul>
        <li>Access to all premium channels and content</li>
        <li>HD and 4K streaming quality</li>
        <li>Your personalized channel preferences</li>
        <li>Multi-device support (up to your plan limit)</li>
        <li>Regular playlist updates and improvements</li>
      </ul>

      <p><strong>Questions?</strong> Contact our support team at support@steadystreamtv.com - we're here to help!</p>
    </div>
    
    <div class="footer">
      <p>This renewal reminder was sent to ${email}</p>
      <p style="margin-top: 15px;">© 2024 SteadyStream TV. All rights reserved.</p>
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
        from: 'SteadyStream TV <billing@steadystreamtv.com>',
        to: [email],
        subject: `⏰ Your SteadyStream TV subscription expires in ${daysRemaining} days`,
        html: emailHtml,
        text: `Hi ${name},

Your SteadyStream TV ${planType} subscription expires in ${daysRemaining} days on ${new Date(expirationDate).toLocaleDateString()}.

Renew now to continue enjoying:
- Uninterrupted streaming access
- All premium channels and content
- HD and 4K streaming quality
- Your personalized channel preferences

Renew at: https://steadystreamtv.com/renew?user=${userId}

Questions? Contact support@steadystreamtv.com

Best regards,
SteadyStream TV Team`
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to send renewal reminder: ${response.status} - ${errorData}`);
    }

    // Log email sent
    await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        email_type: 'renewal_reminder',
        recipient: email,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });

    console.log("Renewal reminder sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: 'Renewal reminder sent successfully' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Renewal reminder error:', error);
    
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
