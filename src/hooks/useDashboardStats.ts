
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  todaySignups: number;
  activeSubscriptions: number;
  revenue: number;
  systemHealth: {
    supabase: boolean;
    megaott: boolean;
    stripe: boolean;
  };
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todaySignups: 0,
    activeSubscriptions: 0,
    revenue: 0,
    systemHealth: {
      supabase: false,
      megaott: false,
      stripe: false
    }
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard statistics...');
      
      // Get user profiles and count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at, subscription_status');
      
      if (!profilesError && profiles) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaySignups = profiles.filter(profile => 
          new Date(profile.created_at) >= today
        ).length;
        
        console.log('👥 Total profiles found:', profiles.length);
        console.log('📅 Today signups:', todaySignups);
        
        setStats(prev => ({
          ...prev,
          totalUsers: profiles.length,
          todaySignups,
          systemHealth: {
            ...prev.systemHealth,
            supabase: true
          }
        }));
      }

      // Count active subscriptions more aggressively
      let maxActiveSubscriptions = 0;
      const subscriptionSources = [];

      // 1. Check stripe_subscriptions table
      const { data: stripeSubscriptions } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('status', 'active');
      
      if (stripeSubscriptions && stripeSubscriptions.length > 0) {
        subscriptionSources.push(`${stripeSubscriptions.length} Stripe active`);
        maxActiveSubscriptions = Math.max(maxActiveSubscriptions, stripeSubscriptions.length);
      }

      // 2. Check iptv_accounts table
      const { data: iptvAccounts } = await supabase
        .from('iptv_accounts')
        .select('*')
        .eq('status', 'active');
      
      if (iptvAccounts && iptvAccounts.length > 0) {
        subscriptionSources.push(`${iptvAccounts.length} IPTV active`);
        maxActiveSubscriptions = Math.max(maxActiveSubscriptions, iptvAccounts.length);
      }

      // 3. Check profiles with active subscription status
      const { data: activeProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('subscription_status', 'active');
      
      if (activeProfiles && activeProfiles.length > 0) {
        subscriptionSources.push(`${activeProfiles.length} profiles active`);
        maxActiveSubscriptions = Math.max(maxActiveSubscriptions, activeProfiles.length);
      }

      // 4. Check general subscriptions table
      const now = new Date().toISOString();
      const { data: generalSubscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .gte('end_date', now);
      
      if (generalSubscriptions && generalSubscriptions.length > 0) {
        subscriptionSources.push(`${generalSubscriptions.length} general subs`);
        maxActiveSubscriptions = Math.max(maxActiveSubscriptions, generalSubscriptions.length);
      }

      // Calculate estimated revenue
      const estimatedRevenue = maxActiveSubscriptions * 25;

      console.log('📊 Subscription sources found:', subscriptionSources);
      console.log('📊 Max active subscriptions count:', maxActiveSubscriptions);
      console.log('💰 Estimated revenue:', estimatedRevenue);

      setStats(prev => ({
        ...prev,
        activeSubscriptions: maxActiveSubscriptions,
        revenue: estimatedRevenue,
        systemHealth: {
          ...prev.systemHealth,
          stripe: maxActiveSubscriptions > 0,
          megaott: true
        }
      }));

    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return {
    stats,
    loading,
    loadStats,
    formatCurrency
  };
};
