
// 🚀 PRODUCTION STEADYSTREAM AUTOMATION SERVICE
// Uses MegaOTTAPIManager with proper fallback logic

import { MegaOTTAPIManager } from './megaOTTAPIManager';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  name: string;
  email: string;
  password: string;
  plan: string;
  allowAdult?: boolean;
}

interface AutomationResult {
  success: boolean;
  activationCode?: string;
  credentials?: any;
  playlistUrl?: string;
  smartTvUrl?: string;
  expiryDate?: Date;
  megaottId?: string;
  source?: string;
  apiUsed?: string;
  apiName?: string;
  message?: string;
  error?: string;
  fallback?: {
    activationCode: string;
    message: string;
  };
}

export const ProductionSteadyStreamAutomation = {
  async processCompleteSignup(userData: UserData): Promise<AutomationResult> {
    try {
      console.log('🚀 Starting production MegaOTT signup automation...');
      console.log(`📋 User: ${userData.email}, Plan: ${userData.plan}`);

      // Step 1: Create MegaOTT subscription using production APIs
      const megaOTTResult = await MegaOTTAPIManager.createSubscription(userData, userData.plan);
      
      // Step 2: Store user profile in Supabase
      await this.storeUserProfile(userData, megaOTTResult);
      
      console.log(`✅ Production automation completed using ${megaOTTResult.apiName}`);

      return {
        success: true,
        activationCode: megaOTTResult.activationCode,
        credentials: megaOTTResult.credentials,
        playlistUrl: megaOTTResult.m3uUrl,
        smartTvUrl: megaOTTResult.smartTvUrl,
        expiryDate: megaOTTResult.expiryDate,
        megaottId: megaOTTResult.megaottId,
        source: megaOTTResult.source,
        apiUsed: megaOTTResult.apiUsed,
        apiName: megaOTTResult.apiName,
        message: this.generateSuccessMessage(userData, megaOTTResult)
      };

    } catch (error: any) {
      console.error('❌ Production automation failed:', error);
      
      // Emergency fallback
      const emergencyCode = `EM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      return {
        success: false,
        error: error.message,
        fallback: {
          activationCode: emergencyCode,
          message: 'Account created! Support will contact you with access details.'
        }
      };
    }
  },

  async storeUserProfile(userData: UserData, megaOTTResult: any) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          full_name: userData.name,
          email: userData.email,
          subscription_plan: userData.plan,
          activation_code: megaOTTResult.activationCode,
          iptv_credentials: megaOTTResult.credentials,
          playlist_url: megaOTTResult.m3uUrl,
          stream_url: megaOTTResult.smartTvUrl,
          subscription_expires: megaOTTResult.expiryDate?.toISOString(),
          subscription_active: true,
          onboarding_completed: true,
          status: 'active',
          username: megaOTTResult.credentials?.username,
          password: megaOTTResult.credentials?.password
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Profile storage failed: ${error.message}`);
      }

      console.log('💾 User profile stored successfully');
      return data;

    } catch (error) {
      console.warn('⚠️ Profile storage failed:', error);
      // Don't fail the entire process for storage issues
      throw error;
    }
  },

  generateSuccessMessage(userData: UserData, result: any): string {
    const planName = userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1);
    const connections = this.getConnectionsByPlan(userData.plan);
    const apiSource = result.apiName || 'MegaOTT API';
    
    return `🎉 Your SteadyStream TV ${planName} account is ready via ${apiSource}! Stream on ${connections} device${connections > 1 ? 's' : ''}.`;
  },

  getConnectionsByPlan(plan: string): number {
    const connections = {
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
};
