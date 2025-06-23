
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Wifi, WifiOff, Activity, Clock, Zap } from 'lucide-react';
import { MegaOTTAPIManager } from '@/services/megaOTTAPIManager';

export const APIStatusMonitor: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [apiStatuses, setApiStatuses] = useState<any[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkAllAPIs = async () => {
    setLoading(true);
    try {
      const statuses = await MegaOTTAPIManager.checkAllAPIs();
      setApiStatuses(statuses);
      setLastChecked(new Date());
    } catch (error) {
      console.error('API status check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAllAPIs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-900/30 text-green-400 border-green-600';
      case 'offline':
        return 'bg-red-900/30 text-red-400 border-red-600';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-5 h-5 text-green-400" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            MegaOTT API Status Monitor
          </CardTitle>
          <div className="flex items-center gap-3">
            {lastChecked && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                {lastChecked.toLocaleTimeString()}
              </div>
            )}
            <Button 
              onClick={checkAllAPIs} 
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
              Check Status
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {apiStatuses.map((api, index) => (
            <Card key={api.id} className={`border-2 ${getStatusColor(api.status)}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(api.status)}
                    <div>
                      <h3 className="font-semibold text-sm">{api.name}</h3>
                      <p className="text-xs opacity-75">{api.purpose}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {api.status}
                  </Badge>
                </div>
                
                {api.responseTime && (
                  <div className="text-xs text-gray-400">
                    Response: {api.responseTime}ms
                  </div>
                )}
                
                {api.error && (
                  <div className="text-xs text-red-400 mt-2 truncate">
                    Error: {api.error}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        {apiStatuses.length > 0 && (
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-3">System Status Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {apiStatuses.filter(api => api.status === 'online').length}
                  </div>
                  <div className="text-sm text-gray-400">Online</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">
                    {apiStatuses.filter(api => api.status === 'offline').length}
                  </div>
                  <div className="text-sm text-gray-400">Offline</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {apiStatuses.length}
                  </div>
                  <div className="text-sm text-gray-400">Total APIs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
