
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Activity, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  todaySignups: number;
  activeSubscriptions: number;
  revenue: number;
}

interface MetricsCardsProps {
  stats: DashboardStats;
  formatCurrency: (amount: number) => string;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ stats, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-400">{stats.totalUsers}</div>
          <p className="text-sm text-gray-500 mt-1">Registered users</p>
        </CardContent>
      </Card>

      <Card className="bg-dark-200 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Today's Signups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-400">{stats.todaySignups}</div>
          <p className="text-sm text-gray-500 mt-1">New customers today</p>
        </CardContent>
      </Card>

      <Card className="bg-dark-200 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Active Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-400">{stats.activeSubscriptions}</div>
          <p className="text-sm text-gray-500 mt-1">
            {stats.activeSubscriptions === 1 ? 'Paying customer' : 'Paying customers'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-dark-200 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Monthly Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gold">{formatCurrency(stats.revenue)}</div>
          <p className="text-sm text-gray-500 mt-1">Estimated this month</p>
        </CardContent>
      </Card>
    </div>
  );
};
