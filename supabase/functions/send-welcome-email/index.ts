
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { to, subject, name, credentials, planType } = await req.json();

    const htmlContent = generateWelcomeEmailHTML(name, credentials, planType);

    const emailResponse = await resend.emails.send({
      from: "SteadyStream TV <welcome@steadystreamtv.com>",
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateWelcomeEmailHTML(name: string, credentials: any, planType: string) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(credentials.playlist_url)}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SteadyStream TV</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 30px; }
    .plan-badge { background: #f59e0b; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
    .credentials { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .credential-item { margin: 10px 0; }
    .credential-label { font-weight: bold; color: #374151; }
    .credential-value { background: #1f2937; color: #f9fafb; padding: 8px 12px; border-radius: 4px; font-family: monospace; margin-top: 4px; word-break: break-all; }
    .qr-section { text-align: center; margin: 30px 0; }
    .setup-steps { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
    .step { margin: 10px 0; padding-left: 20px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; }
    .button { background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to SteadyStream TV!</h1>
      <p>Your IPTV service is now active</p>
      <div class="plan-badge">${planType.toUpperCase()} PLAN</div>
    </div>
    
    <div class="content">
      <h2>Hello ${name}!</h2>
      <p>Congratulations! Your SteadyStream TV subscription is now active. Below are your IPTV credentials and setup instructions.</p>
      
      <div class="credentials">
        <h3>🔐 Your IPTV Credentials</h3>
        
        <div class="credential-item">
          <div class="credential-label">Username:</div>
          <div class="credential-value">${credentials.username}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Password:</div>
          <div class="credential-value">${credentials.password}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Server URL:</div>
          <div class="credential-value">${credentials.server_url}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Playlist URL (M3U):</div>
          <div class="credential-value">${credentials.playlist_url}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Activation Code:</div>
          <div class="credential-value">${credentials.activationCode}</div>
        </div>
        
        <div class="credential-item">
          <div class="credential-label">Max Connections:</div>
          <div class="credential-value">${credentials.maxConnections}</div>
        </div>
      </div>
      
      <div class="qr-section">
        <h3>📱 Quick Setup QR Code</h3>
        <p>Scan this QR code with your IPTV app to automatically configure your playlist:</p>
        <img src="${qrCodeUrl}" alt="Playlist QR Code" style="border: 2px solid #e2e8f0; border-radius: 8px;">
      </div>
      
      <div class="setup-steps">
        <h3>🚀 Quick Setup Guide</h3>
        
        <div class="step">
          <strong>1. Download an IPTV App:</strong>
          <ul>
            <li><strong>Android/Fire TV:</strong> TiviMate, IPTV Smarters Pro</li>
            <li><strong>iOS/Apple TV:</strong> GSE Smart IPTV, IPTV Smarters Pro</li>
            <li><strong>Windows/Mac:</strong> VLC Media Player, Kodi</li>
          </ul>
        </div>
        
        <div class="step">
          <strong>2. Add Playlist:</strong>
          <ul>
            <li>Open your IPTV app</li>
            <li>Select "Add Playlist" or "Xtream Codes API"</li>
            <li>Enter your credentials above</li>
            <li>Or scan the QR code for instant setup</li>
          </ul>
        </div>
        
        <div class="step">
          <strong>3. Start Watching:</strong>
          <ul>
            <li>Your channels will load automatically</li>
            <li>Enjoy 5000+ channels in HD/4K quality</li>
            <li>Access premium sports, movies, and international content</li>
          </ul>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://steadystreamtv.com/setup-guide" class="button">📖 Detailed Setup Guide</a>
        <a href="https://steadystreamtv.com/support" class="button">💬 Get Support</a>
      </div>
      
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <strong>⚠️ Important:</strong> Save these credentials securely. You'll need them to access your IPTV service. Your subscription expires on ${new Date(credentials.expiration).toLocaleDateString()}.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>SteadyStream TV</strong> - Premium IPTV Service</p>
      <p>Need help? Contact us at <a href="mailto:support@steadystreamtv.com" style="color: #60a5fa;">support@steadystreamtv.com</a></p>
      <p>Visit our website: <a href="https://steadystreamtv.com" style="color: #60a5fa;">steadystreamtv.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
}
