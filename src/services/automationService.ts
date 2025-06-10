// src/services/automationService.ts
// Enhanced automation service with better error handling

import { supabase } from "@/integrations/supabase/client";
import { MegaOTTService } from './megaOTTService';
import type { UserData, RegistrationResult } from './types';

export class SimpleAutomationService {
  static async executeCompleteAutomation(userData: UserData): Promise<RegistrationResult> {
    try {
      console.log('🚀 Executing production automation for:', userData.email);

      // 1. Register user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
            plan: userData.plan,
            device_type: userData.deviceType || 'mobile',
            preferences: JSON.stringify(userData.preferences || {
              favoriteGenres: ['sports', 'movies', 'news', 'documentary', 'kids', 'entertainment'],
              parentalControls: false,
              autoOptimization: true,
              videoQuality: 'Auto'
            })
          }
        }
      });

      if (authError) {
        throw new Error(`User registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User registration failed: No user data returned');
      }

      console.log('✅ User registered with ID:', authData.user.id);

      // 2. Generate activation code
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log('✅ Assets generated:', activationCode);

      // 3. Create IPTV subscription with enhanced error handling
      let megaottSubscription;
      try {
        // Create complete userData object for MegaOTTService
        const completeUserData: UserData = {
          ...userData,
          deviceType: userData.deviceType || 'mobile',
          preferences: userData.preferences || {
            favoriteGenres: ['sports', 'movies', 'news', 'documentary', 'kids', 'entertainment'],
            parentalControls: false,
            autoOptimization: true,
            videoQuality: 'Auto'
          }
        };

        megaottSubscription = await MegaOTTService.createSubscription(
          authData.user.id,
          userData.plan,
          completeUserData
        );
        console.log('✅ IPTV subscription created:', megaottSubscription.message);
      } catch (megaottError) {
        console.warn('⚠️ IPTV subscription creation failed, continuing with basic account:', megaottError.message);
        
        // Create a basic subscription record anyway
        megaottSubscription = {
          success: false,
          plan: userData.plan,
          message: 'Account created (IPTV setup pending)',
          error: megaottError.message,
          credentials: {
            activationCode,
            username: `pending_${authData.user.id.substring(0, 8)}`,
            password: 'pending'
          }
        };
      }

      // 4. Update user profile with trial info
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            name: userData.name,
            email: userData.email,
            subscription_tier: userData.plan,
            subscription_status: megaottSubscription.success ? 'active' : 'pending',
            trial_end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.warn('Profile update failed:', profileError);
        }
      } catch (profileError) {
        console.warn('Profile update error:', profileError);
      }

      return {
        success: true,
        user: authData.user,
        assets: {
          activationCode,
          playlistToken: activationCode,
          playlistUrl: megaottSubscription.playlistUrls?.m3u || 'https://steadystreamtv.com/playlist/demo',
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(megaottSubscription.playlistUrls?.m3u || 'https://steadystreamtv.com/playlist/demo')}`
        },
        subscription: megaottSubscription
      };

    } catch (error: any) {
      console.error('💥 Production automation failed:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }
}
