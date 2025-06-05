
// src/services/megaOTTService.ts
// Handles MegaOTT subscription creation and management

import { CONFIG } from './config';
import type { UserData } from './types';

export class MegaOTTService {
  /**
   * Live MegaOTT subscription creation - REAL API CALLS FOR ALL PLANS
   */
  static async createSubscription(userId: string, plan: string, userData: UserData) {
    try {
      console.log('Creating REAL MegaOTT subscription for user:', userId, 'plan:', plan);
      
      // Call the create-xtream-account Supabase function for REAL account creation
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
        console.error('Create Xtream Account API error:', response.status, errorData);
        throw new Error(`Failed to create IPTV account: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('MegaOTT subscription created successfully:', result);
      
      return {
        success: true,
        plan,
        message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated in MegaOTT`,
        subscriptionId: result.data?.megaottId,
        credentials: {
          username: result.data?.username,
          password: result.data?.password
        },
        playlistUrls: result.data?.playlistUrls
      };
      
    } catch (error) {
      console.error('MegaOTT integration error:', error);
      throw new Error(`Failed to create IPTV subscription: ${error.message}`);
    }
  }
}
