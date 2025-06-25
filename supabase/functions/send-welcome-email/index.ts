
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
    
    // Get request data
    const {
      userId,
      email,
      name,
      playlistUrl,
      username,
      password,
      serverUrl,
      downloadCode,
      planType = 'standard'
    } = await req.json();

    // Generate QR codes
    const playlistQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(playlistUrl)}`;
    const setupInstructionsQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`Server: ${serverUrl}\nUsername: ${username}\nPassword: ${password}`)}`;

    // Determine device limit based on plan
    const deviceLimits = {
      trial: 1,
      solo: 1,
      duo: 2,
      family: 3,
      standard: 2,
      premium: 3,
      ultimate: 5
    };
    const deviceLimit = deviceLimits[planType] || 1;

    // Create email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SteadyStream TV</title>
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
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #000;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #000;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 10px 0;
    }
    .credentials {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .credential-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .credential-item:last-child {
      border-bottom: none;
    }
    .credential-label {
      font-weight: bold;
      color: #666;
    }
    .credential-value {
      font-family: monospace;
      color: #059669;
      word-break: break-all;
    }
    .qr-section {
      text-align: center;
      margin: 30px 0;
    }
    .qr-code {
      margin: 10px 0;
    }
    .step {
      display: flex;
      align-items: flex-start;
      margin: 15px 0;
    }
    .step-number {
      background: #fbbf24;
      color: #000;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 15px;
      flex-shrink: 0;
    }
    .warning {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
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
      <h1>🎉 Welcome to SteadyStream TV!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Your Premium IPTV Experience Awaits</p>
    </div>
    
    <div class="content">
      <p>Hi ${name},</p>
      
      <p>Congratulations! Your SteadyStream TV account is now active and ready to use. We've optimized your playlist based on your preferences, so you can start enjoying thousands of channels right away!</p>
      
      <div class="credentials">
        <h3 style="margin-top: 0;">📺 Your Login Credentials</h3>
        <div class="credential-item">
          <span class="credential-label">Server URL:</span>
          <span class="credential-value">${serverUrl}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Username:</span>
          <span class="credential-value">${username}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Password:</span>
          <span class="credential-value">${password}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Playlist URL:</span>
          <span class="credential-value" style="font-size: 12px;">${playlistUrl}</span>
        </div>
      </div>

      <h3>⚡ Quick Setup Guide</h3>
      
      <div class="step">
        <div class="step-number">1</div>
        <div>
          <strong>Download TiviMate</strong><br>
          ${downloadCode ? `Use code <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${downloadCode}</code> at aftv.news/${downloadCode}` : 'Download from your device\'s app store'}
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">2</div>
        <div>
          <strong>Open TiviMate</strong><br>
          Select "Add Playlist" from the main menu
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">3</div>
        <div>
          <strong>Choose Setup Method</strong><br>
          • <strong>Xtream Codes:</strong> Enter server URL, username, and password<br>
          • <strong>M3U Playlist:</strong> Paste the playlist URL
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">4</div>
        <div>
          <strong>Start Streaming!</strong><br>
          Your channels will load automatically with your personalized order
        </div>
      </div>

      <div class="qr-section">
        <h3>📱 Quick Mobile Setup</h3>
        <p>Scan this QR code with your phone to copy your playlist URL:</p>
        <img src="${playlistQR}" alt="Playlist QR Code" class="qr-code" width="200" height="200">
      </div>

      <div class="warning">
        <strong>⚠️ Important:</strong> Keep your login credentials safe. Do not share them with anyone. Each account is limited to ${deviceLimit} device${deviceLimit > 1 ? 's' : ''} based on your ${planType} plan.
      </div>

      <h3>✨ What's Included</h3>
      <ul>
        <li>Access to thousands of live TV channels</li>
        <li>Premium sports, movies, and entertainment</li>
        <li>Channels optimized based on your preferences</li>
        <li>HD and 4K streaming support</li>
        <li>24/7 customer support</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://steadystreamtv.com/dashboard" class="button">Access Your Dashboard</a>
      </div>

      <h3>🎯 Pro Tips</h3>
      <ul>
        <li><strong>Best Performance:</strong> Use a wired ethernet connection when possible</li>
        <li><strong>Picture Quality:</strong> Set your preferred quality in TiviMate settings</li>
        <li><strong>EPG Guide:</strong> The TV guide updates automatically every 6 hours</li>
        <li><strong>Favorites:</strong> Long-press on channels to add them to favorites</li>
      </ul>
    </div>
    
    <div class="footer">
      <p><strong>Need Help?</strong><br>
      Email us at support@steadystreamtv.com or visit our help center</p>
      <p style="margin-top: 20px; font-size: 12px;">
        © 2024 SteadyStream TV. All rights reserved.<br>
        This email was sent to ${email}
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'SteadyStream TV <welcome@steadystreamtv.com>',
        to: [email],
        subject: '🎉 Welcome to SteadyStream TV - Your Account is Ready!',
        html: emailHtml,
        text: `Welcome to SteadyStream TV!

Hi ${name},

Your account is now active! Here are your login details:

Server URL: ${serverUrl}
Username: ${username}
Password: ${password}
Playlist URL: ${playlistUrl}

Quick Setup:
1. Download TiviMate${downloadCode ? ` using code ${downloadCode} at aftv.news/${downloadCode}` : ' from your device app store'}
2. Open TiviMate and select "Add Playlist"
3. Choose either Xtream Codes or M3U Playlist option
4. Enter your credentials and start streaming!

Your account is limited to ${deviceLimit} device${deviceLimit > 1 ? 's' : ''} based on your ${planType} plan.

Need help? Email us at support@steadystreamtv.com

Best regards,
The SteadyStream TV Team`
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to send email: ${response.status} - ${errorData}`);
    }

    // Log email sent
    await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        email_type: 'welcome',
        recipient: email,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });

    console.log("Welcome email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email sent successfully' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Email send error:', error);
    
    // Try to log the error if we have user info
    try {
      const { userId, email } = await req.json();
      if (userId && email) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from('email_logs')
          .insert({
            user_id: userId,
            email_type: 'welcome',
            recipient: email,
            sent_at: new Date().toISOString(),
            status: 'failed',
            error_message: error.message
          });
      }
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }

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
