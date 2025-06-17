
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViewAnalytics = () => {
    toast({
      title: "Analytics",
      description: "Analytics dashboard is opening...",
    });
    // Navigate to analytics section or show analytics modal
    console.log('📊 Opening analytics dashboard');
  };

  const handleManageUsers = () => {
    toast({
      title: "User Management",
      description: "Opening user management interface...",
    });
    // Navigate to user management section
    console.log('👥 Opening user management');
  };

  const handleSystemSettings = () => {
    toast({
      title: "System Settings",
      description: "Opening system configuration...",
    });
    // Navigate to system settings
    console.log('⚙️ Opening system settings');
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={handleViewAnalytics}
          className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-3 px-6 rounded-lg transition-colors"
        >
          📊 View Analytics
        </button>
        <button 
          onClick={handleManageUsers}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          👥 Manage Users
        </button>
        <button 
          onClick={handleSystemSettings}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          ⚙️ System Settings
        </button>
      </div>
    </div>
  );
};
