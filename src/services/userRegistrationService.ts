
// src/services/userRegistrationService.ts
// Handles user registration and asset generation

import { CONFIG } from './config';
import type { UserData } from './types';

export class UserRegistrationService {
  /**
   * Register user with Supabase Auth
   */
  static async registerUser(userData: UserData) {
    try {
      const response = await fetch(`${CONFIG.supabase.url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          data: {
            full_name: userData.name,
            plan: userData.plan,
            device_type: userData.deviceType,
            preferences: JSON.stringify(userData.preferences)
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Generate user assets (activation code, playlist URL, QR code)
   */
  static async generateUserAssets(userId: string, plan: string = 'trial') {
    const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const playlistData = {
      userId,
      activationCode,
      plan,
      timestamp: Date.now(),
      expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };

    const playlistToken = btoa(JSON.stringify(playlistData));
    const playlistUrl = `${window.location.origin}/api/playlist/${playlistToken}.m3u8`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(playlistUrl)}`;

    return {
      activationCode,
      playlistToken,
      playlistUrl,
      qrCodeUrl
    };
  }

  /**
   * Send welcome email with credentials
   */
  static async sendWelcomeEmail(userId: string, userData: UserData, credentials: any) {
    try {
      await fetch(`${CONFIG.supabase.url}/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          email: userData.email,
          name: userData.name,
          iptv: credentials
        })
      });
      console.log('✅ Welcome email sent with real credentials');
    } catch (emailError) {
      console.warn('⚠️ Email sending failed:', emailError.message);
      // Don't fail the entire process for email issues
    }
  }
}
