
import React, { useState } from 'react';
import { AutomationForm } from './AutomationForm';
import { ProductionAutomationService } from '../services/ProductionAutomationService';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export const AutomationModal: React.FC<AutomationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Production Stripe checkout URLs
  const stripeCheckoutUrls = {
    'basic': 'https://buy.stripe.com/dRmfZj1OzbPk7UU9H1dby01',
    'duo': 'https://buy.stripe.com/5kQ5kFdxh7z4fnm1avdby02', 
    'family': 'https://buy.stripe.com/3cI9AVctd8D8eji4mHdby00'
  };

  const handleSubmit = async (formData: {
    name: string;
    email: string;
    password: string;
    plan: string;
  }) => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Route based on plan selection
    if (formData.plan !== 'trial') {
      // PAID PLANS: Store data and redirect to Stripe
      const userDataForPayment = {
        name: formData.name,
        email: formData.email,
        plan: formData.plan,
        timestamp: Date.now()
      };
      
      localStorage.setItem('pendingUserData', JSON.stringify(userDataForPayment));
      sessionStorage.setItem('pendingUserData', JSON.stringify(userDataForPayment));
      
      console.log('💳 Redirecting to Stripe for plan:', formData.plan);
      window.location.href = stripeCheckoutUrls[formData.plan as keyof typeof stripeCheckoutUrls];
      return;
    }

    // TRIAL PLAN: Execute production automation
    setLoading(true);
    setError('');

    console.log('🎯 Processing trial signup...');
    const result = await ProductionAutomationService.registerUser(formData);

    if (result.success) {
      console.log('✅ Trial signup successful');
      onSuccess({
        user: result.user,
        activationCode: result.activationCode,
        playlistUrl: result.playlistUrl,
        userData: formData,
        megaottSubscription: result.megaottSubscription
      });
      onClose();
    } else {
      console.error('❌ Trial signup failed:', result.error);
      setError(result.error);
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-md w-full bg-gray-800 rounded-xl p-8 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
          aria-label="Close dialog"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          🚀 Start Your Streaming Journey
        </h2>
        
        <AutomationForm 
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>✅ No credit card required for trial</p>
          <p>✅ Instant activation in 60 seconds</p>
          <p>✅ Full access to premium features</p>
        </div>
      </div>
    </div>
  );
};
