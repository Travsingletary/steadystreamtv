
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IPTVFormData, IPTVCredentials, IPTVPlan } from '@/types/iptv';

export const useIPTVSubscription = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<IPTVFormData>({
    name: '', email: '', country: '', phone: '', planType: ''
  });
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<IPTVCredentials | null>(null);
  const [error, setError] = useState('');

  const plans: IPTVPlan[] = [
    {
      id: 'free-trial',
      name: 'Free Trial',
      price: 'FREE',
      priceId: 'free_trial',
      features: ['24-Hour Full Access', '1000+ Channels', 'HD Quality', '1 Connection'],
      packageId: 0,
      isTrial: true
    },
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '$9.99',
      priceId: 'price_1234567890',
      features: ['1000+ Channels', 'HD Quality', '1 Connection', 'Basic Support'],
      packageId: 1
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: '$19.99',
      priceId: 'price_1234567891',
      features: ['2500+ Channels', 'HD & 4K Quality', '2 Connections', 'VOD Library'],
      packageId: 2,
      popular: true
    },
    {
      id: 'ultimate',
      name: 'Ultimate Plan',
      price: '$29.99',
      priceId: 'price_1234567892',
      features: ['5000+ Channels', 'HD & 4K Quality', '3 Connections', 'Adult Content'],
      packageId: 3
    }
  ];

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
          setCurrentStep(4);
        }
      }
    } catch (error) {
      console.log('No existing subscription found');
    }
  };

  useEffect(() => {
    checkExistingSubscription();
  }, []);

  const handleInputChange = (field: keyof IPTVFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email) {
        setError('Please fill in all required fields');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.planType) {
        setError('Please select a subscription plan');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
    setError('');
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const selectedPlan = plans.find(p => p.id === formData.planType);

      // Handle free trial differently
      if (selectedPlan?.isTrial) {
        // For free trial, redirect to onboarding or create trial account
        // You might want to implement trial account creation here
        console.log('Starting free trial...');
        setCurrentStep(4); // Skip to credentials step for demo
        return;
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

      window.location.href = data.url;

    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    formData,
    loading,
    credentials,
    error,
    plans,
    handleInputChange,
    handleNext,
    handleBack,
    handleStripeCheckout
  };
};
