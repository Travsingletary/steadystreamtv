
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IPTVCredentials, IPTVFormData } from '@/types/iptv';
import { iptvPlans } from '@/utils/iptvPlans';
import { EnhancedIPTVService } from '@/services/enhancedIPTVService';

export const useIPTVSubscriptionAPI = () => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<IPTVCredentials | null>(null);

  const checkExistingSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const existingCredentials = await EnhancedIPTVService.getUserCredentials(user.id);
        if (existingCredentials) {
          setCredentials({
            username: existingCredentials.username,
            password: existingCredentials.password,
            server_url: existingCredentials.server_url,
            playlist_url: existingCredentials.playlist_url,
            max_connections: existingCredentials.max_connections,
            expiration_date: existingCredentials.expires_at
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

      const result = await EnhancedIPTVService.createStripeCheckout(formData);

      if (result.url) {
        // Open checkout in new tab
        window.open(result.url, '_blank');
        return { success: true, url: result.url };
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
