
import { supabase } from '@/integrations/supabase/client';

interface MegaOTTSubscription {
  id: number;
  type: string;
  username?: string;
  password?: string;
  mac_address?: string;
  package: {
    id: number;
    name: string;
  };
  max_connections: number;
  forced_country: string;
  adult: boolean;
  paid: boolean;
  expiring_at: string;
  dns_link: string;
}

interface MegaOTTUser {
  id: number;
  username: string;
  credit: number;
}

interface MegaOTTError {
  success: false;
  error: string;
  code?: string;
  details?: any;
  endpoint?: string;
}

export class MegaOTTAdminService {

  // Updated getUserInfo to use Supabase Edge Function with better error handling
  static async getUserInfo(): Promise<{ success: boolean; id?: number; username?: string; credit?: number; error?: string; errorCode?: string }> {
    try {
      console.log('🔍 Getting MegaOTT user info via proxy...');
      
      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: { action: 'user_info' }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        return { 
          success: false, 
          error: `Supabase function error: ${error.message}`,
          errorCode: 'SUPABASE_ERROR'
        };
      }

      if (!data || !data.success) {
        const megaError = data as MegaOTTError;
        console.error('❌ MegaOTT API error:', megaError);
        
        // Provide user-friendly error messages based on error codes
        let friendlyError = megaError?.error || 'Unknown error';
        switch (megaError?.code) {
          case 'HTTP_403':
            friendlyError = 'MegaOTT access denied. Please check credentials and account status.';
            break;
          case 'HTTP_404':
            friendlyError = 'MegaOTT API endpoint not found. Service may be temporarily unavailable.';
            break;
          case 'HTTP_429':
            friendlyError = 'Too many requests to MegaOTT. Please wait before trying again.';
            break;
          case 'HTTP_502':
            friendlyError = 'MegaOTT service temporarily unavailable. Please try again later.';
            break;
          case 'MISSING_CREDENTIALS':
            friendlyError = 'MegaOTT credentials not configured. Please contact administrator.';
            break;
          case 'INVALID_JSON':
            friendlyError = 'MegaOTT returned invalid response format.';
            break;
          case 'HTML_ERROR_PAGE':
            friendlyError = 'MegaOTT service is currently unavailable. Please try again later.';
            break;
          case 'MEGAOTT_ERROR':
            friendlyError = `MegaOTT API error: ${megaError.error}`;
            break;
          default:
            if (friendlyError.includes('HTML error page')) {
              friendlyError = 'MegaOTT service is currently unavailable. Please try again later.';
            }
        }
        
        return { 
          success: false, 
          error: friendlyError,
          errorCode: megaError?.code || 'UNKNOWN_ERROR'
        };
      }

      if (data.data) {
        const userData = data.data;
        console.log('📊 MegaOTT User Data:', userData);
        
        // Handle different response formats
        const credit = userData.credits || userData.available_credits || userData.credit || 0;
        
        return {
          success: true,
          id: userData.id,
          username: userData.username,
          credit: credit
        };
      } else {
        return { 
          success: false, 
          error: 'No user data received from MegaOTT',
          errorCode: 'NO_DATA'
        };
      }
    } catch (error: any) {
      console.error('❌ MegaOTT service error:', error);
      return { 
        success: false, 
        error: `Service error: ${error.message}`,
        errorCode: 'SERVICE_ERROR'
      };
    }
  }

  // Legacy method for backward compatibility
  static async getUserInfoLegacy(): Promise<MegaOTTUser | null> {
    const result = await this.getUserInfo();
    if (result.success) {
      return {
        id: result.id!,
        username: result.username!,
        credit: result.credit!
      };
    }
    return null;
  }

  static async fetchSubscriptions(): Promise<MegaOTTSubscription[]> {
    try {
      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: { action: 'get_users' }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        return [];
      }

      if (!data || !data.success) {
        console.error('❌ MegaOTT API error:', data?.error || 'Unknown error');
        return [];
      }

      return Array.isArray(data.data) ? data.data : data.data?.data || [];
    } catch (error) {
      console.error('❌ Error fetching MegaOTT subscriptions:', error);
      return [];
    }
  }

  static async getSubscriptionById(id: number): Promise<MegaOTTSubscription | null> {
    try {
      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: { 
          action: 'get_user_info',
          user_id: id.toString()
        }
      });

      if (error || !data?.success) {
        console.error('❌ Error fetching MegaOTT subscription:', error || data?.error);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('❌ Error fetching MegaOTT subscription:', error);
      return null;
    }
  }

  static async checkCredits() {
    try {
      const info = await this.getUserInfo();
      if (info.success) {
        return {
          available: info.credit || 0,
          used: 0, // Not available in this API response
          percentage: 0 // Cannot calculate without used credits
        };
      }
      
      // Enhanced error handling for credit check
      const errorMessage = info.errorCode === 'HTTP_403' 
        ? 'MegaOTT access denied - please verify credentials'
        : info.errorCode === 'HTTP_404'
        ? 'MegaOTT service temporarily unavailable'
        : info.error || 'Failed to get credit info';
        
      throw new Error(errorMessage);
    } catch (error: any) {
      console.error('❌ Credit check failed:', error);
      throw new Error(error.message || 'No credit data received');
    }
  }

  static async createUserLine(email: string, plan: string) {
    try {
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
      const userUsername = `steady_${Date.now()}`;
      const userPassword = this.generatePassword();
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

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to create user');
      }

      if (data.data?.result === true || data.data?.success === true) {
        const baseUrl = 'https://megaott.net';
        const playlistUrl = `${baseUrl}/get.php?username=${userUsername}&password=${userPassword}&type=m3u_plus&output=ts`;
        
        return {
          success: true,
          activationCode: `SS-${userUsername.split('_')[1]}`,
          megaottId: data.data.user_id || userUsername,
          credentials: {
            server: baseUrl.replace('https://', '').replace('http://', ''),
            port: '80',
            username: userUsername,
            password: userPassword
          },
          m3uUrl: playlistUrl,
          smartTvUrl: playlistUrl,
          expiryDate: new Date(parseInt(expireDate) * 1000),
          source: 'megaott-proxy'
        };
      }
      
      throw new Error(data.data?.message || 'Failed to create user');
    } catch (error: any) {
      console.error('❌ Failed to create user:', error);
      throw error;
    }
  }

  private static generatePassword(): string {
    return Math.random().toString(36).substring(2, 10) + 
           Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private static getExpireDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return Math.floor(date.getTime() / 1000).toString(); // Unix timestamp
  }

  static analyzeSubscriptions(subscriptions: MegaOTTSubscription[]) {
    const now = new Date();
    const activeSubscriptions = subscriptions.filter(sub => 
      new Date(sub.expiring_at) > now
    );
    
    const expiredSubscriptions = subscriptions.filter(sub => 
      new Date(sub.expiring_at) <= now
    );

    const paidSubscriptions = subscriptions.filter(sub => sub.paid);
    const trialSubscriptions = subscriptions.filter(sub => !sub.paid);

    const planBreakdown = subscriptions.reduce((acc, sub) => {
      acc[sub.package.name] = (acc[sub.package.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const estimatedRevenue = paidSubscriptions.length * 25; // Estimate $25 per paid subscription
    const monthlyRevenue = activeSubscriptions.length * 25;

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      expiredSubscriptions: expiredSubscriptions.length,
      paidSubscriptions: paidSubscriptions.length,
      trialSubscriptions: trialSubscriptions.length,
      planBreakdown,
      estimatedRevenue,
      monthlyRevenue,
      conversionRate: subscriptions.length ? (paidSubscriptions.length / subscriptions.length * 100) : 0,
      recentSubscriptions: subscriptions
        .sort((a, b) => new Date(b.expiring_at).getTime() - new Date(a.expiring_at).getTime())
        .slice(0, 5)
        .map(sub => ({
          userEmail: sub.username || 'N/A',
          planName: sub.package.name,
          amount: 25, // Estimated amount
          createdAt: new Date(sub.expiring_at).toLocaleDateString(),
          type: sub.type,
          status: new Date(sub.expiring_at) > now ? 'active' : 'expired'
        }))
    };
  }

  static analyzeCreditsUsage(subscriptions: MegaOTTSubscription[], userCredit: number) {
    const now = new Date();
    const activeSubscriptions = subscriptions.filter(sub => 
      new Date(sub.expiring_at) > now
    );
    
    // Estimate credit costs per subscription type
    const costPerSubscription = {
      'M3U': 0.50, // Estimated cost per M3U subscription
      'MAG': 0.75, // Estimated cost per MAG subscription
      'ENIGMA': 0.60 // Estimated cost per Enigma subscription
    };

    const totalCostEstimate = subscriptions.reduce((total, sub) => {
      return total + (costPerSubscription[sub.type] || 0.50);
    }, 0);

    const monthlyBurn = activeSubscriptions.reduce((total, sub) => {
      return total + (costPerSubscription[sub.type] || 0.50);
    }, 0);

    const daysRemaining = monthlyBurn > 0 ? Math.floor(userCredit / (monthlyBurn / 30)) : Infinity;
    
    return {
      currentCredit: userCredit,
      totalCostEstimate,
      monthlyBurn,
      daysRemaining: daysRemaining === Infinity ? 'Unlimited' : daysRemaining,
      efficiency: subscriptions.length > 0 ? (userCredit / totalCostEstimate * 100) : 100,
      recommendedActions: this.generateCreditRecommendations(userCredit, monthlyBurn, subscriptions.length)
    };
  }

  static generateCreditRecommendations(credit: number, monthlyBurn: number, totalSubs: number) {
    const recommendations = [];
    
    if (credit < 10) {
      recommendations.push({
        type: 'warning',
        message: 'Low credit balance - consider topping up',
        action: 'Add Credits'
      });
    }
    
    if (monthlyBurn > credit) {
      recommendations.push({
        type: 'critical',
        message: 'Monthly costs exceed current credit',
        action: 'Urgent: Add Credits'
      });
    }
    
    if (totalSubs > 100 && credit > 50) {
      recommendations.push({
        type: 'success',
        message: 'High volume operation with good credit buffer',
        action: 'Monitor Usage'
      });
    }
    
    return recommendations;
  }
}
