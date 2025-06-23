
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { AdminMegaOTTService } from '@/services/adminMegaOTTService';
import { APIStatusMonitor } from './APIStatusMonitor';

interface EnhancedMegaOTTCreditsProps {
  onStatsUpdate?: (stats: any) => void;
}

export const EnhancedMegaOTTCredits: React.FC<EnhancedMegaOTTCreditsProps> = ({ onStatsUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Fetching enhanced admin dashboard data...');
      
      const result = await AdminMegaOTTService.fetchAdminDashboardData();
      
      if (!result.success) {
        setError(result.error || 'Failed to fetch data');
        console.warn('⚠️ Admin API unavailable, using fallback mode');
      } else {
        setDashboardData(result);
        console.log(`✅ Admin data loaded via ${result.apiName}`);
        
        // Update parent stats
        if (onStatsUpdate && result.analytics) {
          onStatsUpdate({
            megaottCredits: result.userInfo?.credit || 0,
            activeSubscriptions: result.analytics.activeSubscriptions,
            totalUsers: result.analytics.totalSubscriptions,
            monthlyRevenue: result.analytics.monthlyRevenue
          });
        }
      }
      
    } catch (err: any) {
      console.error('❌ Enhanced admin service error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* API Status Monitor */}
      <APIStatusMonitor />

      {/* Admin Dashboard Header */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-3">
              {dashboardData && !error ? (
                <Wifi className="w-6 h-6 text-green-400" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-400" />
              )}
              Enhanced MegaOTT Dashboard
              <Badge variant={dashboardData && !error ? "default" : "destructive"}>
                {dashboardData && !error ? `Connected via ${dashboardData.apiName}` : 'Disconnected'}
              </Badge>
            </CardTitle>
            <Button 
              onClick={fetchDashboardData} 
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
              Refresh Data
            </Button>
          </div>
        </CardHeader>
        
        {error && (
          <CardContent>
            <div className="bg-red-900/20 border border-red-600 rounded p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* User Info & Credits */}
      {dashboardData?.userInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Admin Username</p>
                  <p className="text-2xl font-bold text-white">{dashboardData.userInfo.username}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Available Credits</p>
                  <p className="text-2xl font-bold text-white">{dashboardData.userInfo.credit}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">API Source</p>
                  <p className="text-lg font-bold text-white">{dashboardData.apiName}</p>
                </div>
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">API</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Dashboard */}
      {dashboardData?.analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Subscriptions</p>
                  <p className="text-2xl font-bold text-white">{dashboardData.analytics.totalSubscriptions}</p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-white">{dashboardData.analytics.activeSubscriptions}</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Paid Subscriptions</p>
                  <p className="text-2xl font-bold text-white">{dashboardData.analytics.paidSubscriptions}</p>
                </div>
                <div className="text-2xl">💳</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white">${dashboardData.analytics.monthlyRevenue}</p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fallback Mode Notice */}
      {error && (
        <Card className="bg-blue-900/20 border-blue-600 border-2">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <WifiOff className="w-6 h-6 text-blue-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-400">Admin API Unavailable</h3>
                <p className="text-sm text-blue-200">
                  Admin monitoring is temporarily unavailable. User signups continue to work normally with production APIs.
                </p>
              </div>
              <Badge className="bg-blue-600 text-white">
                Monitoring Offline
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
