
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

export class MegaOTTAdminService {
  private static API_BASE = 'https://megaott.net/api/v1';
  
  static async getAPIToken(): Promise<string | null> {
    try {
      // Get the MegaOTT API token from Supabase secrets or environment
      const { data, error } = await supabase.functions.invoke('megaott-config-check');
      
      if (error || !data?.token) {
        console.error('Failed to get MegaOTT API token:', error);
        return null;
      }
      
      return data.token;
    } catch (error) {
      console.error('Error getting MegaOTT API token:', error);
      return null;
    }
  }

  static async fetchSubscriptions(): Promise<MegaOTTSubscription[]> {
    try {
      const token = await this.getAPIToken();
      if (!token) {
        throw new Error('No MegaOTT API token available');
      }

      const response = await fetch(`${this.API_BASE}/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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

  static async getUserInfo() {
    try {
      const token = await this.getAPIToken();
      if (!token) {
        throw new Error('No MegaOTT API token available');
      }

      const response = await fetch(`${this.API_BASE}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`MegaOTT API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching MegaOTT user info:', error);
      return null;
    }
  }

  static async getSubscriptionById(id: number): Promise<MegaOTTSubscription | null> {
    try {
      const token = await this.getAPIToken();
      if (!token) {
        throw new Error('No MegaOTT API token available');
      }

      const response = await fetch(`${this.API_BASE}/subscriptions/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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
}
