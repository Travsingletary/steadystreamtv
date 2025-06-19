
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
    try {
      toast({
        title: "User Management",
        description: "Opening user management dashboard...",
      });
      
      console.log('👥 Navigating to user management');
      
      // Navigate to the admin dashboard page that has comprehensive user management
      navigate('/admin-dashboard');
    } catch (error) {
      toast({
        title: "Navigation Error",
        description: "Failed to open user management",
        variant: "destructive"
      });
    }
  };

  const handleSystemSettings = async () => {
    try {
      toast({
        title: "System Settings",
        description: "Checking system configuration...",
      });
      
      // Check system health by testing multiple components
      const healthChecks = await Promise.allSettled([
        // Check database connectivity
        supabase.from('profiles').select('count', { count: 'exact', head: true }),
        
        // Check MegaOTT configuration
        supabase.functions.invoke('megaott-config-check'),
        
        // Check if resellers table exists and has data
        supabase.from('resellers').select('*').limit(1)
      ]);

      const dbCheck = healthChecks[0].status === 'fulfilled';
      const megaottCheck = healthChecks[1].status === 'fulfilled';
      const resellersCheck = healthChecks[2].status === 'fulfilled';

      const healthyServices = [dbCheck, megaottCheck, resellersCheck].filter(Boolean).length;
      const totalServices = 3;

      if (healthyServices === totalServices) {
        toast({
          title: "System Status: All Good",
          description: `All ${totalServices} services are operational`,
        });
      } else {
        toast({
          title: "System Status: Issues Detected",
          description: `${healthyServices}/${totalServices} services operational`,
          variant: "destructive"
        });
      }
      
      console.log('⚙️ System Status:', {
        database: dbCheck ? 'healthy' : 'error',
        megaott: megaottCheck ? 'healthy' : 'error', 
        resellers: resellersCheck ? 'healthy' : 'error',
        overall: `${healthyServices}/${totalServices} services healthy`
      });
      
    } catch (error) {
      console.error('System check error:', error);
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
