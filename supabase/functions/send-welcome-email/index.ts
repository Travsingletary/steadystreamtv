
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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error("Missing Resend API key");
    }

    const resend = new Resend(resendApiKey);
    
    // Parse request body
    const payload: WelcomeEmailPayload = await req.json();
    log("Received email request:", { userId: payload.userId, email: payload.email });

    if (!payload.email || !payload.iptv) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Format customer name
    const customerName = payload.name || payload.email.split('@')[0];
    
    // Create HTML email template with IPTV credentials
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SteadyStream TV</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      background-color: #000000;
      padding: 20px;
      text-align: center;
    }
    .header img {
      max-width: 200px;
    }
    .content {
      padding: 20px;
    }
    .credentials {
      background-color: #f5f5f5;
      border-radius: 5px;
      padding: 15px;
      margin: 20px 0;
    }
    .credentials p {
      margin: 10px 0;
      font-family: monospace;
    }
    .button {
      display: inline-block;
      background-color: #FFD700;
      color: #000000 !important;
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #999;
    }
    .playlist-section {
      margin-top: 30px;
    }
    .playlist-section h3 {
      margin-bottom: 10px;
    }
    .playlist-link {
      display: block;
      margin-bottom: 10px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://ojueihcytxwcioqtvwez.supabase.co/storage/v1/object/public/images/logo.png" alt="SteadyStream TV Logo">
    </div>
    
    <div class="content">
      <h2>Welcome to SteadyStream TV, ${customerName}!</h2>
      
      <p>Your IPTV account has been successfully created. Below are your login credentials and setup instructions.</p>
      
      <div class="credentials">
        <h3>Your IPTV Credentials</h3>
        <p><strong>Username:</strong> ${payload.iptv.username}</p>
        <p><strong>Password:</strong> ${payload.iptv.password}</p>
      </div>
      
      <div class="playlist-section">
        <h3>Your Playlist URLs</h3>
        <p>Use these URLs to set up your IPTV service on various devices:</p>
        
        <p><strong>M3U Playlist:</strong><br>
        <a href="${payload.iptv.playlistUrls.m3u}" class="playlist-link">${payload.iptv.playlistUrls.m3u}</a></p>
        
        <p><strong>M3U Plus Playlist:</strong><br>
        <a href="${payload.iptv.playlistUrls.m3u_plus}" class="playlist-link">${payload.iptv.playlistUrls.m3u_plus}</a></p>
        
        <p><strong>XSPF Playlist:</strong><br>
        <a href="${payload.iptv.playlistUrls.xspf}" class="playlist-link">${payload.iptv.playlistUrls.xspf}</a></p>
      </div>
      
      <p>You can now sign in to your SteadyStream TV dashboard to start streaming:</p>
      
      <a href="https://steadystream-tv.lovable.app/dashboard" class="button">Go to Dashboard</a>
      
      <p>Need help setting up? Check out our <a href="https://steadystream-tv.lovable.app/setup-guide">Setup Guide</a> for step-by-step instructions.</p>
      
      <p>Happy streaming!</p>
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

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: 'SteadyStream TV <noreply@steadystream.tv>',
      to: [payload.email],
      subject: 'Welcome to SteadyStream TV - Your Account Details',
      html: htmlContent,
    });

    log("Email sent:", { emailId: emailResponse.id });

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
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: any) {
    log("Error sending welcome email:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
