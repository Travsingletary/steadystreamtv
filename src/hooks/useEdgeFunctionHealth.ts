
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EdgeFunctionHealth {
  name: string;
  status: 'healthy' | 'error' | 'checking';
  lastChecked: Date;
  error?: string;
}

export const useEdgeFunctionHealth = () => {
  const [functions, setFunctions] = useState<EdgeFunctionHealth[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkFunction = async (functionName: string): Promise<EdgeFunctionHealth> => {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true }
      });

      if (error) {
        return {
          name: functionName,
          status: 'error',
          lastChecked: new Date(),
          error: error.message
        };
      }

      return {
        name: functionName,
        status: 'healthy',
        lastChecked: new Date()
      };
    } catch (error: any) {
      return {
        name: functionName,
        status: 'error',
        lastChecked: new Date(),
        error: error.message
      };
    }
  };

  const checkAllFunctions = async () => {
    setIsChecking(true);
    const functionNames = [
      'create-stripe-checkout',
      'stripe-webhook',
      'create-xtream-account',
      'megaott-config-check',
      'megaott-diagnostics'
    ];

    try {
      const results = await Promise.all(
        functionNames.map(name => checkFunction(name))
      );
      setFunctions(results);

      const errorCount = results.filter(f => f.status === 'error').length;
      if (errorCount > 0) {
        toast({
          title: "Edge Function Issues Detected",
          description: `${errorCount} functions are experiencing issues`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking functions:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkAllFunctions();
  }, []);

  return {
    functions,
    isChecking,
    checkAllFunctions,
    checkFunction
  };
};
