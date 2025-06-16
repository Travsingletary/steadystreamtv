
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, RefreshCw, TrendingUp, Clock } from 'lucide-react';

interface CreditData {
  id: string;
  amount: number;
  last_updated: string;
  created_at: string;
}

export const MegaOTTCredits = () => {
  const [credits, setCredits] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reseller } = await supabase
        .from('resellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!reseller) return;

      const { data, error } = await supabase
        .from('megaott_credits')
        .select('*')
        .eq('reseller_id', reseller.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setCredits(data);
    } catch (error: any) {
      console.error('Error loading credits:', error);
      toast({
        title: "Error",
        description: "Failed to load credits data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshCredits = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: reseller } = await supabase
        .from('resellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!reseller) throw new Error('Reseller profile not found');

      const { data, error } = await supabase.functions.invoke('megaott-sync', {
        body: { 
          reseller_id: reseller.id,
          sync_type: 'credits' 
        }
      });

      if (error) throw error;

      await loadCredits();

      toast({
        title: "Credits Refreshed",
        description: "Credits data has been updated from MegaOTT",
      });

    } catch (error: any) {
      console.error('Error refreshing credits:', error);
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh credits",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCreditStatus = (amount: number) => {
    if (amount > 100) return { color: 'bg-green-500', text: 'High' };
    if (amount > 20) return { color: 'bg-yellow-500', text: 'Medium' };
    return { color: 'bg-red-500', text: 'Low' };
  };

  if (loading) {
    return (
      <Card className="bg-dark-200 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Loading credits...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="text-gold" />
              MegaOTT Credits
            </CardTitle>
            <CardDescription>
              Current credit balance and usage information
            </CardDescription>
          </div>
          <Button
            onClick={refreshCredits}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-gray-600"
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {credits ? (
          <div className="space-y-6">
            {/* Current Balance */}
            <div className="bg-dark-300 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gold">
                    {credits.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Available Credits
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    className={`${getCreditStatus(credits.amount).color} text-white`}
                  >
                    {getCreditStatus(credits.amount).text}
                  </Badge>
                  <div className="text-xs text-gray-400 mt-2">
                    Balance Status
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-dark-300 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">Last Updated</span>
                </div>
                <div className="text-sm text-gray-300">
                  {formatDate(credits.last_updated)}
                </div>
              </div>

              <div className="bg-dark-300 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">Account Created</span>
                </div>
                <div className="text-sm text-gray-300">
                  {formatDate(credits.created_at)}
                </div>
              </div>
            </div>

            {/* Credit Alerts */}
            {credits.amount < 20 && (
              <div className="bg-red-900/20 border border-red-800 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-red-400" />
                  <span className="font-medium text-red-400">Low Credit Alert</span>
                </div>
                <p className="text-sm text-red-300 mt-1">
                  Your credit balance is running low. Consider topping up to avoid service interruption.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Credits Data</h3>
            <p className="text-sm text-gray-400 mb-4">
              Credits data hasn't been synced yet. Click refresh to fetch the latest information.
            </p>
            <Button
              onClick={refreshCredits}
              disabled={refreshing}
              className="bg-gold hover:bg-gold-dark text-black"
            >
              {refreshing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Credits
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
