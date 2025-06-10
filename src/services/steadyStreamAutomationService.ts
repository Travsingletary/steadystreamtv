
import { supabase } from "@/integrations/supabase/client";

export interface SteadyStreamUserData {
  name: string;
  email: string;
  password: string;
  plan: 'trial' | 'standard' | 'premium' | 'ultimate';
  username?: string;
}

export interface SteadyStreamResult {
  success: boolean;
  user?: any;
  credentials?: {
    username: string;
    password: string;
    activationCode: string;
    playlistUrl: string;
  };
  error?: string;
}

export class SteadyStreamAutomationService {
  /**
   * Complete automation flow using our independent SteadyStream system
   */
  static async executeCompleteAutomation(userData: SteadyStreamUserData): Promise<SteadyStreamResult> {
    try {
      console.log('🚀 Executing SteadyStream automation for:', userData.email);

      // Generate username if not provided
      const username = userData.username || this.generateUsername(userData.name);
      const password = userData.password || this.generateSecurePassword();
      
      // Generate activation code and playlist token
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const playlistToken = btoa(JSON.stringify({
        username,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      }));

      // Calculate expiry date based on plan
      const expiryDays = userData.plan === 'trial' ? 1 : 30;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      // Create user in our SteadyStream system using raw SQL
      const { data: steadyStreamUser, error: userError } = await supabase.rpc('create_steadystream_user', {
        p_full_name: userData.name,
        p_email: userData.email,
        p_username: username,
        p_password: password,
        p_subscription_plan: userData.plan || 'trial',
        p_max_connections: this.getMaxConnections(userData.plan || 'trial'),
        p_expiry_date: expiryDate.toISOString()
      });

      if (userError) {
        throw new Error(`User creation failed: ${userError.message}`);
      }

      console.log('✅ SteadyStream user created');

      // Create playlist entry using raw SQL
      const playlistUrl = `${window.location.origin}/api/playlist/${playlistToken}.m3u8`;
      
      const { error: playlistError } = await supabase.rpc('create_steadystream_playlist', {
        p_user_id: steadyStreamUser,
        p_playlist_url: playlistUrl,
        p_activation_code: activationCode,
        p_playlist_token: playlistToken
      });

      if (playlistError) {
        throw new Error(`Playlist creation failed: ${playlistError.message}`);
      }

      console.log('✅ Playlist created with activation code:', activationCode);

      // Optionally create Supabase auth user for dashboard access
      try {
        const { data: authData } = await supabase.auth.signUp({
          email: userData.email,
          password: password,
          options: {
            data: {
              full_name: userData.name,
              steadystream_user_id: steadyStreamUser
            }
          }
        });

        if (authData.user) {
          // Create profile entry using raw SQL
          await supabase.rpc('create_user_profile', {
            p_user_id: authData.user.id,
            p_name: userData.name,
            p_email: userData.email,
            p_subscription_tier: userData.plan || 'trial',
            p_trial_end_date: userData.plan === 'trial' ? expiryDate.toISOString() : null,
            p_xtream_username: username,
            p_xtream_password: password
          });
        }
      } catch (authError) {
        console.warn('Auth user creation failed (non-critical):', authError);
      }

      // Send welcome email via edge function
      try {
        await this.sendWelcomeEmail(userData, {
          username,
          password,
          activationCode,
          playlistUrl
        });
      } catch (emailError) {
        console.warn('Welcome email failed (non-critical):', emailError);
      }

      return {
        success: true,
        user: { id: steadyStreamUser },
        credentials: {
          username,
          password,
          activationCode,
          playlistUrl
        }
      };

    } catch (error: any) {
      console.error('💥 SteadyStream automation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a unique username from name
   */
  private static generateUsername(name: string): string {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    return `steady_${cleanName.substring(0, 8)}_${randomSuffix}`;
  }

  /**
   * Generate a secure password
   */
  private static generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Get max connections for plan
   */
  private static getMaxConnections(plan: string): number {
    const connections = {
      trial: 1,
      standard: 2,
      premium: 4,
      ultimate: 6
    };
    return connections[plan as keyof typeof connections] || 1;
  }

  /**
   * Send welcome email with credentials
   */
  private static async sendWelcomeEmail(userData: SteadyStreamUserData, credentials: any) {
    await supabase.functions.invoke('send-welcome-email', {
      body: {
        email: userData.email,
        name: userData.name,
        credentials: credentials
      }
    });
  }
}
