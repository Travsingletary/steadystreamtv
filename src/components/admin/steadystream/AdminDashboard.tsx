import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { MegaOTTCredits } from '@/components/admin/MegaOTTCredits';
import { StatsCards } from './StatsCards';
import { DataBreakdown } from './DataBreakdown';
import { QuickActions } from './QuickActions';

// 📊 ADMIN DASHBOARD - Protected content with REAL DATA and better explanations
export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    revenue: 0,
    megaottCredits: 0
  });
  const [loading, setLoading] = useState(true);
  const [dataBreakdown, setDataBreakdown] = useState({
    userProfilesCount: 0,
    profilesCount: 0,
    subscriptionsTotal: 0,
    subscriptionsActive: 0,
    resellersCount: 0,
    iptvAccountsCount: 0
  });

  // Fetch real data from Supabase with detailed breakdown
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);
        console.log('📊 Fetching detailed admin statistics...');

        // Get total users from user_profiles
        const { count: userProfilesCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        // Get total users from profiles (fallback)
        const { count: profilesCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get total subscriptions
        const { count: subscriptionsTotal } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true });

        // Get active subscriptions
        const { count: activeSubsCount } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .gte('end_date', new Date().toISOString());

        // Get resellers count
        const { count: resellersCount } = await supabase
          .from('resellers')
          .select('*', { count: 'exact', head: true });

        // Get IPTV accounts count
        const { count: iptvAccountsCount } = await supabase
          .from('iptv_accounts')
          .select('*', { count: 'exact', head: true });

        // Get MegaOTT credits with error handling
        const { data: resellersData, error: resellersError } = await supabase
          .from('resellers')
          .select('credits');

        let totalCredits = 0;
        if (!resellersError && resellersData && resellersData.length > 0) {
          totalCredits = resellersData.reduce((sum, reseller) => sum + (reseller.credits || 0), 0);
        }

        // Calculate total users (prioritize user_profiles, fallback to profiles)
        const totalUsers = userProfilesCount || profilesCount || 0;

        // Calculate estimated revenue
        const estimatedRevenue = (activeSubsCount || 0) * 30; // $30 average per subscription

        setStats({
          totalUsers: totalUsers,
          activeSubscriptions: activeSubsCount || 0,
          revenue: estimatedRevenue,
          megaottCredits: totalCredits
        });

        setDataBreakdown({
          userProfilesCount: userProfilesCount || 0,
          profilesCount: profilesCount || 0,
          subscriptionsTotal: subscriptionsTotal || 0,
          subscriptionsActive: activeSubsCount || 0,
          resellersCount: resellersCount || 0,
          iptvAccountsCount: iptvAccountsCount || 0
        });

        console.log('✅ Detailed data loaded:', {
          totalUsers,
          userProfilesCount,
          profilesCount,
          subscriptionsTotal,
          activeSubscriptions: activeSubsCount,
          resellersCount,
          iptvAccountsCount,
          totalCredits
        });

      } catch (error) {
        console.error('❌ Failed to fetch real data:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const onStatsUpdate = (newStats) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-yellow-400">SteadyStream Admin</h1>
              <p className="text-gray-400 text-sm">Welcome back, {user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <StatsCards 
          stats={stats} 
          dataBreakdown={dataBreakdown} 
          loading={loading} 
        />

        <DataBreakdown 
          dataBreakdown={dataBreakdown} 
          stats={stats} 
        />

        <QuickActions />

        {/* MegaOTT Credits Section */}
        <MegaOTTCredits onStatsUpdate={onStatsUpdate} />
      </main>
    </div>
  );
};
