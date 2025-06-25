
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, DollarSign, AlertTriangle, TrendingUp, WifiOff } from 'lucide-react';
import { MegaOTTAdminService } from '@/services/megaOTTAdminService';

export const CreditMonitor = () => {
  const [credits, setCredits] = useState<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const checkCredits = async () => {
    try {
      setIsRefreshing(true);
      setErrorMessage('');
      
      const userData = await MegaOTTAdminService.getUserInfo();
      
      if (userData.success && userData.credit !== undefined) {
        setCredits(userData.credit);
        setStatus('success');
        setLastUpdate(new Date());
        console.log('✅ Credit check successful:', userData.credit);
      } else {
        throw new Error(userData.error || 'No credit data received');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message);
      console.error('❌ Credit check failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkCredits();
    // Check credits every 5 minutes
    const interval = setInterval(checkCredits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCreditStatus = () => {
    if (!credits) return 'unknown';
    if (credits < 20) return 'critical';
    if (credits < 100) return 'warning';
    return 'good';
  };

  const getAvailableSignups = (planCost: number) => {
    return credits ? Math.floor(credits / planCost) : 0;
  };

  const getStatusColor = () => {
    const creditStatus = getCreditStatus();
    switch (creditStatus) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'good': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusBadge = () => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">API Offline</Badge>;
      default:
        return <Badge variant="secondary">Loading</Badge>;
    }
  };

  return (
    <Card className="w-full bg-dark-200 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span className="flex items-center gap-2">
            {status === 'error' ? (
              <WifiOff className="h-5 w-5 text-red-500" />
            ) : (
              <DollarSign className="h-5 w-5" />
            )}
            MegaOTT Credit Status
          </span>
          {getConnectionStatusBadge()}
        </CardTitle>
        <CardDescription className="text-gray-400">
          Real-time credit monitoring • Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>MegaOTT API Unavailable:</strong> {errorMessage}
              <br />
              <small className="text-red-600">
                User signups may be affected. The system will retry automatically.
              </small>
            </AlertDescription>
          </Alert>
        )}

        {status === 'success' && getCreditStatus() === 'critical' && credits !== null && (
          <Alert className="border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              🚨 CRITICAL: Credits below $20! Add more credits immediately to continue processing signups.
            </AlertDescription>
          </Alert>
        )}

        {status === 'success' && getCreditStatus() === 'warning' && credits !== null && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              ⚠️ Warning: Credits below $100. Consider adding more credits soon.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-dark-300 rounded-lg border border-gray-700">
            <div className={`text-3xl font-bold ${status === 'error' ? 'text-gray-500' : getStatusColor()}`}>
              {status === 'error' ? '---' : credits !== null ? formatCurrency(credits) : '---'}
            </div>
            <div className="text-sm text-gray-400 mt-1">Available Balance</div>
            {status === 'error' && (
              <div className="text-xs text-red-400 mt-1">API Offline</div>
            )}
          </div>

          <div className="text-center p-4 bg-dark-300 rounded-lg border border-gray-700">
            <div className="text-3xl font-bold text-blue-400">
              {status === 'error' ? '---' : getAvailableSignups(5)}
            </div>
            <div className="text-sm text-gray-400 mt-1">Basic Plans Available</div>
            <div className="text-xs text-gray-500">$5 per account</div>
          </div>

          <div className="text-center p-4 bg-dark-300 rounded-lg border border-gray-700">
            <div className="text-3xl font-bold text-purple-400">
              {status === 'error' ? '---' : getAvailableSignups(8)}
            </div>
            <div className="text-sm text-gray-400 mt-1">Duo Plans Available</div>
            <div className="text-xs text-gray-500">$8 per account</div>
          </div>

          <div className="text-center p-4 bg-dark-300 rounded-lg border border-gray-700">
            <div className="text-3xl font-bold text-orange-400">
              {status === 'error' ? '---' : getAvailableSignups(12)}
            </div>
            <div className="text-sm text-gray-400 mt-1">Family Plans Available</div>
            <div className="text-xs text-gray-500">$12 per account</div>
          </div>
        </div>

        {/* Usage Insights */}
        {status === 'success' && (
          <div className="bg-dark-300 rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Credit Usage Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Daily Burn Rate:</span>
                <div className="text-white font-medium">~$15-25/day</div>
              </div>
              <div>
                <span className="text-gray-400">Est. Days Remaining:</span>
                <div className="text-white font-medium">
                  {credits ? Math.floor(credits / 20) : 'N/A'} days
                </div>
              </div>
              <div>
                <span className="text-gray-400">Recommended Min:</span>
                <div className="text-white font-medium">$200</div>
              </div>
            </div>
          </div>
        )}

        {/* API Status Info */}
        {status === 'error' && (
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-600">
            <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              Service Status
            </h4>
            <div className="text-sm text-blue-200">
              <p>• MegaOTT API is temporarily unavailable</p>
              <p>• User signups may be delayed</p>
              <p>• Credit monitoring is offline</p>
              <p>• System will automatically retry connection</p>
            </div>
          </div>
        )}

        <Button 
          onClick={checkCredits}
          disabled={isRefreshing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Credits'}
        </Button>
      </CardContent>
    </Card>
  );
};
