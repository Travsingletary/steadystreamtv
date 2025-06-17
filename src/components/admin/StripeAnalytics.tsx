
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, DollarSign, Users, TrendingUp } from "lucide-react";

interface StripeSubscription {
  id: string;
  stripe_subscription_id: string;
  user_id: string;
  plan_name: string;
  status: string;
  amount: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

interface StripeAnalyticsData {
  totalRevenue: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  averageRevenuePerUser: number;
  recentSubscriptions: StripeSubscription[];
}

export const StripeAnalytics = () => {
  const [analytics, setAnalytics] = useState<StripeAnalyticsData>({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalSubscriptions: 0,
    averageRevenuePerUser: 0,
    recentSubscriptions: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStripeAnalytics();
  }, []);

  const fetchStripeAnalytics = async () => {
    try {
      setLoading(true);

      // Get all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Get payments data
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, currency, status')
        .eq('status', 'succeeded');

      if (paymentsError) throw paymentsError;

      // Calculate analytics
      const activeSubscriptions = subscriptions?.filter(sub => sub.status === 'active').length || 0;
      const totalSubscriptions = subscriptions?.length || 0;
      const totalRevenue = payments?.reduce((sum, payment) => sum + (payment.amount / 100), 0) || 0;
      const averageRevenuePerUser = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

      setAnalytics({
        totalRevenue,
        activeSubscriptions,
        totalSubscriptions,
        averageRevenuePerUser,
        recentSubscriptions: subscriptions?.slice(0, 10) || []
      });

    } catch (error: any) {
      console.error('Error fetching Stripe analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load Stripe analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'bg-green-500',
      canceled: 'bg-red-500',
      past_due: 'bg-yellow-500',
      incomplete: 'bg-gray-500'
    };

    return (
      <Badge className={`${colorMap[status] || 'bg-gray-500'} text-white`}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="bg-dark-200 border-gray-800">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-white">Loading Stripe analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-dark-200 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${analytics.totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-white">
                  {analytics.activeSubscriptions}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Subscriptions</p>
                <p className="text-2xl font-bold text-white">
                  {analytics.totalSubscriptions}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Revenue/User</p>
                <p className="text-2xl font-bold text-white">
                  ${analytics.averageRevenuePerUser.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-gold" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions Table */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Subscriptions</CardTitle>
          <CardDescription className="text-gray-400">
            Latest subscription activity from Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">User ID</TableHead>
                  <TableHead className="text-gray-300">Plan</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Period End</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recentSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id} className="border-gray-700">
                    <TableCell className="text-white font-mono">
                      {subscription.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <Badge className="bg-blue-500 text-white">
                        {subscription.plan_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscription.status)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      ${(subscription.amount / 100).toFixed(2)} {subscription.currency.toUpperCase()}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(subscription.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {analytics.recentSubscriptions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No subscriptions found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
