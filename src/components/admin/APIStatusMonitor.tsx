
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface APIStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'checking';
  lastChecked: string;
  responseTime?: number;
  error?: string;
}

export const APIStatusMonitor: React.FC = () => {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([]);
  const [checking, setChecking] = useState(false);

  const checkAPIStatus = async () => {
    setChecking(true);
    const newStatuses: APIStatus[] = [];

    // Test MegaOTT Proxy
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('megaott-proxy', {
        body: { action: 'user_info' }
      });
      const responseTime = Date.now() - startTime;

      newStatuses.push({
        id: 'megaott-proxy',
        name: 'MegaOTT Proxy',
        status: error || !data?.success ? 'offline' : 'online',
        lastChecked: new Date().toISOString(),
        responseTime: error ? undefined : responseTime,
        error: error?.message || (!data?.success ? data?.error : undefined)
      });
    } catch (error: any) {
      newStatuses.push({
        id: 'megaott-proxy',
        name: 'MegaOTT Proxy',
        status: 'offline',
        lastChecked: new Date().toISOString(),
        error: error.message
      });
    }

    // Test Supabase Database
    try {
      const startTime = Date.now();
      const { error } = await supabase.from('profiles').select('count').limit(1);
      const responseTime = Date.now() - startTime;

      newStatuses.push({
        id: 'supabase-db',
        name: 'Supabase Database',
        status: error ? 'offline' : 'online',
        lastChecked: new Date().toISOString(),
        responseTime: error ? undefined : responseTime,
        error: error?.message
      });
    } catch (error: any) {
      newStatuses.push({
        id: 'supabase-db',
        name: 'Supabase Database',
        status: 'offline',
        lastChecked: new Date().toISOString(),
        error: error.message
      });
    }

    setApiStatuses(newStatuses);
    setChecking(false);
  };

  useEffect(() => {
    checkAPIStatus();
    // Check every 5 minutes
    const interval = setInterval(checkAPIStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-600';
      case 'offline':
        return 'bg-red-600';
      case 'checking':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  const onlineCount = apiStatuses.filter(api => api.status === 'online').length;
  const totalCount = apiStatuses.length;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            {onlineCount === totalCount ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            API Status Monitor
            <Badge variant={onlineCount === totalCount ? "default" : "destructive"}>
              {onlineCount}/{totalCount} Online
            </Badge>
          </CardTitle>
          <Button 
            onClick={checkAPIStatus}
            disabled={checking}
            size="sm"
            variant="outline"
            className="border-gray-600"
          >
            {checking ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {apiStatuses.map((api) => (
          <div key={api.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(api.status)}
              <div>
                <h4 className="text-white font-medium">{api.name}</h4>
                <p className="text-sm text-gray-400">
                  Last checked: {new Date(api.lastChecked).toLocaleTimeString()}
                  {api.responseTime && ` • ${api.responseTime}ms`}
                </p>
                {api.error && (
                  <p className="text-xs text-red-400 mt-1">{api.error}</p>
                )}
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(api.status)} text-white border-0`}
            >
              {api.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
