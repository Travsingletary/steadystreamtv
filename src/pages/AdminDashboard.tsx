
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { Users, CreditCard, Calendar, BarChart, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ComprehensiveUserManagement } from "@/components/admin/ComprehensiveUserManagement";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    trial: 0,
    standard: 0,
    premium: 0,
    ultimate: 0,
    revenue: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {
        toast({
          title: "Access Denied",
          description: "You must be logged in to access this page",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };
    
    checkAdminAccess();
  }, [toast, navigate]);

  const handleStatsUpdate = (newStats: any) => {
    const planPrices = {
      standard: 20,
      premium: 35,
      ultimate: 45,
      trial: 0
    };

    const revenue = Object.entries(newStats)
      .filter(([key]) => key !== 'totalUsers')
      .reduce((total, [plan, count]) => {
        return total + ((planPrices[plan as keyof typeof planPrices] || 0) * (count as number));
      }, 0);

    setStats({
      totalUsers: newStats.totalUsers || 0,
      trial: newStats.trial || 0,
      standard: newStats.standard || 0,
      premium: newStats.premium || 0,
      ultimate: newStats.ultimate || 0,
      revenue
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-dark-200 border-gray-800 w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-16 w-16 mx-auto text-red-500" />
            <CardTitle className="text-2xl mt-4">Access Restricted</CardTitle>
            <CardDescription>
              You don't have permission to access this area.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/")} className="bg-gold hover:bg-gold-dark text-black">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-gold mb-2">Admin Dashboard</h1>
                <Shield className="h-6 w-6 text-gold" />
              </div>
              <p className="text-gray-400">
                Complete user management and platform monitoring
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="text-gold" />
                  {stats.totalUsers}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Trial Users</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Calendar className="text-yellow-500" />
                  {stats.trial}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Standard Plans</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="text-blue-500" />
                  {stats.standard}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Premium Plans</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="text-purple-500" />
                  {stats.premium}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Monthly Revenue</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BarChart className="text-gold" />
                  ${stats.revenue}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <ComprehensiveUserManagement onStatsUpdate={handleStatsUpdate} />
        </div>
      </div>
      
      <FooterSection />
    </div>
  );
};

export default AdminDashboard;
