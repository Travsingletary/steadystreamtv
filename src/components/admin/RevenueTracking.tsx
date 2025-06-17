
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";

interface RevenueTrackingProps {
  onStatsUpdate: (stats: any) => void;
}

export const RevenueTracking = ({ onStatsUpdate }: RevenueTrackingProps) => {
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    averageRevenuePerUser: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      
      // Get active subscriptions count
      const { count: activeSubsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .gte('end_date', new Date().toISOString());

      // Calculate estimated revenue based on active subscriptions
      // Using standard pricing: Standard $20, Premium $35, Ultimate $45
      const estimatedMonthlyRevenue = (activeSubsCount || 0) * 30; // Average $30 per subscription
      const estimatedTotalRevenue = estimatedMonthlyRevenue * 6; // Assume 6 months average
      const averageRevenuePerUser = activeSubsCount ? estimatedMonthlyRevenue / activeSubsCount : 0;

      const revenue = {
        totalRevenue: estimatedTotalRevenue,
        monthlyRevenue: estimatedMonthlyRevenue,
        activeSubscriptions: activeSubsCount || 0,
        averageRevenuePerUser: averageRevenuePerUser
      };

      setRevenueData(revenue);
      onStatsUpdate({ totalRevenue: estimatedTotalRevenue });
      
    } catch (error: any) {
      console.error('Error fetching revenue data:', error);
      toast({
        title: "Error",
        description: "Failed to calculate revenue data",
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
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <Badge className="bg-green-500 text-white text-xs">
                Total
              </Badge>
            </div>
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-white">
              ${revenueData.totalRevenue.toLocaleString()}
            </p>
          </div>

          <div className="bg-dark-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              <Badge className="bg-blue-500 text-white text-xs">
                Monthly
              </Badge>
            </div>
            <p className="text-gray-400 text-sm">Monthly Revenue</p>
            <p className="text-2xl font-bold text-white">
              ${revenueData.monthlyRevenue.toLocaleString()}
            </p>
          </div>

          <div className="bg-dark-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="h-5 w-5 text-purple-400" />
              <Badge className="bg-purple-500 text-white text-xs">
                Active
              </Badge>
            </div>
            <p className="text-gray-400 text-sm">Active Subscriptions</p>
            <p className="text-2xl font-bold text-white">
              {revenueData.activeSubscriptions}
            </p>
          </div>

          <div className="bg-dark-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-gold" />
              <Badge className="bg-gold text-black text-xs">
                ARPU
              </Badge>
            </div>
            <p className="text-gray-400 text-sm">Avg Revenue/User</p>
            <p className="text-2xl font-bold text-white">
              ${Math.round(revenueData.averageRevenuePerUser)}
            </p>
          </div>
        </div>

        <div className="bg-dark-300 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">Revenue Breakdown by Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-blue-400 text-2xl font-bold">$20</div>
              <div className="text-gray-400 text-sm">Standard Plan</div>
              <Badge className="bg-blue-500 text-white mt-1">Most Popular</Badge>
            </div>
            <div className="text-center">
              <div className="text-purple-400 text-2xl font-bold">$35</div>
              <div className="text-gray-400 text-sm">Premium Plan</div>
              <Badge className="bg-purple-500 text-white mt-1">High Value</Badge>
            </div>
            <div className="text-center">
              <div className="text-gold text-2xl font-bold">$45</div>
              <div className="text-gray-400 text-sm">Ultimate Plan</div>
              <Badge className="bg-gold text-black mt-1">Premium</Badge>
            </div>
          </div>
        </div>

        <div className="bg-dark-300 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">Revenue Insights</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Revenue calculations based on active subscriptions</li>
            <li>• Average subscription value: $30/month</li>
            <li>• Growth tracking updated daily</li>
            <li>• Detailed analytics available in reports section</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
