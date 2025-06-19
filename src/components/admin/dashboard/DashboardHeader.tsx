
import React from 'react';
import { Activity } from 'lucide-react';

interface DashboardHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ loading, onRefresh }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">SteadyStream TV Admin</h1>
      <p className="text-gray-400">Real-time business metrics and system monitoring</p>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
      >
        {loading ? (
          <>
            <Activity className="h-4 w-4 animate-spin" />
            Refreshing...
          </>
        ) : (
          <>
            🔄 Refresh Data
          </>
        )}
      </button>
    </div>
  );
};
