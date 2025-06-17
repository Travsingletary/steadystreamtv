
import React from 'react';

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    activeSubscriptions: number;
    revenue: number;
    megaottCredits: number;
  };
  dataBreakdown: {
    userProfilesCount: number;
    profilesCount: number;
    subscriptionsTotal: number;
    subscriptionsActive: number;
    resellersCount: number;
    iptvAccountsCount: number;
  };
  loading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, dataBreakdown, loading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Stats Cards with REAL DATA */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-white">
              {loading ? '...' : stats.totalUsers.toLocaleString()}
            </p>
          </div>
          <div className="text-2xl">👥</div>
        </div>
        <div className="mt-4 text-blue-400 text-sm">
          📊 {dataBreakdown.userProfilesCount} user_profiles + {dataBreakdown.profilesCount} profiles
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Active Subscriptions</p>
            <p className="text-2xl font-bold text-white">
              {loading ? '...' : stats.activeSubscriptions.toLocaleString()}
            </p>
          </div>
          <div className="text-2xl">💳</div>
        </div>
        <div className="mt-4 text-green-400 text-sm">
          ✅ {dataBreakdown.subscriptionsActive} active of {dataBreakdown.subscriptionsTotal} total
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Estimated Revenue</p>
            <p className="text-2xl font-bold text-white">
              ${loading ? '...' : stats.revenue.toLocaleString()}
            </p>
          </div>
          <div className="text-2xl">💰</div>
        </div>
        <div className="mt-4 text-green-400 text-sm">
          💼 ${stats.activeSubscriptions * 30}/month projection
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">MegaOTT Credits</p>
            <p className="text-2xl font-bold text-white">
              {loading ? '...' : stats.megaottCredits.toLocaleString()}
            </p>
          </div>
          <div className="text-2xl">🔋</div>
        </div>
        <div className="mt-4 text-green-400 text-sm">
          📊 {dataBreakdown.resellersCount} reseller accounts
        </div>
      </div>
    </div>
  );
};
