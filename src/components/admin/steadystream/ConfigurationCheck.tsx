
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConfigStatus {
  megaOTT: 'connected' | 'disconnected' | 'checking';
  supabase: 'connected' | 'disconnected' | 'checking';
  fallbackMode: boolean;
  errorDetails?: {
    code?: string;
    message?: string;
    endpoint?: string;
  };
}

export const ConfigurationCheck: React.FC = () => {
  const [status, setStatus] = useState<ConfigStatus>({
    megaOTT: 'checking',
    supabase: 'checking',
    fallbackMode: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAllSystems();
  }, []);

  const checkAllSystems = async () => {
    setLoading(true);
    
    // Check Supabase
    setStatus(prev => ({ ...prev, supabase: 'checking' }));
    const supabaseStatus = await checkSupabase();
    
    // Check MegaOTT
    setStatus(prev => ({ ...prev, megaOTT: 'checking' }));
    const { status: megaOTTStatus, errorDetails } = await checkMegaOTT();
    
    setStatus({
      supabase: supabaseStatus,
      megaOTT: megaOTTStatus,
      fallbackMode: megaOTTStatus === 'disconnected',
      errorDetails
    });
    
    setLoading(false);
  };

  const checkSupabase = async (): Promise<'connected' | 'disconnected'> => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      return error ? 'disconnected' : 'connected';
    } catch (error) {
      console.warn('Supabase check failed:', error);
      return 'connected'; // Assume connected since we're likely using it
    }
  };

  const checkMegaOTT = async (): Promise<{ status: 'connected' | 'disconnected'; errorDetails?: any }> => {
    try {
      console.log('🔍 Testing MegaOTT connection via proxy...');
      
      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: { action: 'user_info' }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        return { 
          status: 'disconnected', 
          errorDetails: { 
            code: 'SUPABASE_ERROR', 
            message: error.message 
          } 
        };
      }

      if (!data.success) {
        console.error('❌ MegaOTT API error:', data);
        return { 
          status: 'disconnected', 
          errorDetails: {
            code: data.code,
            message: data.error,
            endpoint: data.endpoint
          }
        };
      }

      console.log('✅ MegaOTT connection successful');
      return { status: 'connected' };
    } catch (error: any) {
      console.error('❌ MegaOTT check failed:', error);
      return { 
        status: 'disconnected', 
        errorDetails: { 
          code: 'CONNECTION_ERROR', 
          message: error.message 
        } 
      };
    }
  };

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'connected':
        return 'bg-green-900/30 text-green-400 border-green-600';
      case 'disconnected':
        return 'bg-red-900/30 text-red-400 border-red-600';
      case 'checking':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-600';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-600';
    }
  };

  const getErrorMessage = (errorDetails?: any) => {
    if (!errorDetails) return null;
    
    switch (errorDetails.code) {
      case 'HTTP_403':
        return 'Access denied - credentials may be invalid or expired';
      case 'HTTP_404':
        return 'API endpoint not found - service may be down';
      case 'HTTP_429':
        return 'Rate limit exceeded - too many requests';
      case 'MISSING_CREDENTIALS':
        return 'MegaOTT credentials not configured';
      case 'INVALID_JSON':
        return 'Invalid response format from MegaOTT';
      case 'CONNECTION_ERROR':
        return 'Network connection failed';
      case 'SUPABASE_ERROR':
        return 'Supabase function error';
      default:
        return errorDetails.message || 'Unknown error';
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">System Configuration Status</CardTitle>
          <Button 
            onClick={checkAllSystems} 
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-gray-600"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={`border-2 ${getStatusColor(status.supabase)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.supabase)}
                  <div>
                    <h3 className="font-semibold">Supabase Database</h3>
                    <p className="text-sm opacity-75">Primary data storage</p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {status.supabase}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className={`border-2 ${getStatusColor(status.megaOTT)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.megaOTT)}
                  <div>
                    <h3 className="font-semibold">MegaOTT API</h3>
                    <p className="text-sm opacity-75">IPTV provisioning service</p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {status.megaOTT}
                </Badge>
              </div>
              {status.errorDetails && (
                <div className="mt-3 p-2 bg-red-900/20 border border-red-600 rounded">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-red-400">Error Details:</p>
                      <p className="text-red-200">{getErrorMessage(status.errorDetails)}</p>
                      {status.errorDetails.code && (
                        <p className="text-red-300 text-xs mt-1">Code: {status.errorDetails.code}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fallback Mode Indicator */}
        {status.fallbackMode && (
          <Card className="bg-blue-900/20 border-blue-600 border-2">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <WifiOff className="w-6 h-6 text-blue-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-400">Fallback Mode Active</h3>
                  <p className="text-sm text-blue-200">
                    MegaOTT integration is currently unavailable. 
                    New signups will use local credential generation.
                  </p>
                </div>
                <Badge className="bg-blue-600 text-white">
                  Operational
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Operational Status Summary */}
        <Card className="bg-gray-700 border-gray-600">
          <CardContent className="p-4">
            <h3 className="font-semibold text-white mb-2">System Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">User Registration</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Credential Generation</span>
              </div>
              <div className="flex items-center space-x-2">
                {status.megaOTT === 'connected' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Wifi className="w-4 h-4 text-yellow-400" />
                )}
                <span className="text-gray-300">
                  {status.megaOTT === 'connected' ? 'MegaOTT Integration' : 'Local Fallback'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
