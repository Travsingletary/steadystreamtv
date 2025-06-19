
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickActionsProps {
  onRefresh: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onRefresh }) => {
  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
        <CardDescription className="text-gray-400">
          Common administrative tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.open('/testing-dashboard', '_blank')}
            className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-left transition-colors"
          >
            <h4 className="font-medium mb-1">Export User Data</h4>
            <p className="text-sm text-blue-100">Download customer reports</p>
          </button>
          
          <button 
            onClick={onRefresh}
            className="p-4 bg-green-600 hover:bg-green-700 rounded-lg text-white text-left transition-colors"
          >
            <h4 className="font-medium mb-1">Refresh Dashboard</h4>
            <p className="text-sm text-green-100">Update all metrics</p>
          </button>
          
          <button 
            onClick={() => console.log('Opening system logs...')}
            className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-left transition-colors"
          >
            <h4 className="font-medium mb-1">View System Logs</h4>
            <p className="text-sm text-purple-100">Check error reports</p>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
