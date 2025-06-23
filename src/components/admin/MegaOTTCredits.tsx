
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, CreditCard, Users, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MegaOTTCreditsProps {
  onStatsUpdate?: (stats: any) => void;
}

export const MegaOTTCredits: React.FC<MegaOTTCreditsProps> = ({ onStatsUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [megaOTTStatus, setMegaOTTStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [fallbackStats, setFallbackStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalCredits: 8, // Static fallback value
    revenue: 0
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFallbackData();
  }, []);

  const loadFallbackData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading fallback data from Supabase...');

      // Get user counts from multiple sources
      const { count: userProfilesCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: activeSubsCount } = await supabase
        .from('iptv_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Calculate stats
      const totalUsers = Math.max(userProfilesCount || 0, profilesCount || 0);
      const activeSubscriptions = activeSubsCount || 0;
      const estimatedRevenue = activeSubscriptions * 25;

      const stats = {
        totalUsers,
        activeSubscriptions,
        totalCredits: 8, // Static fallback
        revenue: estimatedRevenue
      };

      setFallbackStats(stats);
      
      // Try to check MegaOTT status
      await checkMegaOTTStatus();

      if (onStatsUpdate) {
        onStatsUpdate(stats);
      }

      console.log('✅ Fallback data loaded:', stats);
    } catch (error) {
      console.error('❌ Error loading fallback data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkMegaOTTStatus = async () => {
    try {
      setMegaOTTStatus('checking');
      
      // Try to ping MegaOTT API with timeout
      const response = await Promise.race([
        fetch('https://megaott.net/api/v1/user', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer 338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d'
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ]);

      if (response.ok) {
        setMegaOTTStatus('connected');
        console.log('✅ MegaOTT API is accessible');
      } else {
        setMegaOTTStatus('disconnected');
        console.warn('⚠️ MegaOTT API returned error status');
      }
    } catch (error) {
      setMegaOTTStatus('disconnected');
      console.warn('⚠️ MegaOTT API is not accessible:', error.message);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin text-yellow-400 mr-2" />
            <span className="text-gray-300">Loading dashboard data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* MegaOTT Status Banner */}
      <Card className={`border-2 ${
        megaOTTStatus === 'connected' 
          ? 'bg-green-900/20 border-green-600' 
          : 'bg-orange-900/20 border-orange-600'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {megaOTTStatus === 'connected' ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-orange-400" />
              )}
              <div>
                <h3 className="font-semibold text-white">
                  MegaOTT Status: {megaOTTStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </h3>
                <p className="text-sm text-gray-300">
                  {megaOTTStatus === 'connected' 
                    ? 'API integration is working normally'
                    : 'Using fallback mode with local data'
                  }
                </p>
              </div>
            </div>
            <Button 
              onClick={checkMegaOTTStatus}
              disabled={megaOTTStatus === 'checking'}
              size="sm"
              variant="outline"
              className="border-gray-600"
            >
              {megaOTTStatus === 'checking' ? 'Checking...' : 'Retry'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fallback Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">{fallbackStats.totalUsers}</div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <Badge variant="secondary" className="mt-2">
              From Supabase
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">{fallbackStats.activeSubscriptions}</div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <Badge variant="secondary" className="mt-2">
              IPTV Accounts
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Available Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">{fallbackStats.totalCredits}</div>
              <CreditCard className="w-8 h-8 text-yellow-400" />
            </div>
            <Badge variant="secondary" className="mt-2">
              Fallback Mode
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Est. Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">${fallbackStats.revenue}</div>
              <CreditCard className="w-8 h-8 text-green-400" />
            </div>
            <Badge variant="secondary" className="mt-2">
              Calculated
            </Badge>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="bg-red-900/20 border-red-600">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback Mode Info */}
      {megaOTTStatus === 'disconnected' && (
        <Card className="bg-blue-900/20 border-blue-600">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-400">🔄 Fallback Mode Active</h3>
              <p className="text-sm text-blue-200">
                The system is operating in fallback mode using local data sources. 
                New signups will still work with locally generated credentials.
              </p>
              <ul className="text-xs text-blue-300 space-y-1 mt-2">
                <li>• User statistics from Supabase database</li>
                <li>• Local credential generation for new accounts</li>
                <li>• Signup automation continues to function</li>
                <li>• MegaOTT integration will resume when API is available</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
