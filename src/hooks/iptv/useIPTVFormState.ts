
import { useState } from 'react';
import { IPTVFormData } from '@/types/iptv';

export const useIPTVFormState = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<IPTVFormData>({
    name: '', email: '', country: '', phone: '', planType: ''
  });
  const [error, setError] = useState('');

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

  return {
    currentStep,
    setCurrentStep,
    formData,
    error,
    setError,
    handleInputChange,
    handleNext,
    handleBack
  };
};
