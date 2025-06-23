
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { MegaOTTAdminService } from '@/services/megaOTTAdminService';

interface MegaOTTCreditsProps {
  onStatsUpdate?: (stats: any) => void;
}

export const MegaOTTCredits: React.FC<MegaOTTCreditsProps> = ({ onStatsUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMegaOTTData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching MegaOTT data with direct API token...');
      
      // Fetch user info using the updated method
      const userResponse = await MegaOTTAdminService.getUserInfo();
      
      if (userResponse.success) {
        setUserInfo(userResponse);
        setConnected(true);
        console.log('✅ MegaOTT API connected successfully');
        
        // Fetch subscriptions
        const subscriptionsData = await MegaOTTAdminService.fetchSubscriptions();
        setSubscriptions(subscriptionsData);
        
        // Analyze the data
        const analysis = MegaOTTAdminService.analyzeSubscriptions(subscriptionsData);
        const creditsAnalysis = MegaOTTAdminService.analyzeCreditsUsage(subscriptionsData, userResponse.credit || 0);
        
        setAnalytics({
          ...analysis,
          creditsAnalysis
        });
        
        // Update parent stats
        if (onStatsUpdate) {
          onStatsUpdate({
            megaottCredits: userResponse.credit || 0,
            activeSubscriptions: analysis.activeSubscriptions,
            totalUsers: analysis.totalSubscriptions
          });
        }
        
      } else {
        setConnected(false);
        setError(userResponse.error || 'Failed to connect to MegaOTT API');
        console.warn('⚠️ MegaOTT API unavailable, using fallback');
        
        // Use fallback data
        if (onStatsUpdate) {
          onStatsUpdate({
            megaottCredits: 8, // Set to actual value from your panel
          });
        }
      }
      
    } catch (err: any) {
      console.error('❌ MegaOTT API error:', err);
      setError(err.message);
      setConnected(false);
      
      // Use fallback data
      if (onStatsUpdate) {
        onStatsUpdate({
          megaottCredits: 8, // Set to actual value from your panel
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMegaOTTData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-3">
              {connected ? (
                <Wifi className="w-6 h-6 text-green-400" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-400" />
              )}
              MegaOTT Integration
              <Badge variant={connected ? "default" : "destructive"}>
                {connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </CardTitle>
            <Button 
              onClick={fetchMegaOTTData} 
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
      {connected && userInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Username</p>
                  <p className="text-2xl font-bold text-white">{userInfo.username}</p>
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
                  <p className="text-2xl font-bold text-white">{userInfo.credit}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">User ID</p>
                  <p className="text-2xl font-bold text-white">{userInfo.id}</p>
                </div>
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ID</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Subscriptions</p>
                  <p className="text-2xl font-bold text-white">{analytics.totalSubscriptions}</p>
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
                  <p className="text-2xl font-bold text-white">{analytics.activeSubscriptions}</p>
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
                  <p className="text-2xl font-bold text-white">{analytics.paidSubscriptions}</p>
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
                  <p className="text-2xl font-bold text-white">${analytics.monthlyRevenue}</p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fallback Mode Notice */}
      {!connected && (
        <Card className="bg-blue-900/20 border-blue-600 border-2">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <WifiOff className="w-6 h-6 text-blue-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-400">Fallback Mode Active</h3>
                <p className="text-sm text-blue-200">
                  MegaOTT API is unavailable. Using local data and fallback systems.
                  New signups will continue to work normally.
                </p>
              </div>
              <Badge className="bg-blue-600 text-white">
                Operational
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
