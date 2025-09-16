import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  email: string
  username: string
  password: string
  plan: string
  credentials: {
    m3u_url: string
    xtream_url: string
    xtream_username: string
    xtream_password: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, username, password, plan, credentials }: EmailRequest = await req.json()

    // Get email service credentials from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@steadystream.com'

    if (!resendApiKey) {
      console.error('Resend API key not configured')
      return new Response('Email service not configured', {
        status: 500,
        headers: corsHeaders
      })
    }

    // Create email content
    const emailContent = createWelcomeEmailContent(username, password, plan, credentials)

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: '🎉 Your IPTV Account is Ready!',
        html: emailContent.html,
        text: emailContent.text
      })
    })

    const emailResult = await emailResponse.json()

    if (emailResponse.ok) {
      console.log('Welcome email sent successfully:', emailResult.id)
      return new Response(JSON.stringify({
        success: true,
        message: 'Welcome email sent successfully',
        email_id: emailResult.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      console.error('Failed to send welcome email:', emailResult)
      return new Response(JSON.stringify({
        success: false,
        error: emailResult.message || 'Failed to send email'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Email function error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function createWelcomeEmailContent(
  username: string,
  password: string,
  plan: string,
  credentials: any
): { html: string; text: string } {
  const planDisplayName = formatPlanName(plan)

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SteadyStream IPTV</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .credentials-box { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .credentials-title { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 15px; display: flex; align-items: center; }
        .credential-item { margin: 10px 0; }
        .credential-label { font-weight: 600; color: #666; margin-bottom: 5px; }
        .credential-value { background: white; border: 1px solid #ddd; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
        .setup-section { margin: 30px 0; }
        .setup-title { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 15px; }
        .setup-steps { list-style: none; padding: 0; }
        .setup-steps li { margin: 10px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea; }
        .app-links { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
        .app-link { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .support-section { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 30px 0; }
        .footer { background: #333; color: white; padding: 30px; text-align: center; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; }
        @media (max-width: 600px) {
            .container { margin: 0; }
            .header, .content { padding: 20px; }
            .app-links { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to SteadyStream IPTV!</h1>
            <p>Your ${planDisplayName} subscription is now active</p>
        </div>

        <div class="content">
            <p>Congratulations! Your IPTV account has been successfully created and is ready to use.</p>

            <div class="credentials-box">
                <div class="credentials-title">
                    📺 Your IPTV Credentials
                </div>

                <div class="credential-item">
                    <div class="credential-label">Username:</div>
                    <div class="credential-value">${username}</div>
                </div>

                <div class="credential-item">
                    <div class="credential-label">Password:</div>
                    <div class="credential-value">${password}</div>
                </div>

                <div class="credential-item">
                    <div class="credential-label">M3U Playlist URL:</div>
                    <div class="credential-value">${credentials.m3u_url}</div>
                </div>

                <div class="credential-item">
                    <div class="credential-label">Xtream Codes Server:</div>
                    <div class="credential-value">${credentials.xtream_url}</div>
                </div>
            </div>

            <div class="warning">
                <strong>⚠️ Important:</strong> Please save these credentials safely. You'll need them to access your IPTV service.
            </div>

            <div class="setup-section">
                <div class="setup-title">🚀 Quick Setup Guide</div>
                <ol class="setup-steps">
                    <li><strong>Download an IPTV app</strong> - We recommend IPTV Smarters, Perfect Player, or TiviMate</li>
                    <li><strong>Choose connection method:</strong>
                        <ul style="margin-top: 10px;">
                            <li><strong>M3U URL:</strong> Copy the M3U URL above into your app</li>
                            <li><strong>Xtream Codes:</strong> Use the server URL, username, and password above</li>
                        </ul>
                    </li>
                    <li><strong>Add your credentials</strong> and enjoy thousands of channels!</li>
                </ol>
            </div>

            <div class="setup-section">
                <div class="setup-title">📱 Recommended Apps</div>
                <div class="app-links">
                    <a href="https://play.google.com/store/apps/details?id=com.nst.iptvsmartersp" class="app-link">IPTV Smarters (Android)</a>
                    <a href="https://apps.apple.com/app/iptv-smarters-pro/id1628995509" class="app-link">IPTV Smarters (iOS)</a>
                    <a href="https://play.google.com/store/apps/details?id=ru.iptvremote.android.iptv" class="app-link">IPTV (Android)</a>
                </div>
            </div>

            <div class="support-section">
                <h3 style="margin-top: 0;">🛟 Need Help?</h3>
                <p>Our support team is here to help you get started:</p>
                <ul>
                    <li>📧 Email: support@steadystream.com</li>
                    <li>💬 Live Chat: Available 24/7 on our website</li>
                    <li>📚 Setup Guides: Visit our help center</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666;">Enjoy your premium IPTV experience!</p>
                <p style="color: #666; font-size: 14px;">
                    Subscription Plan: ${planDisplayName}<br>
                    Payment Method: Cryptocurrency<br>
                    Activation Date: ${new Date().toLocaleDateString()}
                </p>
            </div>
        </div>

        <div class="footer">
            <p>&copy; 2024 SteadyStream IPTV. All rights reserved.</p>
            <p style="font-size: 14px; opacity: 0.8;">
                This email contains sensitive account information. Please keep it secure.
            </p>
        </div>
    </div>
</body>
</html>
  `

  const text = `
🎉 Welcome to SteadyStream IPTV!

Your ${planDisplayName} subscription is now active.

📺 YOUR IPTV CREDENTIALS:
Username: ${username}
Password: ${password}

🔗 CONNECTION DETAILS:
M3U URL: ${credentials.m3u_url}
Xtream Server: ${credentials.xtream_url}

🚀 QUICK SETUP:
1. Download an IPTV app (IPTV Smarters, Perfect Player, TiviMate)
2. Add your credentials using either M3U URL or Xtream Codes method
3. Enjoy thousands of channels!

⚠️ IMPORTANT: Save these credentials safely!

🛟 NEED HELP?
Email: support@steadystream.com
Live Chat: Available 24/7

Subscription: ${planDisplayName}
Payment: Cryptocurrency
Activated: ${new Date().toLocaleDateString()}

© 2024 SteadyStream IPTV
  `

  return { html, text }
}

function formatPlanName(plan: string): string {
  const planNames: { [key: string]: string } = {
    'basic_monthly': 'Basic Monthly',
    'premium_monthly': 'Premium Monthly',
    'premium_yearly': 'Premium Yearly'
  }

  return planNames[plan] || 'IPTV Subscription'
}