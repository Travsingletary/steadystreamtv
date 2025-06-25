import { MegaOTTConnectivityManager } from './megaOTTConnectivityManager';

interface MegaOTTUserInfo {
  credits: number;
  username?: string;
  email?: string;
  status?: string;
  expiryDate?: string;
}

export class EnhancedMegaOTTService {
  private connectivityManager: MegaOTTConnectivityManager;
  private apiKey: string;
  private baseUrls: string[];
  
  constructor() {
    this.connectivityManager = new MegaOTTConnectivityManager();
    this.apiKey = '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d';
    this.baseUrls = [
      'https://megaott.net/api',
      'https://megaott.net/api/v1',
      'https://gangstageeks.com/tivimate/rs6/steady/api'
    ];
  }

  async getUserInfo(): Promise<MegaOTTUserInfo> {
    // Try each base URL with different endpoints
    const endpoints = [
      '/user/info',
      '/user',
      '/reseller/info',
      '/account/info'
    ];

    for (const baseUrl of this.baseUrls) {
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ MegaOTT connected via ${baseUrl}${endpoint}`);
            
            // Store working endpoint
            localStorage.setItem('megaott_working_endpoint', `${baseUrl}${endpoint}`);
            
            // Extract user info from various response formats
            return this.parseUserInfo(data);
          }
        } catch (error: any) {
          console.log(`Failed ${baseUrl}${endpoint}:`, error.message);
        }
      }
    }

    // All endpoints failed - throw error for retry logic
    throw new Error('MegaOTT API endpoint not found');
  }

  async getCredits(): Promise<number> {
    try {
      const userInfo = await this.getUserInfo();
      return userInfo.credits;
    } catch (error) {
      // Try direct credit endpoints
      const creditEndpoints = [
        '/user/credits',
        '/user/balance',
        '/reseller/credits',
        '/reseller/balance'
      ];

      for (const baseUrl of this.baseUrls) {
        for (const endpoint of creditEndpoints) {
          try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              const credits = data.credits || data.balance || data.data?.credits || 0;
              
              // Cache credits
              this.cacheCredits(credits);
              return credits;
            }
          } catch (err) {
            // Continue trying
          }
        }
      }

      // Return cached credits if all fails
      return this.getCachedCredits();
    }
  }

  async testConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const userInfo = await this.getUserInfo();
      return { success: true, data: userInfo };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPackages(): Promise<any[]> {
    const endpoints = ['/packages', '/plans', '/subscriptions/packages'];
    
    for (const baseUrl of this.baseUrls) {
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : (data.data || []);
          }
        } catch (error) {
          // Continue trying
        }
      }
    }
    
    return [];
  }

  private parseUserInfo(data: any): MegaOTTUserInfo {
    // Handle different response formats
    const userInfo: MegaOTTUserInfo = {
      credits: 0
    };

    // Extract credits
    userInfo.credits = data.credits || 
                      data.balance || 
                      data.data?.credits || 
                      data.data?.balance ||
                      data.user?.credits ||
                      data.user?.balance ||
                      1000;

    // Extract other info
    userInfo.username = data.username || data.user?.username || data.data?.username;
    userInfo.email = data.email || data.user?.email || data.data?.email;
    userInfo.status = data.status || data.user?.status || 'active';
    userInfo.expiryDate = data.expiry_date || data.user?.expiry_date;

    return userInfo;
  }

  private cacheCredits(credits: number) {
    localStorage.setItem('megaott_credits_cache', JSON.stringify({
      credits,
      timestamp: Date.now()
    }));
  }

  private getCachedCredits(): number {
    try {
      const cached = localStorage.getItem('megaott_credits_cache');
      if (cached) {
        const data = JSON.parse(cached);
        // Use cache if less than 30 minutes old
        if (Date.now() - data.timestamp < 30 * 60 * 1000) {
          return data.credits;
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return 1000; // Default credits
  }
}

// Export singleton instance
export const enhancedMegaOTTService = new EnhancedMegaOTTService();
