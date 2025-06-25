
import { supabase } from '@/integrations/supabase/client';
import { MegaOTTIntegrationService } from './megaOTTIntegrationService';

export class EnhancedMegaOTTService {
  private integrationService: MegaOTTIntegrationService;

  constructor() {
    this.integrationService = new MegaOTTIntegrationService();
  }

  // Enhanced user creation with new database structure
  async createUserWithToken(email: string, plan: string, userId: string) {
    try {
      console.log('🔄 Creating user with enhanced token system...', { email, plan, userId });
      
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

      // Create user subscription record
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (plan === 'trial' ? 1 : 30));

      await supabase
        .from('user_subscriptions_new')
        .upsert({
          user_id: userId,
          plan,
          status: 'active',
          playlist_url: result.playlistUrl,
          username: result.username,
          password: result.password,
          server_url: result.serverUrl,
          device_limit: deviceLimit,
          devices_connected: 0,
          expires_at: expiryDate.toISOString()
        });

      // Update user profile with credentials
      await supabase
        .from('user_profiles')
        .upsert({
          supabase_user_id: userId,
          email,
          full_name: email.split('@')[0],
          subscription_plan: plan,
          status: 'active',
          username: result.username,
          password: result.password,
          playlist_url: result.playlistUrl,
          stream_url: result.serverUrl,
          subscription_expires: expiryDate.toISOString(),
          iptv_credentials: {
            server: result.serverUrl,
            username: result.username,
            password: result.password,
            port: '80'
          }
        });

      console.log('✅ User created with enhanced system successfully');
      
      return {
        success: true,
        credentials: {
          server: result.serverUrl,
          username: result.username,
          password: result.password,
          port: '80'
        },
        playlistUrl: result.playlistUrl,
        expiryDate: expiryDate,
        activationCode: result.username.split('_')[1] || 'N/A'
      };

    } catch (error) {
      console.error('❌ Enhanced user creation failed:', error);
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

  // Register device for user
  async registerDevice(userId: string, deviceInfo: {
    deviceId: string;
    deviceName?: string;
    deviceType: string;
    ipAddress?: string;
  }) {
    try {
      const { error } = await supabase
        .from('user_devices')
        .upsert({
          user_id: userId,
          device_id: deviceInfo.deviceId,
          device_name: deviceInfo.deviceName,
          device_type: deviceInfo.deviceType,
          ip_address: deviceInfo.ipAddress,
          is_active: true
        });

      if (error) throw error;

      // Update devices_connected count
      const { count } = await supabase
        .from('user_devices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      await supabase
        .from('user_subscriptions_new')
        .update({ devices_connected: count || 0 })
        .eq('user_id', userId)
        .eq('status', 'active');

      return { success: true };
    } catch (error) {
      console.error('❌ Device registration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Track viewing analytics
  async trackViewing(userId: string, viewingData: {
    channelId?: string;
    channelName: string;
    category?: string;
    durationSeconds: number;
  }) {
    try {
      const { error } = await supabase
        .from('viewing_analytics')
        .insert({
          user_id: userId,
          channel_id: viewingData.channelId,
          channel_name: viewingData.channelName,
          category: viewingData.category,
          duration_seconds: viewingData.durationSeconds
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Viewing analytics failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user analytics
  async getUserAnalytics(userId: string, days: number = 30) {
    try {
      const { data, error } = await supabase
        .from('viewing_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('watched_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('watched_at', { ascending: false });

      if (error) throw error;

      // Process analytics data
      const totalWatchTime = data?.reduce((sum, record) => sum + (record.duration_seconds || 0), 0) || 0;
      const categoryStats = data?.reduce((acc, record) => {
        const category = record.category || 'Unknown';
        acc[category] = (acc[category] || 0) + (record.duration_seconds || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        success: true,
        analytics: {
          totalWatchTime,
          totalSessions: data?.length || 0,
          categoryStats,
          recentActivity: data?.slice(0, 10) || []
        }
      };
    } catch (error) {
      console.error('❌ Analytics retrieval failed:', error);
      return { success: false, error: error.message };
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
