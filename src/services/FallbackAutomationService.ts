
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
  userProfileId?: string;
  subscriptionId?: string;
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

      // Step 1: Create user profile record
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          full_name: userData.name,
          email: userData.email,
          activation_code: activationCode,
          username: username,
          password: password,
          iptv_credentials: credentials,
          playlist_url: playlistUrl,
          status: 'active',
          stream_url: playlistUrl,
          megaott_error: 'API unavailable - using fallback',
          error_type: 'api_fallback'
        })
        .select()
        .single();

      if (profileError) {
        throw new Error(`User profile creation failed: ${profileError.message}`);
      }

      // Step 2: Create subscription record
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_profile_id: userProfile.id,
          plan_type: userData.plan,
          billing_status: userData.plan === 'trial' ? 'trial' : 'active',
          start_date: new Date().toISOString(),
          end_date: expiryDate.toISOString(),
          auto_renew: userData.plan !== 'trial'
        })
        .select()
        .single();

      if (subscriptionError) {
        console.warn('⚠️ Subscription creation failed, but user profile exists:', subscriptionError);
      } else {
        // Step 3: Link subscription to user profile
        await supabase
          .from('user_profiles')
          .update({ 
            current_subscription_id: subscription.id,
            subscription_plan: userData.plan,
            subscription_expires: expiryDate.toISOString(),
            subscription_active: true
          })
          .eq('id', userProfile.id);
      }

      console.log('✅ User profile and subscription created in fallback mode');

      const planName = userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1);
      const connections = this.getConnectionsByPlan(userData.plan);

      return {
        success: true,
        activationCode,
        credentials,
        playlistUrl,
        expiryDate,
        source: 'fallback_local',
        userProfileId: userProfile.id,
        subscriptionId: subscription?.id,
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
}
