
import { useState } from 'react';
import { CorrectedSteadyStreamAutomation } from '@/services/correctedMegaOTTService';

interface UserData {
  name: string;
  email: string;
  password: string;
  plan: string;
  allowAdult?: boolean;
}

interface AutomationResult {
  success: boolean;
  activationCode?: string;
  credentials?: any;
  playlistUrl?: string;
  smartTvUrl?: string;
  expiryDate?: Date;
  megaottId?: string;
  source?: string;
  message?: string;
  error?: string;
  fallback?: {
    activationCode: string;
    message: string;
  };
}

export const useCorrectedAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutomationResult | null>(null);

  const executeAutomation = async (userData: UserData): Promise<AutomationResult> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🎯 Executing corrected MegaOTT automation for:', userData.email);
      
      const automationResult = await CorrectedSteadyStreamAutomation.processCompleteSignup(userData);
      
      setResult(automationResult);
      
      if (!automationResult.success) {
        setError(automationResult.error || 'Unknown error occurred');
      }
      
      return automationResult;
    } catch (err: any) {
      const errorMessage = err.message || 'Automation failed';
      setError(errorMessage);
      console.error('💥 Corrected automation hook error:', err);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setResult(null);
    setLoading(false);
  };

  return {
    loading,
    error,
    result,
    executeAutomation,
    reset
  };
};
