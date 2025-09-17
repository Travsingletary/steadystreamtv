import { useState, useEffect } from 'react';

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
    setLoading(true);
    setError(null);
    
    try {
      // Temporarily return mock data during database cleanup
      const mockData: LaunchMetrics = {
        totalUsers: 0,
        activeSubscriptions: 0,
        conversionRate: 0,
        averageSessionTime: 0,
        popularPlans: [],
        deviceBreakdown: []
      };
      
      setMetrics(mockData);
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    loading,
    error,
    refreshMetrics: fetchMetrics
  };
};