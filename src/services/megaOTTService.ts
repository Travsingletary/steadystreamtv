
// src/services/megaOTTService.ts
// UPDATED: Enhanced fallback handling for missing API credentials

import { CONFIG } from './config';
import type { UserData } from './types';

export class MegaOTTService {
  /**
   * Create Custom Dashboard subscription via secure edge function with fallback
   */
  static async createSubscription(userId: string, plan: string, userData: UserData) {
    try {
      console.log('Creating SECURE Custom Dashboard subscription for user:', userId, 'plan:', plan);
      
      // Call the secure create-xtream-account Supabase edge function
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
        console.error('Custom Dashboard API error:', response.status, errorData);
        
        // Check if it's a missing API key error
        if (errorData.details?.includes('API_KEY is not set') || errorData.details?.includes('not set')) {
          console.log('API credentials not configured, providing trial credentials');
          return this.createTrialFallback(userId, plan, userData);
        }
        
        throw new Error(`Failed to create IPTV account: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Custom Dashboard subscription created successfully:', result);
      
      return {
        success: true,
        plan,
        message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated via Custom Dashboard`,
        subscriptionId: result.data?.dashboardId,
        credentials: {
          username: result.data?.username,
          password: result.data?.password
        },
        playlistUrls: result.data?.playlistUrls
      };
      
    } catch (error) {
      console.error('Custom Dashboard integration error:', error);
      
      // If it's a trial plan, provide fallback credentials
      if (plan === 'trial' || plan === 'free-trial') {
        console.log('Providing trial fallback for plan:', plan);
        return this.createTrialFallback(userId, plan, userData);
      }
      
      throw new Error(`Failed to create IPTV subscription: ${error.message}`);
    }
  }

  /**
   * Create trial fallback when API is not available
   */
  private static createTrialFallback(userId: string, plan: string, userData: UserData) {
    console.log('Creating trial fallback credentials for user:', userId);
    
    // Generate trial credentials
    const username = `trial_${userId.substring(0, 8)}`;
    const password = `temp_${Math.random().toString(36).substring(2, 8)}`;
    
    // Generate a basic playlist URL (you can enhance this)
    const playlistUrl = `https://steadystreamtv.com/api/playlist/${userId}`;
    
    return {
      success: true,
      plan,
      message: 'Trial account created (Demo mode - API configuration pending)',
      subscriptionId: `trial_${userId}`,
      credentials: {
        username,
        password,
        activationCode: username.toUpperCase()
      },
      playlistUrls: {
        m3u: playlistUrl,
        m3u_plus: playlistUrl,
        xspf: playlistUrl
      },
      isTrialFallback: true
    };
  }
}
