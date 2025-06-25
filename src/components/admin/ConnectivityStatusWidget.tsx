
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { MegaOTTConnectivityManager } from '@/services/megaOTTConnectivityManager';
import { EnhancedMegaOTTService } from '@/services/enhancedMegaOTTService';

export const ConnectivityStatusWidget: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const checkConnectivity = async () => {
    setLoading(true);
    try {
      // Test best endpoint
      await MegaOTTConnectivityManager.getBestEndpoint();
      
      // Get comprehensive status
      const connectivityStatus = MegaOTTConnectivityManager.getConnectivityStatus();
      const serviceStatus = EnhancedMegaOTTService.getServiceStatus();
      
      setStatus({
        ...connectivityStatus,
        ...serviceStatus
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Connectivity check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnectivity();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(checkConnectivity, 120000);
    return () => clearInterval(interval);
  }, []);

  const getOverallStatusColor = () => {
    if (!status) return 'bg-gray-600';
    if (status.overall === 'connected' && status.onlineCount > 0) return 'bg-green-600';
    if (status.onlineCount > 0) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getEndpointStatusIcon = (endpointStatus: string) => {
    switch (endpointStatus) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'slow': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-red-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            {status?.overall === 'connected' ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            Enhanced Connectivity Status
            <Badge className={`${getOverallStatusColor()} text-white border-0`}>
              {status ? `${status.onlineCount}/${status.totalCount} Online` : 'Checking...'}
            </Badge>
          </CardTitle>
          <Button 
            onClick={checkConnectivity}
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
        {/* User Location Info */}
        {status?.userLocation && (
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium">Detected Location</span>
            </div>
            <div className="text-sm text-gray-300">
              <p>Region: {status.userLocation.region || 'Unknown'}</p>
              <p>Timezone: {status.userLocation.timezone || 'Unknown'}</p>
            </div>
          </div>
        )}

        {/* Endpoint Health */}
        {status?.endpoints && status.endpoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-white font-medium">Endpoint Health</h4>
            {status.endpoints.map((endpoint: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <div className="flex items-center space-x-2">
                  {getEndpointStatusIcon(endpoint.status)}
                  <div>
                    <p className="text-white text-sm">{endpoint.region} endpoint</p>
                    <p className="text-xs text-gray-400">{endpoint.url}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="outline" 
                    className={`${
                      endpoint.status === 'online' ? 'border-green-500 text-green-400' :
                      endpoint.status === 'slow' ? 'border-yellow-500 text-yellow-400' :
                      'border-red-500 text-red-400'
                    }`}
                  >
                    {endpoint.status}
                  </Badge>
                  {endpoint.responseTime && (
                    <p className="text-xs text-gray-400 mt-1">{endpoint.responseTime}ms</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Service Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <h4 className="text-white font-medium mb-2">Cache Status</h4>
            <p className="text-2xl font-bold text-blue-400">{status?.cacheSize || 0}</p>
            <p className="text-xs text-gray-400">Cached responses</p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <h4 className="text-white font-medium mb-2">Queue Status</h4>
            <p className="text-2xl font-bold text-purple-400">{status?.queuedOperations || 0}</p>
            <p className="text-xs text-gray-400">Pending operations</p>
          </div>
        </div>

        {/* Enhanced Features Notice */}
        {status?.enhanced && (
          <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">Enhanced Connectivity Active</span>
            </div>
            <p className="text-sm text-blue-200 mt-1">
              Intelligent fallbacks, regional optimization, and smart caching are enabled.
            </p>
          </div>
        )}

        {/* Offline Mode Warning */}
        {status?.offlineMode && (
          <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-medium">Offline Mode Active</span>
            </div>
            <p className="text-sm text-orange-200 mt-1">
              System is running in degraded mode. Operations are being queued for retry.
            </p>
          </div>
        )}

        {/* Last Update */}
        <div className="text-xs text-gray-400 text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};
