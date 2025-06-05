
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

// Configure CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function for consistent logging
const log = (message: string, data?: any) => {
  console.log(`[SEND-WELCOME-EMAIL] ${message}`, data ? JSON.stringify(data) : '');
};

// Define payload type for welcome email
interface WelcomeEmailPayload {
  userId: string;
  email: string;
  name: string;
  iptv: {
    username: string;
    password: string;
    playlistUrls: {
      m3u: string;
      m3u_plus: string;
      xspf: string;
    }
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      log("❌ Missing Resend API key in Supabase secrets");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Email service not configured",
        message: "Resend API key not found. Please configure RESEND_API_KEY in Supabase secrets." 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    log("✅ Resend API key found - initializing email service");
    const resend = new Resend(resendApiKey);
    
    // Parse request body
    const payload: WelcomeEmailPayload = await req.json();
    log("📧 Processing email request", { userId: payload.userId, email: payload.email });

    if (!payload.email || !payload.iptv) {
      log("❌ Missing required fields in payload");
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Format customer name
    const customerName = payload.name || payload.email.split('@')[0];
    
    // Create professional HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SteadyStream TV</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #000000;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(255, 215, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #FFD700, #FFA500);
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #000000;
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 30px;
      color: #ffffff;
    }
    .credentials {
      background-color: #2a2a2a;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #FFD700;
    }
    .credentials h3 {
      color: #FFD700;
      margin-top: 0;
    }
    .credentials p {
      margin: 10px 0;
      font-family: 'Courier New', monospace;
      background-color: #333;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
      min-width: 200px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #000000 !important;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #0a0a0a;
      text-align: center;
      padding: 20px;
      color: #888;
      font-size: 12px;
    }
    .playlist-section {
      margin-top: 30px;
      background-color: #2a2a2a;
      border-radius: 8px;
      padding: 20px;
    }
    .playlist-section h3 {
      color: #FFD700;
      margin-bottom: 15px;
    }
    .playlist-link {
      display: block;
      margin-bottom: 10px;
      padding: 10px;
      background-color: #333;
      border-radius: 4px;
      word-break: break-all;
      font-family: monospace;
      font-size: 12px;
      color: #ccc;
    }
    .setup-steps {
      background-color: #2a2a2a;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .setup-steps h3 {
      color: #FFD700;
      margin-top: 0;
    }
    .setup-steps ol {
      padding-left: 20px;
    }
    .setup-steps li {
      margin-bottom: 8px;
      color: #ddd;
    }
    .highlight {
      background-color: #FFD700;
      color: #000;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to SteadyStream TV!</h1>
    </div>
    
    <div class="content">
      <h2>Hello ${customerName}!</h2>
      
      <p>Your premium IPTV account has been successfully created and is ready to stream. Below are your login credentials and complete setup instructions.</p>
      
      <div class="credentials">
        <h3>🔐 Your IPTV Credentials</h3>
        <p><strong>Username:</strong> <span class="highlight">${payload.iptv.username}</span></p>
        <p><strong>Password:</strong> <span class="highlight">${payload.iptv.password}</span></p>
      </div>

      <div class="setup-steps">
        <h3>⚡ Quick Setup (60 seconds)</h3>
        <ol>
          <li><strong>Download TiviMate:</strong> Use code <span class="highlight">1592817</span> at aftv.news/1592817</li>
          <li><strong>Open TiviMate:</strong> Select "Add Playlist" → "M3U Playlist"</li>
          <li><strong>Enter your credentials:</strong> Use username <span class="highlight">${payload.iptv.username}</span></li>
          <li><strong>Add playlist URL:</strong> Copy the URL from below</li>
          <li><strong>Start streaming:</strong> Enjoy thousands of channels! 🎬</li>
        </ol>
      </div>
      
      <div class="playlist-section">
        <h3>📺 Your Playlist URLs</h3>
        <p>Use these URLs to set up your IPTV service on various devices:</p>
        
        <p><strong>M3U Playlist (Recommended):</strong></p>
        <div class="playlist-link">${payload.iptv.playlistUrls.m3u}</div>
        
        <p><strong>M3U Plus Playlist:</strong></p>
        <div class="playlist-link">${payload.iptv.playlistUrls.m3u_plus}</div>
        
        <p><strong>XSPF Playlist:</strong></p>
        <div class="playlist-link">${payload.iptv.playlistUrls.xspf}</div>
      </div>
      
      <p style="text-align: center;">
        <a href="https://steadystream-tv.lovable.app/dashboard" class="button">
          📱 Open Your Dashboard
        </a>
      </p>
      
      <div style="background-color: #1a4c96; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #FFD700; margin-top: 0;">📞 Need Help?</h4>
        <p style="margin-bottom: 0; color: #fff;">
          • Setup Guide: <a href="https://steadystream-tv.lovable.app/setup-guide" style="color: #FFD700;">Complete Instructions</a><br>
          • Support Email: <a href="mailto:support@steadystream.tv" style="color: #FFD700;">support@steadystream.tv</a><br>
          • Live Chat: Available 24/7 in your dashboard
        </p>
      </div>
      
      <p style="color: #FFD700; font-weight: bold;">Happy streaming!</p>
      <p>The SteadyStream TV Team</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} SteadyStream TV. All rights reserved.</p>
      <p>If you did not sign up for this service, please contact support@steadystream.tv</p>
    </div>
  </div>
</body>
</html>
`;

    // Send the email using Resend API
    log("📤 Sending welcome email via Resend API");
    const emailResponse = await resend.emails.send({
      from: 'SteadyStream TV <welcome@steadystream.tv>',
      to: [payload.email],
      subject: '🎉 Welcome to SteadyStream TV - Your Account is Ready!',
      html: htmlContent,
    });

    if (emailResponse.error) {
      log("❌ Resend API error", emailResponse.error);
      throw new Error(`Email sending failed: ${emailResponse.error.message}`);
    }

    log("✅ Email sent successfully", { emailId: emailResponse.data?.id, to: payload.email });

    // Update the user profile to record that welcome email was sent
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (supabaseUrl && supabaseKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      
      await supabaseAdmin
        .from('profiles')
        .update({
          welcome_email_sent: true,
          welcome_email_sent_at: new Date().toISOString()
        })
        .eq('id', payload.userId);
      
      log("✅ User profile updated with email delivery status");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: "Welcome email sent successfully to " + payload.email
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    log("❌ Error sending welcome email", { error: err.message, stack: err.stack });
    
    // Return error response for debugging
    return new Response(JSON.stringify({ 
      success: false,
      error: err.message,
      message: "Email sending failed - check function logs for details"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
