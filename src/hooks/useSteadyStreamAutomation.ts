
import { useState } from 'react';
import { SteadyStreamAutomationService, SteadyStreamUserData, SteadyStreamResult } from '@/services/steadyStreamAutomationService';

export const useSteadyStreamAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SteadyStreamResult | null>(null);

  const executeAutomation = async (userData: SteadyStreamUserData): Promise<SteadyStreamResult> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🎯 Executing SteadyStream automation for:', userData.email);
      
      const automationResult = await SteadyStreamAutomationService.executeCompleteAutomation(userData);
      
      setResult(automationResult);
      
      if (!automationResult.success) {
        setError(automationResult.error || 'Unknown error occurred');
      }
      
      return automationResult;
    } catch (err: any) {
      const errorMessage = err.message || 'Automation failed';
      setError(errorMessage);
      console.error('💥 Automation hook error:', err);
      
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
