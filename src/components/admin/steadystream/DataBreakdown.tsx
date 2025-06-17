
import React from 'react';

interface DataBreakdownProps {
  dataBreakdown: {
    userProfilesCount: number;
    profilesCount: number;
    subscriptionsTotal: number;
    subscriptionsActive: number;
    resellersCount: number;
    iptvAccountsCount: number;
  };
  stats: {
    megaottCredits: number;
  };
}

export const DataBreakdown: React.FC<DataBreakdownProps> = ({ dataBreakdown, stats }) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
      <h2 className="text-xl font-bold mb-4">📋 Database Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">User Tables</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">user_profiles:</span>
              <span className="text-white font-bold">{dataBreakdown.userProfilesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">profiles:</span>
              <span className="text-white font-bold">{dataBreakdown.profilesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">iptv_accounts:</span>
              <span className="text-white font-bold">{dataBreakdown.iptvAccountsCount}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-green-400 mb-3">Subscriptions</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Total:</span>
              <span className="text-white font-bold">{dataBreakdown.subscriptionsTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Active:</span>
              <span className="text-green-400 font-bold">{dataBreakdown.subscriptionsActive}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Expired:</span>
              <span className="text-red-400 font-bold">{dataBreakdown.subscriptionsTotal - dataBreakdown.subscriptionsActive}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-purple-400 mb-3">MegaOTT</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Resellers:</span>
              <span className="text-white font-bold">{dataBreakdown.resellersCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Credits:</span>
              <span className="text-purple-400 font-bold">{stats.megaottCredits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className={`font-bold ${dataBreakdown.resellersCount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dataBreakdown.resellersCount > 0 ? 'Active' : 'No Resellers'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
