
import React from 'react';
import { useIPTVSubscription } from '@/hooks/useIPTVSubscription';
import { IPTVProgressIndicator } from '@/components/iptv/IPTVProgressIndicator';
import { IPTVUserDetailsForm } from '@/components/iptv/IPTVUserDetailsForm';
import { IPTVPlanSelection } from '@/components/iptv/IPTVPlanSelection';
import { IPTVPaymentConfirmation } from '@/components/iptv/IPTVPaymentConfirmation';
import { IPTVCredentialsDisplay } from '@/components/iptv/IPTVCredentialsDisplay';

interface EnhancedIPTVSubscriptionProps {
  onComplete?: () => void;
}

const EnhancedIPTVSubscription = ({ onComplete }: EnhancedIPTVSubscriptionProps) => {
  const {
    currentStep,
    formData,
    loading,
    credentials,
    error,
    plans,
    handleInputChange,
    handleNext,
    handleBack,
    handleStripeCheckout
  } = useIPTVSubscription();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <IPTVUserDetailsForm
            formData={formData}
            error={error}
            onInputChange={handleInputChange}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <IPTVPlanSelection
            formData={formData}
            plans={plans}
            error={error}
            onInputChange={handleInputChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <IPTVPaymentConfirmation
            formData={formData}
            plans={plans}
            loading={loading}
            error={error}
            onBack={handleBack}
            onStripeCheckout={handleStripeCheckout}
          />
        );
      case 4:
        return <IPTVCredentialsDisplay credentials={credentials} />;
      default:
        return null;
    }
  };

  return (
    <div className="py-12">
      <IPTVProgressIndicator currentStep={currentStep} />
      <div className="flex justify-center">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default EnhancedIPTVSubscription;
