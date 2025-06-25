
import { supabase } from '@/integrations/supabase/client';
import { MegaOTTIntegrationService } from './megaOTTIntegrationService';

export class EnhancedMegaOTTService {
  private integrationService: MegaOTTIntegrationService;

  constructor() {
    this.integrationService = new MegaOTTIntegrationService();
  }

  // Enhanced user creation with token management
  async createUserWithToken(email: string, plan: string, userId: string) {
    try {
      console.log('🔄 Creating user with token system...', { email, plan, userId });
      
      // Map plan to device limit
      const deviceLimits = {
        trial: 1,
        solo: 1,
        duo: 2,
        family: 3,
        standard: 2,
        premium: 3,
        ultimate: 5
      };

      const deviceLimit = deviceLimits[plan] || 1;

      // Use token-based assignment
      const result = await this.integrationService.assignTokenToCustomer({
        userId,
        email,
        plan,
        deviceLimit
      });

      // Update user profile with credentials
      await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          email,
          full_name: email.split('@')[0],
          subscription_plan: plan,
          status: 'active',
          username: result.username,
          password: result.password,
          playlist_url: result.playlistUrl,
          stream_url: result.serverUrl,
          subscription_expires: new Date(result.expiresAt),
          iptv_credentials: {
            server: result.serverUrl,
            username: result.username,
            password: result.password,
            port: '80'
          }
        });

      console.log('✅ User created with token system successfully');
      
      return {
        success: true,
        credentials: {
          server: result.serverUrl,
          username: result.username,
          password: result.password,
          port: '80'
        },
        playlistUrl: result.playlistUrl,
        expiryDate: new Date(result.expiresAt),
        activationCode: result.username.split('_')[1] || 'N/A'
      };

    } catch (error) {
      console.error('❌ Token-based user creation failed:', error);
      
      // Fallback to existing MegaOTT service
      return this.fallbackToDirectAPI(email, plan, userId);
    }
  }

  // Fallback to direct API if token system fails
  private async fallbackToDirectAPI(email: string, plan: string, userId: string) {
    try {
      console.log('🔄 Falling back to direct MegaOTT API...');
      
      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: {
          action: 'create_user',
          user_username: `steady_${Date.now()}`,
          user_password: this.generatePassword(),
          credits: '30',
          max_connections: '2',
          expire_date: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000).toString()
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Direct API failed');
      }

      // Generate local fallback
      return this.generateLocalFallback(email, plan, userId);
      
    } catch (error) {
      console.error('❌ Direct API fallback failed:', error);
      return this.generateLocalFallback(email, plan, userId);
    }
  }

  // Generate local fallback credentials
  private generateLocalFallback(email: string, plan: string, userId: string) {
    const fallbackCode = `FB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const fallbackUsername = `fallback_${fallbackCode.toLowerCase()}`;
    
    return {
      success: true,
      source: 'local_fallback',
      activationCode: fallbackCode,
      credentials: {
        server: 'demo.steadystreamtv.com',
        port: '80',
        username: fallbackUsername,
        password: fallbackCode.replace('FB-', '')
      },
      playlistUrl: `${window.location.origin}/api/playlist/${fallbackCode}.m3u8`,
      expiryDate: this.calculateExpiryDate(plan),
      fallbackMode: true
    };
  }

  // Generate optimized playlist for user
  async generateUserPlaylist(userId: string) {
    try {
      return await this.integrationService.generateOptimizedPlaylist(userId);
    } catch (error) {
      console.error('❌ Optimized playlist generation failed:', error);
      
      // Fallback to basic playlist
      const playlistToken = btoa(JSON.stringify({ userId }));
      return {
        playlistUrl: `${window.location.origin}/api/playlist/${playlistToken}`,
        token: playlistToken
      };
    }
  }

  // Monitor token inventory
  async getTokenInventory() {
    try {
      return await this.integrationService.monitorTokenInventory();
    } catch (error) {
      console.error('❌ Token inventory check failed:', error);
      return { basic: 0, premium: 0, vip: 0 };
    }
  }

  // Helper methods
  private generatePassword(): string {
    return Math.random().toString(36).substring(2, 10) + 
           Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private calculateExpiryDate(plan: string): Date {
    const now = new Date();
    const expiryTime = plan === 'trial' 
      ? 24 * 60 * 60 * 1000 
      : 30 * 24 * 60 * 60 * 1000;
    return new Date(now.getTime() + expiryTime);
  }
}
