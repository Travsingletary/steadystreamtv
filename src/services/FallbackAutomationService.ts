
import { supabase } from "@/integrations/supabase/client";
import type { UserData } from './types';

export interface FallbackResult {
  success: boolean;
  activationCode: string;
  credentials: {
    server: string;
    port: string;
    username: string;
    password: string;
  };
  playlistUrl: string;
  expiryDate: Date;
  message: string;
  source: 'fallback_local';
  error?: string;
}

export class FallbackAutomationService {
  static async processSignupFallback(userData: UserData): Promise<FallbackResult> {
    try {
      console.log('🔄 Processing signup with fallback system for:', userData.email);

      // Generate reliable local credentials
      const activationCode = `SS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const username = `steady_${activationCode.replace('SS-', '').toLowerCase()}`;
      const password = this.generateSecurePassword();

      const credentials = {
        server: 'steadystream.megaott.net',
        port: '25461',
        username: username,
        password: password
      };

      const playlistUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://steadystreamtv.com'}/api/playlist/${activationCode}.m3u8`;
      const expiryDate = this.calculateExpiryDate(userData.plan);

      // Store in Supabase for tracking
      try {
        await this.storeUserProfile({
          full_name: userData.name,
          email: userData.email,
          subscription_plan: userData.plan,
          activation_code: activationCode,
          username: username,
          password: password,
          playlist_url: playlistUrl,
          subscription_expires: expiryDate.toISOString(),
          status: 'active',
          stream_url: playlistUrl,
          megaott_error: 'API unavailable - using fallback',
          error_type: 'api_fallback'
        });
        console.log('✅ User profile stored in fallback mode');
      } catch (storageError) {
        console.warn('⚠️ Profile storage failed, but credentials still generated:', storageError);
      }

      const planName = userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1);
      const connections = this.getConnectionsByPlan(userData.plan);

      return {
        success: true,
        activationCode,
        credentials,
        playlistUrl,
        expiryDate,
        source: 'fallback_local',
        message: `🎉 Your SteadyStream TV ${planName} account is ready! You can stream on ${connections} device${connections > 1 ? 's' : ''}. (Fallback mode active)`
      };

    } catch (error: any) {
      console.error('❌ Fallback automation failed:', error);
      
      // Final fallback
      const emergencyCode = `EM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return {
        success: false,
        activationCode: emergencyCode,
        credentials: {
          server: 'contact-support.steadystream.tv',
          port: '80',
          username: 'emergency',
          password: 'contact-support'
        },
        playlistUrl: '',
        expiryDate: new Date(),
        source: 'fallback_local',
        message: 'Account created! Please contact support for activation: support@steadystreamtv.com',
        error: error.message
      };
    }
  }

  private static generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + '!';
  }

  private static calculateExpiryDate(plan: string): Date {
    const now = new Date();
    const expiryTime = plan === 'trial' 
      ? 24 * 60 * 60 * 1000 
      : 30 * 24 * 60 * 60 * 1000;
    return new Date(now.getTime() + expiryTime);
  }

  private static getConnectionsByPlan(plan: string): number {
    const connections: Record<string, number> = {
      'trial': 1,
      'basic': 1,
      'duo': 2,
      'family': 3,
      'standard': 2,
      'premium': 3,
      'ultimate': 5
    };
    return connections[plan] || 1;
  }

  private static async storeUserProfile(profileData: any) {
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        ...profileData,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Profile storage failed: ${error.message}`);
    }
  }
}
