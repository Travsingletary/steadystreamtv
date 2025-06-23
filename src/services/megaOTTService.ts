
// 🚀 CORRECTED MEGAOTT SERVICE - Using Supabase Edge Function proxy
import { supabase } from '@/integrations/supabase/client';

export class MegaOTTService {

  // Get reseller info and credits using Supabase Edge Function
  static async getResellerInfo() {
    try {
      console.log('🔍 Getting reseller info via proxy...');
      
      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: { action: 'get_credits' }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        console.log('✅ Reseller info retrieved:', data.data);
        return {
          success: true,
          data: data.data,
          apiUsed: 'proxy',
          apiName: 'MegaOTT Proxy Service'
        };
      }
      
      throw new Error(data.error || 'Failed to get reseller info');
    } catch (error) {
      console.error('❌ Reseller info failed:', error);
      throw error;
    }
  }

  // Create user line using Supabase Edge Function
  static async createUserLine(email: string, plan: string) {
    try {
      console.log('🔄 Creating user line via proxy...', { email, plan });
      
      // Calculate package based on plan
      const packages = {
        trial: { credits: 1, connections: 1, days: 1 },
        basic: { credits: 30, connections: 1, days: 30 },
        duo: { credits: 60, connections: 2, days: 30 },
        family: { credits: 90, connections: 3, days: 30 },
        standard: { credits: 60, connections: 2, days: 30 },
        premium: { credits: 90, connections: 3, days: 30 },
        ultimate: { credits: 150, connections: 5, days: 30 }
      };

      const pkg = packages[plan] || packages.basic;
      
      // Generate unique credentials
      const userUsername = `steady_${Date.now()}`;
      const userPassword = this.generatePassword();
      const activationCode = `SS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expireDate = this.getExpireDate(pkg.days);

      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: {
          action: 'create_user',
          user_username: userUsername,
          user_password: userPassword,
          credits: pkg.credits.toString(),
          max_connections: pkg.connections.toString(),
          expire_date: expireDate
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success && (data.data?.result === true || data.data?.success === true)) {
        // Generate playlist URLs
        const baseUrl = 'https://megaott.net';
        const playlistUrl = `${baseUrl}/get.php?username=${userUsername}&password=${userPassword}&type=m3u_plus&output=ts`;
        const smartTvUrl = `${baseUrl}/get.php?username=${userUsername}&password=${userPassword}&type=m3u`;
        
        console.log('✅ User created successfully via proxy');
        return {
          success: true,
          activationCode,
          megaottId: data.data.user_id || userUsername,
          credentials: {
            server: baseUrl.replace('https://', '').replace('http://', ''),
            port: '80',
            username: userUsername,
            password: userPassword
          },
          m3uUrl: playlistUrl,
          smartTvUrl: smartTvUrl,
          expiryDate: new Date(parseInt(expireDate) * 1000),
          source: 'proxy',
          apiUsed: 'proxy',
          apiName: 'MegaOTT Proxy Service'
        };
      }

      throw new Error(data.data?.message || data.error || 'Failed to create user');

    } catch (error) {
      console.error('❌ User creation failed:', error);
      
      // Generate local fallback
      return this.generateLocalFallback(email, plan);
    }
  }

  // Check available credits using proxy
  static async checkCredits() {
    try {
      const info = await this.getResellerInfo();
      return {
        available: info.data.credits || info.data.available_credits || 0,
        used: info.data.used_credits || 0,
        apiUsed: info.apiUsed,
        apiName: info.apiName
      };
    } catch (error) {
      console.error('❌ Failed to check credits:', error);
      return { 
        available: 0, 
        used: 0, 
        error: error.message,
        apiUsed: 'proxy'
      };
    }
  }

  // Generate local fallback when proxy fails
  private static generateLocalFallback(email: string, plan: string) {
    const fallbackCode = `FB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const fallbackUsername = `fallback_${fallbackCode.toLowerCase()}`;
    
    return {
      success: true,
      source: 'local_fallback',
      activationCode: fallbackCode,
      megaottId: `fallback-${fallbackCode}`,
      credentials: {
        server: 'demo.steadystreamtv.com',
        port: '80',
        username: fallbackUsername,
        password: fallbackCode.replace('FB-', '')
      },
      m3uUrl: `${window.location.origin}/api/playlist/${fallbackCode}.m3u8`,
      smartTvUrl: `${window.location.origin}/api/playlist/${fallbackCode}.m3u8`,
      expiryDate: this.calculateExpiryDate(plan),
      apiUsed: 'local_fallback',
      apiName: 'Local Fallback System',
      fallbackMode: true
    };
  }

  // Helper methods
  private static generatePassword(): string {
    return Math.random().toString(36).substring(2, 10) + 
           Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private static getExpireDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return Math.floor(date.getTime() / 1000).toString(); // Unix timestamp
  }

  private static calculateExpiryDate(plan: string): Date {
    const now = new Date();
    const expiryTime = plan === 'trial' 
      ? 24 * 60 * 60 * 1000 
      : 30 * 24 * 60 * 60 * 1000;
    return new Date(now.getTime() + expiryTime);
  }

  // Test connection method
  static async testConnection() {
    try {
      console.log('🔍 Testing MegaOTT proxy connection...');
      
      const info = await this.getResellerInfo();
      console.log('✅ Connection successful!', info);
      
      const credits = await this.checkCredits();
      console.log('💰 Available credits:', credits);
      
      return {
        success: true,
        info,
        credits
      };
    } catch (error) {
      console.error('❌ Connection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
