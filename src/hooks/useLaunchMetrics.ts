
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LaunchMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  conversionRate: number;
  averageSessionTime: number;
  popularPlans: { plan: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
}

export const useLaunchMetrics = () => {
  const [metrics, setMetrics] = useState<LaunchMetrics>({
    totalUsers: 0,
    activeSubscriptions: 0,
    conversionRate: 0,
    averageSessionTime: 0,
    popularPlans: [],
    deviceBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'active');

      // Get plan breakdown
      const { data: planData } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .not('subscription_tier', 'is', null);

      const planCounts = planData?.reduce((acc, profile) => {
        const plan = profile.subscription_tier || 'unknown';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const popularPlans = Object.entries(planCounts)
        .map(([plan, count]) => ({ plan, count }))
        .sort((a, b) => b.count - a.count);

      // Get device breakdown
      const { data: deviceData } = await supabase
        .from('profiles')
        .select('preferred_device');

      const deviceCounts = deviceData?.reduce((acc, profile) => {
        const device = profile.preferred_device || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const deviceBreakdown = Object.entries(deviceCounts)
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate conversion rate
      const conversionRate = totalUsers && totalUsers > 0 
        ? (activeSubscriptions || 0) / totalUsers * 100 
        : 0;

      setMetrics({
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageSessionTime: 0, // Will be calculated from analytics
        popularPlans,
        deviceBreakdown
      });

      setError(null);
    } catch (err) {
      console.error('Failed to fetch launch metrics:', err);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    loading,
    error,
    refreshMetrics: fetchMetrics
  };
};
