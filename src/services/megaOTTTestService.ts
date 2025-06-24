
import { supabase } from '@/integrations/supabase/client';

export class MegaOTTTestService {
  
  static async testConnection() {
    try {
      console.log('🧪 Testing MegaOTT connection via Supabase edge function...');
      
      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: { action: 'user_info' }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        return {
          success: false,
          error: `Supabase function error: ${error.message}`,
          details: error
        };
      }

      if (!data.success) {
        console.error('❌ MegaOTT API error:', data);
        return {
          success: false,
          error: data.error || 'Unknown MegaOTT error',
          details: data
        };
      }

      console.log('✅ MegaOTT connection successful:', data.data);
      return {
        success: true,
        data: data.data,
        message: 'Connection successful!'
      };
    } catch (error) {
      console.error('❌ Test connection failed:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  static async getUserInfo() {
    try {
      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: { action: 'user_info' }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to get user info');
      }

      const userData = data.data;
      
      return {
        credits: userData.credits || userData.available_credits || 0,
        used_credits: userData.used_credits || 0,
        active_lines: userData.active_connections || 0,
        max_connections: userData.max_connections || 0,
        status: userData.status || 'active',
        username: userData.username || 'Unknown'
      };
    } catch (error) {
      console.error('❌ Get user info failed:', error);
      throw error;
    }
  }

  static async checkCredits() {
    try {
      const info = await this.getUserInfo();
      
      const total = info.credits + info.used_credits;
      const percentage = total > 0 ? Math.round((info.used_credits / total) * 100) : 0;
      
      return {
        available: info.credits,
        used: info.used_credits,
        total: total,
        percentage: percentage
      };
    } catch (error) {
      console.error('❌ Credit check failed:', error);
      throw new Error('No credit data received');
    }
  }

  static async createTestUser() {
    try {
      const userUsername = `test_${Date.now()}`;
      const userPassword = this.generatePassword();
      
      // Calculate expiry date (1 day for test)
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + 1);
      const expireTimestamp = Math.floor(expireDate.getTime() / 1000);

      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: {
          action: 'create_user',
          user_username: userUsername,
          user_password: userPassword,
          credits: '1',
          max_connections: '1',
          expire_date: expireTimestamp.toString()
        }
      });
      
      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Failed to create test user');
      }
      
      if (data.data?.result === true || data.data?.success === true) {
        const playlistUrl = `https://megaott.net/get.php?username=${userUsername}&password=${userPassword}&type=m3u_plus&output=ts`;
        
        return {
          success: true,
          username: userUsername,
          password: userPassword,
          playlistUrl: playlistUrl,
          server: 'https://megaott.net',
          activationCode: userUsername.split('_')[1],
          credentials: {
            server: 'megaott.net',
            port: '80',
            username: userUsername,
            password: userPassword
          }
        };
      }
      
      throw new Error(data.data?.message || 'Failed to create user');
    } catch (error) {
      console.error('❌ Failed to create test user:', error);
      throw error;
    }
  }

  private static generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Comprehensive test function
  static async runFullTest() {
    console.log('🧪 Running comprehensive MegaOTT test...');
    
    const results = {
      connection: null,
      userInfo: null,
      credits: null,
      userCreation: null,
      overall: false
    };

    try {
      // Test 1: Connection
      console.log('📡 Testing connection...');
      results.connection = await this.testConnection();
      
      if (results.connection.success) {
        // Test 2: User Info
        console.log('👤 Testing user info...');
        try {
          results.userInfo = await this.getUserInfo();
          console.log('✅ User info successful');
        } catch (error) {
          results.userInfo = { error: error.message };
        }
        
        // Test 3: Credits
        console.log('💰 Testing credits...');
        try {
          results.credits = await this.checkCredits();
          console.log('✅ Credits check successful');
        } catch (error) {
          results.credits = { error: error.message };
        }
        
        // Test 4: User Creation
        console.log('👥 Testing user creation...');
        try {
          results.userCreation = await this.createTestUser();
          console.log('✅ User creation successful');
        } catch (error) {
          results.userCreation = { error: error.message };
        }
      }
      
      results.overall = results.connection.success && 
                       results.userInfo && !results.userInfo.error &&
                       results.credits && !results.credits.error;
      
      console.log('🎯 Test Results:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Full test failed:', error);
      results.overall = false;
      return results;
    }
  }
}

// Export for console testing
(window as any).testMegaOTT = MegaOTTTestService.runFullTest;
