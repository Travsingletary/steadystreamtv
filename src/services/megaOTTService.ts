
// src/services/megaOTTService.ts
// UPDATED: Custom Dashboard integration with secure edge functions

import { CONFIG } from './config';
import type { UserData } from './types';

export class MegaOTTService {
  /**
   * UPDATED: Create Custom Dashboard subscription via secure edge function
   * API keys are now stored securely in Supabase secrets
   */
  static async createSubscription(userId: string, plan: string, userData: UserData) {
    try {
      console.log('Creating SECURE Custom Dashboard subscription for user:', userId, 'plan:', plan);
      
      // Call the secure create-xtream-account Supabase edge function (now uses Custom Dashboard)
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
          name: userData.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Secure Custom Dashboard API error:', response.status, errorData);
        throw new Error(`Failed to create IPTV account: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Secure Custom Dashboard subscription created successfully:', result);
      
      return {
        success: true,
        plan,
        message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated securely via Custom Dashboard`,
        subscriptionId: result.data?.dashboardId,
        credentials: {
          username: result.data?.username,
          password: result.data?.password
        },
        playlistUrls: result.data?.playlistUrls
      };
      
    } catch (error) {
      console.error('Secure Custom Dashboard integration error:', error);
      throw new Error(`Failed to create IPTV subscription: ${error.message}`);
    }
  }
}
