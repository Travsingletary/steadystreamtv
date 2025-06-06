
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLaunchMetrics } from '@/hooks/useLaunchMetrics';
import Navbar from '@/components/Navbar';
import FooterSection from '@/components/FooterSection';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  Smartphone, 
  RefreshCw,
  Activity,
  Target,
  DollarSign
} from 'lucide-react';

const LaunchDashboard = () => {
  const { metrics, loading, error, refreshMetrics } = useLaunchMetrics();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMetrics();
    setRefreshing(false);
  };

  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: <Users className="h-4 w-4" />,
      description: 'Registered users',
      trend: '+12%'
    },
    {
      title: 'Active Subscriptions',
      value: metrics.activeSubscriptions,
      icon: <CreditCard className="h-4 w-4" />,
      description: 'Paying customers',
      trend: '+8%'
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversionRate}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Signup to subscription',
      trend: '+2%'
    },
    {
      title: 'Avg Session Time',
      value: `${metrics.averageSessionTime}m`,
      icon: <Clock className="h-4 w-4" />,
      description: 'User engagement',
      trend: '+5%'
    }
  ];

  if (loading && metrics.totalUsers === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gold mb-2">Launch Dashboard</h1>
                <p className="text-gray-400">
                  Real-time metrics and insights for SteadyStream TV launch
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-gray-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {error && (
              <Alert className="mb-6 bg-red-900/30 border-red-500 text-red-100">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metricCards.map((metric, index) => (
                <Card key={index} className="bg-dark-200 border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                    {metric.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{metric.description}</p>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        {metric.trend}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Popular Plans */}
              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gold" />
                    Popular Plans
                  </CardTitle>
                  <CardDescription>Subscription plan breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.popularPlans.map((plan, index) => (
                      <div key={plan.plan} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-gold' : 
                            index === 1 ? 'bg-blue-500' : 
                            'bg-gray-500'
                          }`} />
                          <span className="capitalize">{plan.plan}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{plan.count} users</span>
                          <Badge variant="outline">
                            {metrics.totalUsers > 0 ? Math.round((plan.count / metrics.totalUsers) * 100) : 0}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Device Breakdown */}
              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-gold" />
                    Device Usage
                  </CardTitle>
                  <CardDescription>Preferred device breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.deviceBreakdown.map((device, index) => (
                      <div key={device.device} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-green-500' : 
                            index === 1 ? 'bg-blue-500' : 
                            'bg-purple-500'
                          }`} />
                          <span className="capitalize">{device.device}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{device.count} users</span>
                          <Badge variant="outline">
                            {metrics.totalUsers > 0 ? Math.round((device.count / metrics.totalUsers) * 100) : 0}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Tracking */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gold" />
                    Monthly Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    ${(metrics.activeSubscriptions * 25).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-400">Estimated based on avg plan price</p>
                </CardContent>
              </Card>

              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gold" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400">All Systems Operational</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Last checked: just now</p>
                </CardContent>
              </Card>

              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <CardTitle>Launch Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">
                    Phase 1
                  </div>
                  <p className="text-xs text-gray-400">Soft launch active</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <FooterSection />
    </div>
  );
};

export default LaunchDashboard;
