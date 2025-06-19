
import { useEffect } from 'react';
import { useIPTVFormState } from './iptv/useIPTVFormState';
import { useIPTVSubscriptionAPI } from './iptv/useIPTVSubscriptionAPI';
import { iptvPlans } from '@/utils/iptvPlans';

export const useIPTVSubscription = () => {
  const {
    currentStep,
    setCurrentStep,
    formData,
    error,
    setError,
    handleInputChange,
    handleNext,
    handleBack
  } = useIPTVFormState();

  const {
    loading,
    credentials,
    setCredentials,
    checkExistingSubscription,
    handleStripeCheckout: apiHandleStripeCheckout
  } = useIPTVSubscriptionAPI();

  useEffect(() => {
    const checkSubscription = async () => {
      const hasExisting = await checkExistingSubscription();
      if (hasExisting) {
        setCurrentStep(4);
      }
    };
    checkSubscription();
  }, []);

  const handleStripeCheckout = async () => {
    setError('');
    try {
      const result = await apiHandleStripeCheckout(formData);
      if (result.isTrial) {
        setCurrentStep(4); // Skip to credentials step for demo
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    formData,
    loading,
    credentials,
    error,
    plans: iptvPlans,
    handleInputChange,
    handleNext,
    handleBack,
    handleStripeCheckout
  };
};
