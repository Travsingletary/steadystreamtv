
import { supabase } from "@/integrations/supabase/client";
import { EnhancedApiService } from "./enhancedApiService";
import { handleApiError } from "@/utils/errorHandling";

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
   * Complete automation flow using our independent SteadyStream system with enhanced error handling
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

      // Create user in our SteadyStream system using enhanced API service
      const userResult = await EnhancedApiService.safeQuery(
        () => (supabase as any)
          .from('steadystream_users')
          .insert({
            full_name: userData.name,
            email: userData.email,
            username: username,
            password: password,
            subscription_plan: userData.plan || 'trial',
            max_connections: this.getMaxConnections(userData.plan || 'trial'),
            expiry_date: expiryDate.toISOString()
          })
          .select()
          .single(),
        'SteadyStream user creation'
      );

      if (userResult.error || !userResult.data) {
        throw new Error(userResult.error || 'Failed to create user');
      }

      const steadyStreamUser = userResult.data;
      console.log('✅ SteadyStream user created');

      // Create playlist entry using enhanced API service
      const playlistUrl = `${window.location.origin}/api/playlist/${playlistToken}.m3u8`;
      
      const playlistResult = await EnhancedApiService.safeQuery(
        () => (supabase as any)
          .from('steadystream_playlists')
          .insert({
            steadystream_user_id: steadyStreamUser.id,
            playlist_url: playlistUrl,
            activation_code: activationCode,
            playlist_token: playlistToken
          }),
        'Playlist creation'
      );

      if (playlistResult.error) {
        console.warn('⚠️ Playlist creation failed (non-critical):', playlistResult.error);
      } else {
        console.log('✅ Playlist created with activation code:', activationCode);
      }

      // Optionally create Supabase auth user for dashboard access
      try {
        const authResult = await EnhancedApiService.safeAuth('signUp', {
          email: userData.email,
          password: password,
          options: {
            data: {
              full_name: userData.name,
              steadystream_user_id: steadyStreamUser.id
            }
          }
        });

        if (authResult.data?.user) {
          // Create profile entry using enhanced API service
          await EnhancedApiService.safeQuery(
            () => supabase
              .from('profiles')
              .insert({
                id: authResult.data.user.id,
                full_name: userData.name,
                email: userData.email
              }),
            'Profile creation'
          );
        }
      } catch (authError) {
        console.warn('Auth user creation failed (non-critical):', authError);
      }

      // Send welcome email via edge function with enhanced error handling
      try {
        const emailResult = await EnhancedApiService.safeInvokeFunction(
          'send-welcome-email',
          {
            email: userData.email,
            name: userData.name,
            credentials: {
              username,
              password,
              activationCode,
              playlistUrl
            }
          },
          'Welcome email'
        );
        
        if (emailResult.error) {
          console.warn('Welcome email failed (non-critical):', emailResult.error);
        }
      } catch (emailError) {
        console.warn('Welcome email failed (non-critical):', emailError);
      }

      return {
        success: true,
        user: { id: steadyStreamUser.id },
        credentials: {
          username,
          password,
          activationCode,
          playlistUrl
        }
      };

    } catch (error: any) {
      console.error('💥 SteadyStream automation failed:', error);
      const friendlyError = handleApiError(error, 'SteadyStream automation');
      return {
        success: false,
        error: friendlyError
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

  private static generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private static getMaxConnections(plan: string): number {
    const connections = {
      trial: 1,
      standard: 2,
      premium: 4,
      ultimate: 6
    };
    return connections[plan as keyof typeof connections] || 1;
  }
}
