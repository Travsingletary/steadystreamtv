
// =====================================
// AUTOMATED REGISTRATION SERVICE
// =====================================
import { supabase } from '@/integrations/supabase/client';
import { MegaOTTService } from './megaOTTService';
import type { UnifiedUserData, IPTVCredentials, RegistrationResult } from '@/types/automation';

export class AutomatedRegistrationService {
  private megaOTT = new MegaOTTService();

  async registerUser(userData: UnifiedUserData): Promise<RegistrationResult> {
    try {
      // Step 1: Create Supabase Auth user
      const authResult = await this.createAuthUser(userData);
      if (!authResult.success) {
        throw new Error(authResult.error);
      }

      // Step 2: Create IPTV account
      const credentials = await this.megaOTT.createIPTVAccount(userData);

      // Step 3: Optimize playlist
      const optimizedPlaylistUrl = await this.megaOTT.optimizePlaylist(credentials);

      // Step 4: Store user profile and credentials
      await this.storeUserProfile(authResult.user.id, userData, credentials);

      // Step 5: Send welcome email
      await this.sendWelcomeEmail(userData, credentials, optimizedPlaylistUrl);

      return {
        success: true,
        user: authResult.user,
        credentials: {
          ...credentials,
          playlistUrl: optimizedPlaylistUrl
        }
      };

    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  private async createAuthUser(userData: UnifiedUserData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
            plan: userData.plan
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('User creation failed');
      }

      return { success: true, user: data.user };

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Auth failed' };
    }
  }

  private async storeUserProfile(userId: string, userData: UnifiedUserData, credentials: IPTVCredentials) {
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        name: userData.name,
        email: userData.email,
        subscription_tier: userData.plan,
        subscription_status: 'active',
        trial_end_date: userData.plan === 'trial' 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Store IPTV credentials
      await supabase.from('iptv_accounts').insert({
        user_id: userId,
        username: credentials.username,
        password: credentials.password,
        server_url: credentials.serverUrl,
        activation_code: credentials.activationCode,
        playlist_url: credentials.playlistUrl,
        plan_type: userData.plan,
        status: 'active',
        expires_at: credentials.expiresAt
      });
    } catch (error) {
      console.warn('Profile storage failed:', error);
    }
  }

  private async sendWelcomeEmail(userData: UnifiedUserData, credentials: IPTVCredentials, playlistUrl: string) {
    try {
      const emailTemplate = this.generateEmailTemplate(userData, credentials, playlistUrl);
      
      // Use Supabase Edge Function for email sending
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          to: userData.email,
          subject: '🎉 Welcome to SteadyStream TV - Your IPTV Account is Ready!',
          html: emailTemplate
        }
      });
    } catch (error) {
      console.warn('Email sending failed:', error);
    }
  }

  private generateEmailTemplate(userData: UnifiedUserData, credentials: IPTVCredentials, playlistUrl: string): string {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(playlistUrl)}`;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SteadyStream TV</title>
        <style>
            body { font-family: Arial, sans-serif; background: #1a1a1a; color: #ffffff; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #2a2a2a; border-radius: 10px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .credentials-box { background: #374151; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .setup-section { background: #1f2937; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #f59e0b; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .qr-code { text-align: center; margin: 20px 0; }
            .device-setup { margin: 15px 0; padding: 15px; background: #374151; border-radius: 6px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to SteadyStream TV!</h1>
                <p>Hi ${userData.name}, your IPTV account is ready!</p>
            </div>
            
            <div class="content">
                <div class="credentials-box">
                    <h2>🔐 Your IPTV Credentials</h2>
                    <p><strong>Username:</strong> <code>${credentials.username}</code></p>
                    <p><strong>Password:</strong> <code>${credentials.password}</code></p>
                    <p><strong>Server URL:</strong> <code>${credentials.serverUrl}</code></p>
                    ${credentials.activationCode ? `<p><strong>Activation Code:</strong> <code>${credentials.activationCode}</code></p>` : ''}
                </div>

                <div class="qr-code">
                    <h3>📱 Quick Setup - Scan This QR Code</h3>
                    <img src="${qrCodeUrl}" alt="Playlist QR Code" style="border: 4px solid #f59e0b; border-radius: 8px;">
                </div>

                <div class="setup-section">
                    <h2>⚡ Device Setup Instructions</h2>
                    
                    <div class="device-setup">
                        <h3>📺 Firestick & Android TV</h3>
                        <ol>
                            <li>Download the <strong>Downloader App</strong> from Amazon App Store</li>
                            <li>In Downloader, go to: <strong>aftv.news/1592817</strong> or enter code: <strong>1592817</strong></li>
                            <li>Install the SteadyStream TV app</li>
                            <li>Login using <strong>Xtream Codes</strong> with your credentials above</li>
                            <li>✅ <strong>Do not use the activation code here</strong> — only works on web</li>
                        </ol>
                    </div>

                    <div class="device-setup">
                        <h3>📱 iPhone & iPad (iOS)</h3>
                        <ol>
                            <li>Download <strong>Smarters Player Lite</strong> from the App Store</li>
                            <li>Open the app and choose: <strong>Login with Xtream Codes API</strong></li>
                            <li>Enter your Username, Password, and Server URL from above</li>
                        </ol>
                    </div>

                    <div class="device-setup">
                        <h3>🖥️ Computer & Web</h3>
                        <ol>
                            <li>Go to our website: <strong>steadystreamtv.com</strong></li>
                            <li>Use the Web Player</li>
                            <li>Enter your activation code: <strong>${credentials.activationCode}</strong></li>
                            <li>This is the only place where your activation code works</li>
                        </ol>
                    </div>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://steadystreamtv.com/support" class="button">📞 Get Support</a>
                    <a href="${playlistUrl}" class="button" style="margin-left: 10px;">📺 Direct Playlist Link</a>
                </div>

                <div style="background: #059669; padding: 20px; border-radius: 8px; text-align: center;">
                    <h3>✈️ Stream from anywhere. No contracts. No stress. Just amazing content.</h3>
                    <p>Questions? We got your back at <strong>support@steadystreamtv.com</strong></p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}
