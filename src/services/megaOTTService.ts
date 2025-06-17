
// MegaOTT Service - Updated to use real MegaOTT API
import { CONFIG } from './config';
import type { UserData } from './types';

export class MegaOTTService {
  /**
   * Create MegaOTT subscription via secure edge function
   */
  static async createSubscription(userId: string, plan: string, userData: UserData) {
    try {
      console.log('Creating MegaOTT subscription for user:', userId, 'plan:', plan);
      
      // Call the updated create-xtream-account function
      const response = await fetch(`${CONFIG.supabase.url}/functions/v1/create-xtream-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          planType: plan,
          email: userData.email,
          name: userData.name,
          useMegaOTT: true // Flag to use new MegaOTT integration
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('MegaOTT API error:', response.status, errorData);
        throw new Error(`Failed to create IPTV account: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('MegaOTT subscription created successfully:', result);
      
      return {
        success: true,
        plan,
        message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated via MegaOTT`,
        subscriptionId: result.data?.megaott_subscription_id,
        credentials: {
          username: result.data?.username,
          password: result.data?.password,
          activationCode: result.data?.username?.toUpperCase()
        },
        playlistUrls: {
          m3u: result.data?.playlist_url,
          m3u_plus: result.data?.playlist_url,
          server_url: result.data?.server_url
        }
      };
      
    } catch (error) {
      console.error('MegaOTT integration error:', error);
      throw new Error(`Failed to create IPTV subscription: ${error.message}`);
    }
  }

  /**
   * Get user subscription status from MegaOTT
   */
  static async getSubscriptionStatus(userId: string) {
    try {
      const response = await fetch(`${CONFIG.supabase.url}/functions/v1/megaott-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to get subscription status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { success: false, error: error.message };
    }
  }
}
