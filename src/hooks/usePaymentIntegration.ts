
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentOptions {
  planId: string;
  userId?: string;
  customerEmail?: string;
  customerName?: string;
  isRecurring?: boolean;
}

export const usePaymentIntegration = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createPayment = async (options: PaymentOptions) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: options
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        return { success: true, checkoutUrl: data.url };
      }

      throw new Error('No checkout URL returned');

    } catch (error: any) {
      console.error('Payment creation failed:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment session",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (options: PaymentOptions) => {
    return createPayment({ ...options, isRecurring: true });
  };

  const createOneTimePayment = async (options: PaymentOptions) => {
    return createPayment({ ...options, isRecurring: false });
  };

  const checkPaymentStatus = async (sessionId: string) => {
    try {
      // In a real implementation, this would call a Stripe webhook or API
      // For now, we'll simulate checking the payment status
      const { data, error } = await supabase
        .from('checkout_sessions')
        .select('status')
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;

      return { success: true, status: data.status };
    } catch (error: any) {
      console.error('Payment status check failed:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    createPayment,
    createSubscription,
    createOneTimePayment,
    checkPaymentStatus,
    loading
  };
};
