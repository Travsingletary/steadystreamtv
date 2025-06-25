import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserManagement } from "./UserManagement";
import { SubscriptionAnalytics } from "./SubscriptionAnalytics";
import { RevenueTracking } from "./RevenueTracking";
import { MegaOTTCredits } from "./MegaOTTCredits";
import { Users, CreditCard, TrendingUp, DollarSign, Settings, RefreshCw, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedTokenManager } from './EnhancedTokenManager';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  megaottCredits: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    megaottCredits: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Get total users count from multiple possible tables
      let totalUsers = 0;
      
      // Try user_profiles first
      const { count: userProfilesCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (userProfilesCount) {
        totalUsers = userProfilesCount;
      } else {
        // Fallback to profiles table
        const { count: profilesCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        totalUsers = profilesCount || 0;
      }

      // Get active subscriptions count
      const { count: activeSubsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .gte('end_date', new Date().toISOString());

      // Get MegaOTT credits (handle case where no resellers exist)
      const { data: resellersData, error: resellersError } = await supabase
        .from('resellers')
        .select('credits');

      let totalCredits = 0;
      if (!resellersError && resellersData) {
        totalCredits = resellersData.reduce((sum, reseller) => sum + (reseller.credits || 0), 0);
      }

      // Calculate estimated revenue
      const estimatedRevenue = (activeSubsCount || 0) * 30; // $30 average per subscription

      setStats({
        totalUsers: totalUsers,
        activeSubscriptions: activeSubsCount || 0,
        totalRevenue: estimatedRevenue,
        megaottCredits: totalCredits
      });

    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: "Error",
        description: "Failed to load admin statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onStatsUpdate = (newStats: Partial<AdminStats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage users, subscriptions, and monitor platform performance</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchAdminStats}
              disabled={loading}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button
              onClick={() => navigate('/custom-dashboard-admin')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Custom Dashboard Manager
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? "..." : stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Registered platform users
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-200 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? "..." : stats.activeSubscriptions.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Currently active plans
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-200 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${loading ? "..." : stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Estimated monthly income
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-200 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">MegaOTT Credits</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {loading ? "..." : stats.megaottCredits.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Available API credits
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="users" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              User Management
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="credits" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              MegaOTT Credits
            </TabsTrigger>
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Token Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagement onStatsUpdate={onStatsUpdate} />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <SubscriptionAnalytics onStatsUpdate={onStatsUpdate} />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueTracking onStatsUpdate={onStatsUpdate} />
          </TabsContent>

          <TabsContent value="credits" className="space-y-6">
            <MegaOTTCredits onStatsUpdate={onStatsUpdate} />
          </TabsContent>

          <TabsContent value="tokens">
            <EnhancedTokenManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
