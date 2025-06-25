
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { TokenMonitoringService } from '@/services/tokenMonitoringService';
import { 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp, 
  Package, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface TokenInventory {
  basic: number;
  premium: number;
  vip: number;
}

interface MonitoringStats {
  totalChecks: number;
  totalAlerts: number;
  totalActions: number;
  recentInventory: TokenInventory;
  logs: any[];
}

export const TokenMonitoringDashboard: React.FC = () => {
  const [inventory, setInventory] = useState<TokenInventory>({ basic: 0, premium: 0, vip: 0 });
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const monitoringService = new TokenMonitoringService();

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time subscription for monitoring logs
    const subscription = supabase
      .channel('token_monitoring')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'token_monitoring_logs' },
        () => loadDashboardData()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load current inventory
      const currentInventory = await getCurrentInventory();
      setInventory(currentInventory);

      // Load monitoring stats
      const monitoringStats = await monitoringService.getMonitoringStats(7);
      setStats(monitoringStats);

      // Check for current alerts
      const currentAlerts = await checkCurrentAlerts(currentInventory);
      setAlerts(currentAlerts);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentInventory = async (): Promise<TokenInventory> => {
    const { data, error } = await supabase
      .from('megaott_tokens')
      .select('package_type, status')
      .eq('status', 'available');

    if (error) throw error;

    const inventory = { basic: 0, premium: 0, vip: 0 };
    data?.forEach(token => {
      if (inventory.hasOwnProperty(token.package_type)) {
        inventory[token.package_type]++;
      }
    });

    return inventory;
  };

  const checkCurrentAlerts = async (inventory: TokenInventory) => {
    const thresholds = {
      basic: { low: 10, critical: 5 },
      premium: { low: 8, critical: 3 },
      vip: { low: 5, critical: 2 }
    };

    const alerts = [];
    for (const [packageType, count] of Object.entries(inventory)) {
      const threshold = thresholds[packageType];
      if (count <= threshold.critical) {
        alerts.push({
          packageType,
          currentCount: count,
          threshold: threshold.critical,
          severity: 'critical'
        });
      } else if (count <= threshold.low) {
        alerts.push({
          packageType,
          currentCount: count,
          threshold: threshold.low,
          severity: 'low'
        });
      }
    }

    return alerts;
  };

  const runManualCheck = async () => {
    setLoading(true);
    try {
      const result = await monitoringService.monitorAndAlert();
      console.log('Manual monitoring result:', result);
      await loadDashboardData();
    } catch (error) {
      console.error('Manual check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (count: number, packageType: string) => {
    const thresholds = {
      basic: { low: 10, critical: 5 },
      premium: { low: 8, critical: 3 },
      vip: { low: 5, critical: 2 }
    };

    const threshold = thresholds[packageType];
    if (count <= threshold.critical) return 'bg-red-600';
    if (count <= threshold.low) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getStatusText = (count: number, packageType: string) => {
    const thresholds = {
      basic: { low: 10, critical: 5 },
      premium: { low: 8, critical: 3 },
      vip: { low: 5, critical: 2 }
    };

    const threshold = thresholds[packageType];
    if (count <= threshold.critical) return 'Critical';
    if (count <= threshold.low) return 'Low';
    return 'Good';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Token Monitoring Dashboard</h1>
          <p className="text-gray-400">Real-time inventory tracking and automated alerts</p>
        </div>
        <Button
          onClick={runManualCheck}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Manual Check
        </Button>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Alert className={`border-2 ${alerts.some(a => a.severity === 'critical') ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>
              {alerts.filter(a => a.severity === 'critical').length > 0 && 'CRITICAL: '}
              {alerts.length} package(s) need attention
            </strong>
            <div className="mt-2 space-y-1">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.packageType.toUpperCase()}
                  </Badge>
                  <span>Only {alert.currentCount} tokens remaining</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Inventory */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Current Token Inventory
            {lastUpdate && (
              <span className="text-sm text-gray-400 font-normal">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {Object.entries(inventory).map(([type, count]) => (
              <Card key={type} className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white capitalize">{type} Tokens</h3>
                    <Badge className={getStatusColor(count, type)}>
                      {getStatusText(count, type)}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <Progress 
                    value={Math.min((count / 20) * 100, 100)} 
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-400 mt-1">Available tokens</p>
                </CardContent>
              </Card>
            ))}
            
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Total Checks (7d)</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalChecks}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Total Alerts (7d)</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalAlerts}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Auto Actions (7d)</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalActions}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {alerts.length === 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-gray-400">System Status</span>
              </div>
              <p className="text-lg font-bold text-white">
                {alerts.length === 0 ? 'Healthy' : 'Needs Attention'}
              </p>
            </CardContent>
          </Card>
          
        </div>
      )}

      {/* Recent Monitoring Logs */}
      {stats?.logs.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Monitoring Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.logs.slice(0, 5).map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <div className="text-white font-medium">
                      {new Date(log.monitored_at).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">
                      {log.alerts_generated?.length || 0} alerts, {log.actions_taken?.length || 0} actions
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {log.alerts_generated?.some(a => a.severity === 'critical') && (
                      <Badge variant="destructive">Critical</Badge>
                    )}
                    {log.actions_taken?.length > 0 && (
                      <Badge variant="secondary">Auto-Action</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
    </div>
  );
};
