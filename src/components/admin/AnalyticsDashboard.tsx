
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, Calendar } from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  totalRevenue: number;
  activeSubscriptions: number;
  trialUsers: number;
  conversionRate: number;
  recentSignups: Array<{ date: string; count: number }>;
  planDistribution: Array<{ name: string; value: number; color: string }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch user data
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      // Calculate analytics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const totalUsers = profiles?.length || 0;
      const activeSubscriptions = profiles?.filter(p => p.subscription_status === 'active').length || 0;
      const trialUsers = profiles?.filter(p => p.subscription_tier === 'trial').length || 0;
      
      // Calculate revenue (approximate based on plans)
      const planPrices = { standard: 20, premium: 35, ultimate: 45, trial: 0 };
      const totalRevenue = profiles?.reduce((sum, user) => {
        const price = planPrices[user.subscription_tier as keyof typeof planPrices] || 0;
        return sum + (user.subscription_status === 'active' ? price : 0);
      }, 0) || 0;

      // Calculate conversion rate
      const paidUsers = profiles?.filter(p => p.subscription_tier !== 'trial' && p.subscription_status === 'active').length || 0;
      const conversionRate = trialUsers > 0 ? (paidUsers / (paidUsers + trialUsers)) * 100 : 0;

      // Recent signups (last 7 days)
      const recentSignups = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const count = profiles?.filter(p => 
          p.created_at && p.created_at.startsWith(dateStr)
        ).length || 0;
        recentSignups.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count
        });
      }

      // Plan distribution
      const planCounts = profiles?.reduce((acc, user) => {
        const plan = user.subscription_tier || 'trial';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const planDistribution = [
        { name: 'Trial', value: planCounts.trial || 0, color: '#f59e0b' },
        { name: 'Standard', value: planCounts.standard || 0, color: '#3b82f6' },
        { name: 'Premium', value: planCounts.premium || 0, color: '#8b5cf6' },
        { name: 'Ultimate', value: planCounts.ultimate || 0, color: '#fbbf24' }
      ];

      setAnalytics({
        totalUsers,
        totalRevenue,
        activeSubscriptions,
        trialUsers,
        conversionRate,
        recentSignups,
        planDistribution
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Refresh analytics every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-dark-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-dark-200 border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="text-blue-500" />
              {analytics.totalUsers.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              +{analytics.recentSignups.reduce((sum, day) => sum + day.count, 0)} this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription>Monthly Revenue</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="text-green-500" />
              ${analytics.totalRevenue.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              From {analytics.activeSubscriptions} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription>Active Subscriptions</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="text-purple-500" />
              {analytics.activeSubscriptions.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {((analytics.activeSubscriptions / analytics.totalUsers) * 100).toFixed(1)}% of total users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-800">
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="text-gold" />
              {analytics.conversionRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {analytics.trialUsers} trial users remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups Chart */}
        <Card className="bg-dark-200 border-gray-800">
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>Daily user registrations over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.recentSignups}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="count" fill="#fbbf24" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution Chart */}
        <Card className="bg-dark-200 border-gray-800">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Current subscription plan breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {analytics.planDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-gray-300">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
