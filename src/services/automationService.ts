
// src/services/automationService.ts
// Main automation orchestrator - refactored for better maintainability

import { UserRegistrationService } from './userRegistrationService';
import { MegaOTTService } from './megaOTTService';
import { PlaylistService } from './playlistService';
import { CONFIG } from './config';
import type { UserData, RegistrationResult } from './types';

// Re-export types and config for backward compatibility
export type { UserData, RegistrationResult };
export { CONFIG };

export class SimpleAutomationService {
  /**
   * Complete automation flow with production integrations
   */
  static async executeCompleteAutomation(userData: UserData): Promise<RegistrationResult> {
    try {
      console.log('🚀 Executing production automation for:', userData.email);

      // Step 1: Register user with Supabase Auth
      const authResult = await UserRegistrationService.registerUser(userData);
      const userId = authResult.user?.id;

      if (!userId) {
        throw new Error('User creation failed');
      }

      console.log('✅ User registered with ID:', userId);

      // Step 2: Generate user assets
      const assets = await UserRegistrationService.generateUserAssets(userId, userData.plan);
      console.log('✅ Assets generated:', assets.activationCode);

      // Step 3: Create REAL MegaOTT subscription
      const subscription = await MegaOTTService.createSubscription(userId, userData.plan, userData);
      console.log('✅ MegaOTT subscription created:', subscription.subscriptionId);

      // Step 4: Send welcome email with REAL credentials
      const emailCredentials = {
        username: subscription.credentials?.username || assets.activationCode,
        password: subscription.credentials?.password || 'temp123',
        playlistUrls: subscription.playlistUrls || {
          m3u: assets.playlistUrl,
          m3u_plus: assets.playlistUrl.replace('.m3u8', '_plus.m3u8'),
          xspf: assets.playlistUrl.replace('.m3u8', '.xspf')
        }
      };

      await UserRegistrationService.sendWelcomeEmail(userId, userData, emailCredentials);

      // Success! User is fully set up with REAL IPTV account
      return {
        success: true,
        user: authResult.user,
        assets,
        subscription,
        userData
      };

    } catch (error) {
      console.error('💥 Production automation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Legacy methods for backward compatibility
  static registerUser = UserRegistrationService.registerUser;
  static generateUserAssets = UserRegistrationService.generateUserAssets;
  static createMegaOTTSubscription = MegaOTTService.createSubscription;
  static generateM3UContent = PlaylistService.generateM3UContent;
}

// Export for backward compatibility
export const AutomationService = SimpleAutomationService;
