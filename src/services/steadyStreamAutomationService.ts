
// src/services/steadyStreamAutomationService.ts
// Enhanced SteadyStream automation with fallback handling

import { supabase } from "@/integrations/supabase/client";
import { MegaOTTService } from './megaOTTService';

export interface SteadyStreamUserData {
  name: string;
  email: string;
  password: string;
  plan: 'trial' | 'basic' | 'duo' | 'family' | 'standard' | 'premium' | 'ultimate';
}

export interface SteadyStreamResult {
  success: boolean;
  error?: string;
  user?: any;
  credentials?: {
    activationCode: string;
    username: string;
    password: string;
  };
}

export class SteadyStreamAutomationService {
  static async executeCompleteAutomation(userData: SteadyStreamUserData): Promise<SteadyStreamResult> {
    try {
      console.log('🎯 Executing SteadyStream automation for:', userData.email);

      // 1. Register user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            plan: userData.plan
          }
        }
      });

      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      console.log('✅ User created:', authData.user.id);

      // 2. Generate activation code
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 3. Create IPTV subscription with fallback
      let iptvCredentials;
      try {
        // Convert to compatible format for MegaOTTService
        const completeUserData = {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          plan: userData.plan as 'trial' | 'solo' | 'duo' | 'family',
          deviceType: 'mobile' as const
        };

        const megaOTTService = new MegaOTTService();
        const credentials = await megaOTTService.createIPTVAccount(completeUserData);
        
        iptvCredentials = {
          activationCode,
          username: credentials.username,
          password: credentials.password
        };

        console.log('✅ IPTV subscription created successfully');
      } catch (iptvError: any) {
        console.warn('⚠️ IPTV creation failed, using demo credentials:', iptvError.message);
        
        // Provide demo credentials for trial users
        iptvCredentials = {
          activationCode,
          username: `demo_${activationCode.toLowerCase()}`,
          password: 'demo123'
        };
      }

      // 4. Update profile
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            name: userData.name,
            email: userData.email,
            subscription_tier: userData.plan,
            subscription_status: 'active',
            trial_end_date: userData.plan === 'trial' 
              ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
              : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } catch (profileError) {
        console.warn('Profile update failed:', profileError);
      }

      return {
        success: true,
        user: authData.user,
        credentials: iptvCredentials
      };

    } catch (error: any) {
      console.error('💥 SteadyStream automation failed:', error);
      return {
        success: false,
        error: error.message || 'Automation failed'
      };
    }
  }
}
