import { supabase } from '@/integrations/supabase/client';
import { MegaOTTConnectivityManager } from './megaOTTConnectivityManager';
import { EnhancedMegaOTTService } from './enhancedMegaOTTService';

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
  userFriendlyMessage?: string;
}

export class MegaOTTAdminService {

  // Enhanced getUserInfo with connectivity management
  static async getUserInfo(): Promise<{ success: boolean; id?: number; username?: string; credit?: number; error?: string; errorCode?: string }> {
    try {
      console.log('🔍 Getting enhanced MegaOTT user info...');
      
      // Use enhanced service instead of direct supabase call
      return await EnhancedMegaOTTService.getUserInfo();
      
    } catch (error: any) {
      console.error('❌ Enhanced admin service error:', error);
      
      const userLocation = await MegaOTTConnectivityManager.detectUserLocation();
      const friendlyError = MegaOTTConnectivityManager.getLocationAwareErrorMessage(error, userLocation);
      
      return { 
        success: false, 
        error: friendlyError,
        errorCode: 'ENHANCED_SERVICE_ERROR'
      };
    }
  }

  // Enhanced subscription fetching with fallback
  static async fetchSubscriptions(): Promise<any[]> {
    const cacheKey = 'megaott_subscriptions';
    
    // Try cache first
    const cached = MegaOTTConnectivityManager.getCachedResponse(cacheKey);
    if (cached) {
      console.log('📦 Using cached subscriptions data');
      return cached;
    }

    try {
      const result = await MegaOTTConnectivityManager.retryWithBackoff(async () => {
        const { data, error } = await supabase.functions.invoke('megaott-proxy', {
          body: { action: 'get_users' }
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Failed to fetch subscriptions');
        
        return Array.isArray(data.data) ? data.data : data.data?.data || [];
      });

      // Cache successful response
      MegaOTTConnectivityManager.setCachedResponse(cacheKey, result, 300000); // 5 minutes
      
      return result;

    } catch (error) {
      console.error('❌ Enhanced subscription fetch failed:', error);
      
      // Return empty array but log the issue
      const userLocation = await MegaOTTConnectivityManager.detectUserLocation();
      console.warn('⚠️ Subscription fetch failed for region:', userLocation.region);
      
      return [];
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
          used: 0,
          percentage: 0,
          enhanced: true
        };
      }
      
      const userLocation = await MegaOTTConnectivityManager.detectUserLocation();
      const errorMessage = MegaOTTConnectivityManager.getLocationAwareErrorMessage(
        { message: info.error }, 
        userLocation
      );
        
      throw new Error(errorMessage);
    } catch (error: any) {
      console.error('❌ Enhanced credit check failed:', error);
      throw new Error(error.message || 'Enhanced credit service unavailable');
    }
  }

  static async createUserLine(email: string, plan: string) {
    try {
      return await EnhancedMegaOTTService.createUserLine(email, plan);
    } catch (error: any) {
      console.error('❌ Enhanced user creation failed:', error);
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
