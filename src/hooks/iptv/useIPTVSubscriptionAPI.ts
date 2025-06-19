
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IPTVCredentials, IPTVFormData } from '@/types/iptv';
import { iptvPlans } from '@/utils/iptvPlans';

export const useIPTVSubscriptionAPI = () => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<IPTVCredentials | null>(null);

  const checkExistingSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: iptvAccount } = await supabase
          .from('iptv_accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (iptvAccount) {
          setCredentials({
            username: iptvAccount.username,
            password: iptvAccount.password,
            server_url: iptvAccount.server_url,
            playlist_url: iptvAccount.playlist_url,
            max_connections: iptvAccount.package_id,
            expiration_date: iptvAccount.expires_at
          });
          return true;
        }
      }
    } catch (error) {
      console.log('No existing subscription found');
    }
    return false;
  };

  const handleStripeCheckout = async (formData: IPTVFormData) => {
    setLoading(true);

    try {
      const selectedPlan = iptvPlans.find(p => p.id === formData.planType);

      // Handle free trial differently
      if (selectedPlan?.isTrial) {
        console.log('Starting free trial...');
        return { success: true, isTrial: true };
      }

      const { data, error: checkoutError } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          priceId: selectedPlan?.priceId,
          customerEmail: formData.email,
          customerName: formData.name,
          planType: formData.planType,
          metadata: {
            customer_country: formData.country,
            customer_phone: formData.phone
          }
        }
      });

      if (checkoutError) throw new Error(checkoutError.message);

      if (data?.url) {
        window.location.href = data.url;
        return { success: true, url: data.url };
      }

      throw new Error('No checkout URL returned');

    } catch (err: any) {
      throw new Error(err.message || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    credentials,
    setCredentials,
    checkExistingSubscription,
    handleStripeCheckout
  };
};
