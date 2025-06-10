
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";

interface RevenueTrackingProps {
  onStatsUpdate: (stats: any) => void;
}

export const RevenueTracking = ({ onStatsUpdate }: RevenueTrackingProps) => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      
      // Since payments table doesn't exist in the current schema,
      // we'll calculate estimated revenue based on subscriptions
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('plan, start_date, end_date');

      if (error) throw error;

      // Estimate revenue based on plan types
      const planPrices = {
        trial: 0,
        standard: 29.99,
        premium: 49.99,
        ultimate: 79.99
      };

      let totalRevenue = 0;
      let monthlyRevenue = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      subscriptions?.forEach(sub => {
        const price = planPrices[sub.plan as keyof typeof planPrices] || 0;
        totalRevenue += price;
        
        const startDate = new Date(sub.start_date);
        if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
          monthlyRevenue += price;
        }
      });

      const avgTransaction = subscriptions?.length > 0 ? totalRevenue / subscriptions.length : 0;

      const calculatedData = {
        totalRevenue,
        monthlyRevenue,
        totalTransactions: subscriptions?.length || 0,
        averageTransaction: avgTransaction
      };

      setRevenueData(calculatedData);
      onStatsUpdate({ totalRevenue });
      
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
    <div className="space-y-6">
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Tracking
          </CardTitle>
          <CardDescription className="text-gray-400">
            Monitor platform revenue and transaction analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-dark-300 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    ${revenueData.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-gold" />
              </div>
            </div>

            <div className="bg-dark-300 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-white">
                    ${revenueData.monthlyRevenue.toFixed(2)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-dark-300 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Transactions</p>
                  <p className="text-2xl font-bold text-white">
                    {revenueData.totalTransactions}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-dark-300 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Transaction</p>
                  <p className="text-2xl font-bold text-white">
                    ${revenueData.averageTransaction.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-dark-300 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Revenue Breakdown by Plan</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">Trial</p>
                <p className="text-lg font-bold text-yellow-400">$0.00</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Standard</p>
                <p className="text-lg font-bold text-blue-400">$29.99</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Premium</p>
                <p className="text-lg font-bold text-purple-400">$49.99</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Ultimate</p>
                <p className="text-lg font-bold text-gold">$79.99</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
