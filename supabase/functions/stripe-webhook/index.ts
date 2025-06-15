
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    console.log("Processing Stripe event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing completed checkout session:", session.id);
      
      // Get customer email and plan info
      const customerEmail = session.customer_details?.email;
      const planType = session.metadata?.plan || "premium";
      
      if (!customerEmail) {
        console.error("No customer email found in session");
        return new Response("No customer email", { status: 400 });
      }

      // Find or create user
      let user;
      try {
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(customerEmail);
        user = existingUser.user;
        
        if (!user) {
          // Create user if doesn't exist
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: customerEmail,
            email_confirm: true,
            user_metadata: {
              plan: planType,
              stripe_session_id: session.id
            }
          });
          
          if (createError) throw createError;
          user = newUser.user;
        }
      } catch (error) {
        console.error("Error handling user:", error);
        return new Response("User handling failed", { status: 500 });
      }

      // Track automation status
      await supabase.from("purchase_automations").insert({
        user_id: user!.id,
        stripe_session_id: session.id,
        payment_intent_id: session.payment_intent,
        automation_status: "processing"
      });

      try {
        // Create MegaOTT account
        const megaottResponse = await createMegaOTTAccount(customerEmail, planType);
        
        // Generate credentials
        const credentials = {
          username: megaottResponse.username || `sstv_${Date.now()}`,
          password: megaottResponse.password || generatePassword(),
          activationCode: generateActivationCode(),
          playlistUrl: `https://steadystreamtv.com/api/playlist/${user!.id}`,
          serverUrl: megaottResponse.server_url || "https://steadystreamtv.com"
        };

        // Store IPTV account in database
        await supabase.from("iptv_accounts").insert({
          user_id: user!.id,
          stripe_session_id: session.id,
          megaott_user_id: megaottResponse.user_id,
          username: credentials.username,
          password: credentials.password,
          activation_code: credentials.activationCode,
          playlist_url: credentials.playlistUrl,
          server_url: credentials.serverUrl,
          plan_type: planType,
          status: "active",
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

        // Send welcome email with credentials
        await sendWelcomeEmail(customerEmail, credentials, planType);

        // Update automation status
        await supabase.from("purchase_automations")
          .update({
            automation_status: "completed",
            megaott_response: megaottResponse,
            email_sent: true
          })
          .eq("stripe_session_id", session.id);

        console.log("Automation completed successfully for session:", session.id);

      } catch (error) {
        console.error("Automation failed:", error);
        
        // Update with error status
        await supabase.from("purchase_automations")
          .update({
            automation_status: "failed",
            error_message: error.message
          })
          .eq("stripe_session_id", session.id);

        // Still create fallback credentials so user gets something
        const fallbackCredentials = {
          username: `demo_${Date.now()}`,
          password: generatePassword(),
          activationCode: generateActivationCode(),
          playlistUrl: `https://steadystreamtv.com/api/playlist/${user!.id}`,
          serverUrl: "https://steadystreamtv.com"
        };

        await supabase.from("iptv_accounts").insert({
          user_id: user!.id,
          stripe_session_id: session.id,
          username: fallbackCredentials.username,
          password: fallbackCredentials.password,
          activation_code: fallbackCredentials.activationCode,
          playlist_url: fallbackCredentials.playlistUrl,
          server_url: fallbackCredentials.serverUrl,
          plan_type: planType,
          status: "demo",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days for demo
        });

        await sendWelcomeEmail(customerEmail, fallbackCredentials, planType, true);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function createMegaOTTAccount(email: string, plan: string) {
  const apiKey = Deno.env.get("MEGAOTT_API_KEY");
  const apiUrl = "https://api.megaott.com/api/v1/users"; // Replace with actual MegaOTT API endpoint
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email: email,
        plan: plan,
        duration: 30, // 30 days
        max_connections: plan === "family" ? 3 : plan === "duo" ? 2 : 1
      })
    });

    if (!response.ok) {
      throw new Error(`MegaOTT API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("MegaOTT account created:", data);
    
    return {
      user_id: data.user_id,
      username: data.username,
      password: data.password,
      server_url: data.server_url
    };
  } catch (error) {
    console.error("MegaOTT API failed:", error);
    throw error;
  }
}

async function sendWelcomeEmail(email: string, credentials: any, plan: string, isDemo = false) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(credentials.playlistUrl)}`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to SteadyStream TV</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .credentials { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .credential-item { margin: 10px 0; }
        .credential-label { font-weight: bold; color: #374151; }
        .credential-value { font-family: monospace; background: white; padding: 8px; border-radius: 4px; border: 1px solid #d1d5db; }
        .qr-section { text-align: center; margin: 30px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; border-radius: 0 0 10px 10px; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        ${isDemo ? '.demo-notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; color: #92400e; }' : ''}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to SteadyStream TV!</h1>
          <p>Your ${plan.toUpperCase()} plan is now active${isDemo ? ' (Demo Mode)' : ''}</p>
        </div>
        
        <div class="content">
          ${isDemo ? `
            <div class="demo-notice">
              <strong>⚠️ Demo Account Notice:</strong> Your account is in demo mode due to a technical issue during setup. 
              Please contact support to activate your full plan features.
            </div>
          ` : ''}
          
          <h2>🔑 Your IPTV Credentials</h2>
          <div class="credentials">
            <div class="credential-item">
              <div class="credential-label">Username:</div>
              <div class="credential-value">${credentials.username}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Password:</div>
              <div class="credential-value">${credentials.password}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Activation Code:</div>
              <div class="credential-value">${credentials.activationCode}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Server URL:</div>
              <div class="credential-value">${credentials.serverUrl}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Playlist URL:</div>
              <div class="credential-value">${credentials.playlistUrl}</div>
            </div>
          </div>

          <div class="qr-section">
            <h3>📱 Quick Setup QR Code</h3>
            <p>Scan this QR code with your IPTV app to automatically configure your playlist:</p>
            <img src="${qrCodeUrl}" alt="Playlist QR Code" style="border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
          </div>

          <h3>📺 Setup Instructions</h3>
          <ol>
            <li><strong>Download an IPTV app</strong> (TiviMate, IPTV Smarters, VLC, etc.)</li>
            <li><strong>Add M3U Playlist:</strong> Use the playlist URL above</li>
            <li><strong>Or enter credentials manually:</strong> Use the username/password provided</li>
            <li><strong>Start streaming!</strong> Enjoy thousands of channels</li>
          </ol>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://steadystreamtv.com/dashboard" class="btn">View Your Dashboard</a>
          </div>
        </div>

        <div class="footer">
          <p><strong>SteadyStream TV</strong> - Premium IPTV Streaming</p>
          <p>Need help? Contact support at support@steadystreamtv.com</p>
          <p>Your plan expires: ${new Date(Date.now() + (isDemo ? 7 : 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: "SteadyStream TV <welcome@steadystreamtv.com>",
      to: [email],
      subject: `🎉 Welcome to SteadyStream TV - Your ${plan.toUpperCase()} Plan is Ready!`,
      html: emailHtml,
    });

    if (error) {
      console.error("Email sending failed:", error);
      throw error;
    }

    console.log("Welcome email sent successfully to:", email);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw error;
  }
}

function generatePassword() {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
}

function generateActivationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
