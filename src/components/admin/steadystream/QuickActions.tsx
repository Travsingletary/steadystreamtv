
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViewAnalytics = async () => {
    try {
      // Get basic analytics data
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: subscriptions } = await supabase.from('stripe_subscriptions').select('*');
      
      toast({
        title: "Analytics Overview",
        description: `Total Users: ${profiles?.length || 0}, Active Subscriptions: ${subscriptions?.length || 0}`,
      });
      
      console.log('📊 Analytics Data:', { profiles, subscriptions });
    } catch (error) {
      toast({
        title: "Analytics Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    }
  };

  const handleManageUsers = () => {
    toast({
      title: "User Management",
      description: "Navigating to user management...",
    });
    navigate('/admin');
  };

  const handleSystemSettings = async () => {
    try {
      // Check system health
      const { data, error } = await supabase.functions.invoke('megaott-config-check');
      
      if (error) throw error;
      
      toast({
        title: "System Status",
        description: data?.status === 'healthy' ? "All systems operational" : "System issues detected",
        variant: data?.status === 'healthy' ? "default" : "destructive"
      });
      
      console.log('⚙️ System Status:', data);
    } catch (error) {
      toast({
        title: "System Check Failed",
        description: "Unable to verify system status",
        variant: "destructive"
      });
    }
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
