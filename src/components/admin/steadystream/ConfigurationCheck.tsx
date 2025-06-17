
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, RefreshCw, Settings } from 'lucide-react';

export const ConfigurationCheck = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const { toast } = useToast();

  const checkConfiguration = async () => {
    try {
      setLoading(true);
      console.log('🔧 Checking MegaOTT configuration...');

      const { data, error } = await supabase.functions.invoke('megaott-config-check');

      if (error) {
        console.error('❌ Config check error:', error);
        throw error;
      }

      console.log('✅ Config check result:', data);
      setConfig(data);

      toast({
        title: "Configuration Check Complete",
        description: "MegaOTT configuration status has been updated",
      });

    } catch (error: any) {
      console.error('❌ Failed to check configuration:', error);
      toast({
        title: "Configuration Check Failed",
        description: error.message || "Unable to check MegaOTT configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (configured: boolean) => {
    return configured ? (
      <Badge className="bg-green-500 text-white">
        <CheckCircle className="h-3 w-3 mr-1" />
        Configured
      </Badge>
    ) : (
      <Badge className="bg-red-500 text-white">
        <XCircle className="h-3 w-3 mr-1" />
        Missing
      </Badge>
    );
  };

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="h-5 w-5" />
          MegaOTT Configuration Check
        </CardTitle>
        <CardDescription className="text-gray-400">
          Verify that all required MegaOTT environment variables are configured
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={checkConfiguration}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Check Configuration
        </Button>

        {config && (
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Configuration Status:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-dark-300 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">API Key</span>
                {getStatusBadge(config.api_key_configured)}
              </div>
              
              <div className="bg-dark-300 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">API URL</span>
                {getStatusBadge(config.api_url_configured)}
              </div>
              
              <div className="bg-dark-300 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">Username</span>
                {getStatusBadge(config.username_configured)}
              </div>
              
              <div className="bg-dark-300 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-300">Password</span>
                {getStatusBadge(config.password_configured)}
              </div>
            </div>

            <div className="bg-dark-300 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Summary</h4>
              <p className="text-gray-300 text-sm">
                {Object.values(config).every(Boolean) 
                  ? "✅ All MegaOTT configuration variables are properly set"
                  : "⚠️ Some MegaOTT configuration variables are missing. Please check your Edge Function secrets."
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
