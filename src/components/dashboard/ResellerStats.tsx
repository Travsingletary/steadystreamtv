
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Users, CreditCard, Calendar, MonitorPlay } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ResellerStatsProps {
  userData: {
    user: any;
    reseller: {
      credits: number;
      total_customers: number;
      active_customers: number;
      id: string;
      [key: string]: any;
    };
  };
}

export const ResellerStats: React.FC<ResellerStatsProps> = ({ userData }) => {
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [expiringCount, setExpiringCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get recent customers
        const { data: customers } = await supabase
          .from('customers')
          .select('*')
          .eq('reseller_id', userData.reseller.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setRecentCustomers(customers || []);
        
        // Get expiring soon count (subscriptions expiring in 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const now = new Date();
        
        const { count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('reseller_id', userData.reseller.id)
          .eq('status', 'active')
          .lt('expiry_date', sevenDaysFromNow.toISOString())
          .gt('expiry_date', now.toISOString());
        
        setExpiringCount(count || 0);
      } catch (error) {
        console.error("Error fetching stats data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userData?.reseller?.id) {
      fetchData();
    }
  }, [userData]);

  const stats = [
    {
      title: "Available Credits",
      value: userData.reseller.credits || 0,
      icon: <CreditCard className="h-8 w-8 text-gold" />,
      description: "Credits for creating subscriptions"
    },
    {
      title: "Total Customers",
      value: userData.reseller.total_customers || 0,
      icon: <Users className="h-8 w-8 text-blue-500" />,
      description: "All-time customer count"
    },
    {
      title: "Active Subscriptions",
      value: userData.reseller.active_customers || 0,
      icon: <MonitorPlay className="h-8 w-8 text-green-500" />,
      description: "Currently active customer accounts"
    },
    {
      title: "Expiring Soon",
      value: expiringCount,
      icon: <Calendar className="h-8 w-8 text-orange-500" />,
      description: "Subscriptions expiring in 7 days"
    }
  ];

  // Sample data for when no customers exist yet
  const fallbackCustomers = [
    { name: "John Smith", email: "john@example.com", plan: "Basic", status: "active", date: "2025-05-01" },
    { name: "Sarah Johnson", email: "sarah@example.com", plan: "Premium", status: "active", date: "2025-05-02" },
    { name: "Michael Brown", email: "michael@example.com", plan: "Ultimate", status: "pending", date: "2025-05-03" }
  ];

  // Use fetched data or fallback data if empty
  const displayCustomers = recentCustomers.length > 0 
    ? recentCustomers.map(customer => ({
        name: customer.name,
        email: customer.email,
        plan: customer.plan,
        status: customer.status,
        date: new Date(customer.created_at).toISOString().split('T')[0]
      }))
    : fallbackCustomers;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="bg-dark-200 border-gray-800 p-6 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              </div>
              {stat.icon}
            </div>
            <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-dark-200 border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Customers</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-700">
                  <th className="text-left py-2 px-2">NAME</th>
                  <th className="text-left py-2 px-2">PLAN</th>
                  <th className="text-left py-2 px-2">STATUS</th>
                  <th className="text-left py-2 px-2">DATE</th>
                </tr>
              </thead>
              <tbody>
                {displayCustomers.map((customer, index) => (
                  <tr key={index} className="border-b border-gray-800 text-sm">
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-gray-400">{customer.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">{customer.plan}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.status === 'active' 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-400">{customer.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="bg-dark-200 border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Reseller Package Details</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Package Type</p>
              <p className="font-medium">IPTV Reseller Pro</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Reseller ID</p>
              <p className="font-medium">{userData.reseller.id || "RS-" + Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <span className="px-2 py-1 rounded-full text-xs bg-green-900/30 text-green-400">
                Active
              </span>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Allowed Connections</p>
              <p className="font-medium">Multiple</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Channels</p>
              <p className="font-medium">10,000+ Live TV Channels</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Video On Demand</p>
              <p className="font-medium">Included</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
