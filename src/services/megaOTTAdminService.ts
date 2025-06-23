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

export class MegaOTTAdminService {
  private static API_BASE = 'https://megaott.net/api/v1';
  private static API_TOKEN = '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d';

  // Direct API token method - no token generation needed
  static async getAPIToken(): Promise<string> {
    return this.API_TOKEN;
  }

  static async fetchSubscriptions(): Promise<MegaOTTSubscription[]> {
    try {
      const response = await fetch(`${this.API_BASE}/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_TOKEN}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`MegaOTT API error: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      console.error('Error fetching MegaOTT subscriptions:', error);
      return [];
    }
  }

  static async getUserInfo(): Promise<{ success: boolean; id?: number; username?: string; credit?: number; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_TOKEN}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 MegaOTT User Data:', data);
        return {
          success: true,
          id: data.id,
          username: data.username,
          credit: data.credit
        };
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.error('MegaOTT API error:', error);
      return { success: false, error: error.message };
    }
  }

  // Legacy method for backward compatibility - returns the user data directly
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
      const response = await fetch(`${this.API_BASE}/subscriptions/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_TOKEN}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`MegaOTT API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching MegaOTT subscription:', error);
      return null;
    }
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
