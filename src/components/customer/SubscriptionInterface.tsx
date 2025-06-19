
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Calendar, Download, Settings, RefreshCw } from "lucide-react";

interface Subscription {
  plan: string;
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

interface BillingInfo {
  last_payment?: string;
  next_payment?: string;
  payment_method?: string;
}

export const SubscriptionInterface: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setSubscription({
        plan: profile.subscription_tier || 'trial',
        status: profile.subscription_status || 'active',
        current_period_end: profile.subscription_end_date,
        cancel_at_period_end: false
      });

      // Mock billing info (in real app, this would come from Stripe)
      setBillingInfo({
        last_payment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_payment: profile.subscription_end_date,
        payment_method: '**** **** **** 4242'
      });

    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newPlan: string) => {
    try {
      setActionLoading(true);
      
      // Call payment function (this would redirect to Stripe)
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          planId: newPlan,
          isUpgrade: true
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }

    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: "Error",
        description: "Failed to process upgrade",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      setActionLoading(true);
      
      // In a real implementation, this would call Stripe to cancel the subscription
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You can continue using the service until the end of your billing period.",
      });

      fetchSubscriptionData();

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const generatePlaylist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const token = btoa(JSON.stringify({
        userId: user.id,
        plan: subscription?.plan || 'trial',
        createdAt: Date.now()
      }));

      const playlistUrl = `${window.location.origin}/api/playlist/${token}.m3u8`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = playlistUrl;
      link.download = 'steadystream.m3u8';
      link.click();

      toast({
        title: "Playlist Generated",
        description: "Your playlist has been downloaded successfully",
      });

    } catch (error) {
      console.error('Error generating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to generate playlist",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const planDetails = {
    trial: { name: 'Free Trial', price: 0, features: ['Limited channels', '24 hours access'] },
    standard: { name: 'Standard', price: 20, features: ['All channels', '2 devices', 'HD quality'] },
    premium: { name: 'Premium', price: 35, features: ['All channels', '4 devices', 'Full HD quality', 'DVR'] },
    ultimate: { name: 'Ultimate', price: 45, features: ['All channels', '6 devices', '4K quality', 'Premium sports'] }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'trial': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-dark-200 h-32 rounded-lg mb-6"></div>
          <div className="bg-dark-200 h-48 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const currentPlan = planDetails[subscription?.plan as keyof typeof planDetails] || planDetails.trial;

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="text-gold" />
                Current Subscription
              </CardTitle>
              <CardDescription>Manage your SteadyStream TV subscription</CardDescription>
            </div>
            <Button 
              onClick={fetchSubscriptionData} 
              variant="outline" 
              size="sm"
              className="border-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{currentPlan.name}</h3>
              <p className="text-2xl font-bold text-gold">${currentPlan.price}/month</p>
            </div>
            <Badge className={`${getStatusColor(subscription?.status || 'trial')} text-white`}>
              {subscription?.status || 'trial'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Next billing date</p>
              <p className="text-white">
                {subscription?.current_period_end 
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Payment method</p>
              <p className="text-white">{billingInfo.payment_method || 'Not set'}</p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={generatePlaylist} className="bg-gold hover:bg-gold-dark text-black">
              <Download className="h-4 w-4 mr-2" />
              Download Playlist
            </Button>
            {subscription?.status === 'active' && (
              <Button 
                onClick={handleCancelSubscription}
                variant="outline"
                className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                disabled={actionLoading}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Upgrade or change your subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(planDetails).filter(([key]) => key !== 'trial').map(([key, plan]) => (
              <Card 
                key={key} 
                className={`bg-dark-300 border-gray-700 ${
                  subscription?.plan === key ? 'ring-2 ring-gold' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold text-gold">${plan.price}/month</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-center">
                        <span className="w-2 h-2 bg-gold rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {subscription?.plan !== key ? (
                    <Button 
                      onClick={() => handleUpgrade(key)}
                      className="w-full bg-gold hover:bg-gold-dark text-black"
                      disabled={actionLoading}
                    >
                      {subscription?.plan === 'trial' ? 'Subscribe' : 'Upgrade'}
                    </Button>
                  ) : (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
