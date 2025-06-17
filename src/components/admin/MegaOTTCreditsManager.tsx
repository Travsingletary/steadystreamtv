
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { MegaOTTAdminService } from "@/services/megaOTTAdminService";
import { RefreshCw, CreditCard, AlertTriangle, TrendingUp, DollarSign, Activity } from "lucide-react";

interface CreditsManagerProps {
  onCreditsUpdate: (credits: number) => void;
}

export const MegaOTTCreditsManager = ({ onCreditsUpdate }: CreditsManagerProps) => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [creditsAnalysis, setCreditsAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCreditsData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchCreditsData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchCreditsData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching MegaOTT credits data...');
      
      const [userData, subscriptionsData] = await Promise.all([
        MegaOTTAdminService.getUserInfo(),
        MegaOTTAdminService.fetchSubscriptions()
      ]);

      if (userData) {
        setUserInfo(userData);
        setSubscriptions(subscriptionsData);
        
        const analysis = MegaOTTAdminService.analyzeCreditsUsage(subscriptionsData, userData.credit);
        setCreditsAnalysis(analysis);
        
        onCreditsUpdate(userData.credit);
        
        console.log('💰 Credits Analysis:', analysis);
      }
    } catch (error) {
      console.error('Error fetching credits data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch credits data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCreditStatusColor = (credit: number) => {
    if (credit > 50) return 'text-green-400';
    if (credit > 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'default';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className="bg-dark-200 border-gray-800">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-white">Loading credits data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Credits Overview */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                MegaOTT Credits Manager
              </CardTitle>
              <CardDescription className="text-gray-400">
                Real-time credit monitoring and usage analytics
              </CardDescription>
            </div>
            <Button
              onClick={fetchCreditsData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="bg-dark-300 border-gray-700 hover:bg-dark-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credit Balance */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-dark-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Available Credits</p>
                  <p className={`text-2xl font-bold ${getCreditStatusColor(userInfo?.credit || 0)}`}>
                    {userInfo?.credit?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">User: {userInfo?.username}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-dark-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Monthly Burn Rate</p>
                  <p className="text-2xl font-bold text-white">
                    ${creditsAnalysis?.monthlyBurn?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Per month estimate</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <div className="bg-dark-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Days Remaining</p>
                  <p className="text-2xl font-bold text-white">
                    {creditsAnalysis?.daysRemaining || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">At current rate</p>
                </div>
                <Activity className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-dark-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Efficiency Score</p>
                  <p className="text-2xl font-bold text-gold">
                    {creditsAnalysis?.efficiency?.toFixed(0) || '0'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Credit utilization</p>
                </div>
                <CreditCard className="h-8 w-8 text-gold" />
              </div>
            </div>
          </div>

          {/* Credit Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Credit Usage</span>
              <span className="text-white">
                ${creditsAnalysis?.totalCostEstimate?.toFixed(2) || '0.00'} / ${userInfo?.credit?.toFixed(2) || '0.00'}
              </span>
            </div>
            <Progress 
              value={((creditsAnalysis?.totalCostEstimate || 0) / (userInfo?.credit || 1)) * 100} 
              className="w-full"
            />
          </div>

          {/* Recommendations */}
          {creditsAnalysis?.recommendedActions?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {creditsAnalysis.recommendedActions.map((rec, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-300 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={getBadgeVariant(rec.type)}>
                        {rec.type.toUpperCase()}
                      </Badge>
                      <span className="text-white text-sm">{rec.message}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-dark-200 border-gray-600 hover:bg-dark-100 text-xs"
                    >
                      {rec.action}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Usage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-300 rounded-lg p-4">
              <h4 className="text-gold font-medium mb-2">Active Subscriptions</h4>
              <p className="text-2xl font-bold text-white">
                {subscriptions.filter(sub => new Date(sub.expiring_at) > new Date()).length}
              </p>
              <p className="text-xs text-gray-400">Currently consuming credits</p>
            </div>
            
            <div className="bg-dark-300 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">Total Subscriptions</h4>
              <p className="text-2xl font-bold text-white">{subscriptions.length}</p>
              <p className="text-xs text-gray-400">All time created</p>
            </div>
            
            <div className="bg-dark-300 rounded-lg p-4">
              <h4 className="text-green-400 font-medium mb-2">Credit Health</h4>
              <p className="text-2xl font-bold text-white">
                {(userInfo?.credit || 0) > 50 ? 'Excellent' : 
                 (userInfo?.credit || 0) > 10 ? 'Good' : 'Critical'}
              </p>
              <p className="text-xs text-gray-400">Overall status</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
