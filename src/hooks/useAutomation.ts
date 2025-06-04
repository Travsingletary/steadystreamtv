
import { useState } from 'react';
import { AutomationService, UserData, AutomationResult } from '@/services/automationService';

export const useAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutomationResult | null>(null);

  const executeAutomation = async (userData: UserData): Promise<AutomationResult> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🎯 Executing automation for:', userData.email);
      
      const automationResult = await AutomationService.registerUser(userData);
      
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
