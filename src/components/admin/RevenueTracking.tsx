
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  totalTransactions: number;
  activeSubscriptions: number;
  averageOrderValue: number;
}

interface RevenueTrackingProps {
  onStatsUpdate: (stats: any) => void;
}

export const RevenueTracking = ({ onStatsUpdate }: RevenueTrackingProps) => {
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    totalTransactions: 0,
    activeSubscriptions: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);

      // Since there's no payments table in the schema, we'll calculate from subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subscriptionsError) throw subscriptionsError;

      // Define plan pricing
      const planPricing = {
        trial: 0,
        standard: 29.99,
        premium: 49.99,
        ultimate: 79.99,
      };

      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Calculate metrics
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let weeklyRevenue = 0;
      let activeCount = 0;

      subscriptions?.forEach(sub => {
        const startDate = new Date(sub.start_date);
        const endDate = new Date(sub.end_date);
        const price = planPricing[sub.plan as keyof typeof planPricing] || 0;

        // Only count paid plans
        if (price > 0) {
          totalRevenue += price;

          if (startDate >= oneMonthAgo) {
            monthlyRevenue += price;
          }

          if (startDate >= oneWeekAgo) {
            weeklyRevenue += price;
          }

          // Count as active if end date is in the future
          if (endDate > now) {
            activeCount++;
          }
        }
      });

      const totalTransactions = subscriptions?.filter(sub => 
        planPricing[sub.plan as keyof typeof planPricing] > 0
      ).length || 0;

      const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      const calculatedMetrics: RevenueMetrics = {
        totalRevenue,
        monthlyRevenue,
        weeklyRevenue,
        totalTransactions,
        activeSubscriptions: activeCount,
        averageOrderValue,
      };

      setMetrics(calculatedMetrics);
      onStatsUpdate({ 
        totalRevenue: totalRevenue,
        monthlyRevenue: monthlyRevenue 
      });

    } catch (error: any) {
      console.error('Error fetching revenue data:', error);
      toast({
        title: "Error",
        description: "Failed to load revenue data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-dark-200 border-gray-800">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-white">Loading revenue data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Tracking
        </CardTitle>
        <CardDescription className="text-gray-400">
          Monitor subscription revenue and financial metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Revenue */}
          <div className="bg-dark-300 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">
                  ${metrics.totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-dark-300 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${metrics.monthlyRevenue.toFixed(2)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          {/* Weekly Revenue */}
          <div className="bg-dark-300 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Week</p>
                <p className="text-2xl font-bold text-purple-400">
                  ${metrics.weeklyRevenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          {/* Total Transactions */}
          <div className="bg-dark-300 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {metrics.totalTransactions}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-dark-300 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-green-400">
                  {metrics.activeSubscriptions}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-dark-300 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Order Value</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${metrics.averageOrderValue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="mt-8 bg-dark-300 p-6 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">Revenue Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-400 mb-2">Quick Stats</h5>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• MRR (Monthly Recurring): ${(metrics.activeSubscriptions * metrics.averageOrderValue).toFixed(2)}</li>
                <li>• Conversion Rate: {metrics.totalTransactions > 0 ? ((metrics.totalTransactions / metrics.totalTransactions) * 100).toFixed(1) : 0}%</li>
                <li>• Revenue Growth: +{metrics.monthlyRevenue > 0 ? ((metrics.weeklyRevenue / metrics.monthlyRevenue) * 100).toFixed(1) : 0}% this week</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-400 mb-2">Plan Distribution</h5>
              <div className="text-sm text-gray-300">
                <p>Based on subscription data from your database</p>
                <p className="text-xs text-gray-400 mt-1">Revenue calculated from plan pricing</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
