
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditMonitor } from './CreditMonitor';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, CreditCard, TrendingUp, Activity, Zap } from 'lucide-react';
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

export const AdminQuickView = () => {
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
      
      // Check Supabase connection and get user stats
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at');
      
      if (!profilesError && profiles) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaySignups = profiles.filter(profile => 
          new Date(profile.created_at) >= today
        ).length;
        
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

      // Get subscription data from stripe_subscriptions table
      const { data: subscriptions } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('status', 'active');
      
      const activeCount = subscriptions?.length || 0;
      const estimatedRevenue = activeCount * 25; // Average $25 per subscription

      setStats(prev => ({
        ...prev,
        activeSubscriptions: activeCount,
        revenue: estimatedRevenue
      }));

      // Test MegaOTT API connection
      try {
        const response = await fetch('https://megaott.net/api/v1/user', {
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN_HERE',
            'Accept': 'application/json'
          }
        });
        
        setStats(prev => ({
          ...prev,
          systemHealth: {
            ...prev.systemHealth,
            megaott: response.ok
          }
        }));
      } catch {
        // MegaOTT connection failed
      }

      // Assume Stripe is working if we have active subscriptions
      setStats(prev => ({
        ...prev,
        systemHealth: {
          ...prev.systemHealth,
          stripe: activeCount > 0
        }
      }));

    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getHealthStatus = (service: string) => {
    const isHealthy = stats.systemHealth[service as keyof typeof stats.systemHealth];
    return {
      color: isHealthy ? 'bg-green-500' : 'bg-red-500',
      status: isHealthy ? 'Operational' : 'Issues Detected'
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Activity className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-dark-100">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">SteadyStream TV Admin</h1>
        <p className="text-gray-400">Real-time business metrics and system monitoring</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-dark-200 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{stats.totalUsers}</div>
            <p className="text-sm text-gray-500 mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Today's Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{stats.todaySignups}</div>
            <p className="text-sm text-gray-500 mt-1">New customers today</p>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{stats.activeSubscriptions}</div>
            <p className="text-sm text-gray-500 mt-1">Paying customers</p>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">{formatCurrency(stats.revenue)}</div>
            <p className="text-sm text-gray-500 mt-1">Estimated this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Monitor */}
      <CreditMonitor />

      {/* System Status */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription className="text-gray-400">
            Current system health and integration status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-dark-300 rounded-lg border border-gray-700">
              <div className={`w-3 h-3 rounded-full ${getHealthStatus('supabase').color}`}></div>
              <div>
                <p className="font-medium text-white">Supabase Database</p>
                <p className="text-sm text-gray-400">{getHealthStatus('supabase').status}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-dark-300 rounded-lg border border-gray-700">
              <div className={`w-3 h-3 rounded-full ${getHealthStatus('megaott').color}`}></div>
              <div>
                <p className="font-medium text-white">MegaOTT API</p>
                <p className="text-sm text-gray-400">{getHealthStatus('megaott').status}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-dark-300 rounded-lg border border-gray-700">
              <div className={`w-3 h-3 rounded-full ${getHealthStatus('stripe').color}`}></div>
              <div>
                <p className="font-medium text-white">Stripe Payments</p>
                <p className="text-sm text-gray-400">{getHealthStatus('stripe').status}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-left transition-colors">
              <h4 className="font-medium mb-1">Export User Data</h4>
              <p className="text-sm text-blue-100">Download customer reports</p>
            </button>
            
            <button className="p-4 bg-green-600 hover:bg-green-700 rounded-lg text-white text-left transition-colors">
              <h4 className="font-medium mb-1">Add MegaOTT Credits</h4>
              <p className="text-sm text-green-100">Top up account balance</p>
            </button>
            
            <button className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-left transition-colors">
              <h4 className="font-medium mb-1">View System Logs</h4>
              <p className="text-sm text-purple-100">Check error reports</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
