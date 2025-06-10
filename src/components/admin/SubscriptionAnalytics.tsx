
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  start_date: string;
  end_date: string;
}

interface SubscriptionAnalyticsProps {
  onStatsUpdate: (stats: any) => void;
}

export const SubscriptionAnalytics = ({ onStatsUpdate }: SubscriptionAnalyticsProps) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      setSubscriptions(data || []);
      
      // Calculate active subscriptions
      const now = new Date().toISOString();
      const activeCount = data?.filter(sub => sub.end_date > now).length || 0;
      
      onStatsUpdate({ activeSubscriptions: activeCount });
      
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isActive = (endDate: string) => {
    return new Date(endDate) > new Date();
  };

  const getStatusBadge = (endDate: string) => {
    const active = isActive(endDate);
    return (
      <Badge className={`${active ? 'bg-green-500' : 'bg-red-500'} text-white`}>
        {active ? (
          <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
        ) : (
          <><XCircle className="h-3 w-3 mr-1" /> Expired</>
        )}
      </Badge>
    );
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'trial':
        return 'bg-yellow-500';
      case 'standard':
        return 'bg-blue-500';
      case 'premium':
        return 'bg-purple-500';
      case 'ultimate':
        return 'bg-gold';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card className="bg-dark-200 border-gray-800">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-white">Loading subscriptions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Subscription Analytics
        </CardTitle>
        <CardDescription className="text-gray-400">
          Monitor active and expired subscriptions across all plans
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
                <TableHead className="text-gray-300">Start Date</TableHead>
                <TableHead className="text-gray-300">End Date</TableHead>
                <TableHead className="text-gray-300">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => {
                const startDate = new Date(subscription.start_date);
                const endDate = new Date(subscription.end_date);
                const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <TableRow key={subscription.id} className="border-gray-700">
                    <TableCell className="text-white font-mono">
                      {subscription.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPlanBadgeColor(subscription.plan)} text-white`}>
                        {subscription.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscription.end_date)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {startDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {endDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {durationDays} days
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {subscriptions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No subscriptions found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
