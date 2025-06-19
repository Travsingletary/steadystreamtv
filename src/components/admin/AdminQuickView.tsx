
import React from 'react';
import { Activity } from 'lucide-react';
import { CreditMonitor } from './CreditMonitor';
import { TrialManager } from './TrialManager';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { MetricsCards } from './dashboard/MetricsCards';
import { SystemStatus } from './dashboard/SystemStatus';
import { QuickActions } from './dashboard/QuickActions';

export const AdminQuickView = () => {
  const { stats, loading, loadStats, formatCurrency } = useDashboardStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Activity className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-dark-100">
      <DashboardHeader loading={loading} onRefresh={loadStats} />
      
      <MetricsCards stats={stats} formatCurrency={formatCurrency} />
      
      <TrialManager />
      
      <CreditMonitor />
      
      <SystemStatus systemHealth={stats.systemHealth} />
      
      <QuickActions onRefresh={loadStats} />
    </div>
  );
};
