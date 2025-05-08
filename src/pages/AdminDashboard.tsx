
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { User, Users, CreditCard, Calendar, BarChart, Search, Shield, UserX, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    revenue: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Check for admin authentication
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

      // In a real app, you'd check for admin role in a roles table or user metadata
      // For now, we'll assume the user is an admin if they're logged in
      // TODO: Implement proper admin role check
      setIsAdmin(true);
      
      loadUsers();
    };
    
    checkAdminAccess();
  }, [toast, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get all profiles (in a real app, you'd add pagination)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) {
        throw error;
      }
      
      setUsers(data || []);
      
      // Calculate statistics
      const activeSubscriptions = data?.filter(u => u.subscription_status === 'active')?.length || 0;
      const trialUsers = data?.filter(u => 
        u.subscription_tier === 'free-trial' && 
        new Date(u.trial_end_date) > new Date()
      )?.length || 0;
      
      setStats({
        totalUsers: data?.length || 0,
        activeSubscriptions,
        trialUsers,
        revenue: calculateRevenue(data || [])
      });
      
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const calculateRevenue = (users: any[]) => {
    const planPrices = {
      'standard': 20,
      'premium': 35,
      'ultimate': 45,
      'free-trial': 0
    };
    
    return users.reduce((total, user) => {
      const plan = user.subscription_tier;
      if (user.subscription_status === 'active' && plan && plan !== 'free-trial') {
        return total + (planPrices[plan as keyof typeof planPrices] || 0);
      }
      return total;
    }, 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    if (action === 'delete' && !confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      let updateData = {};
      
      if (action === 'suspend') {
        updateData = { subscription_status: 'suspended' };
      } else if (action === 'activate') {
        updateData = { subscription_status: 'active' };
      }
      
      if (action === 'delete') {
        // In a real app, you might want to archive users instead of deleting them
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
          
        if (error) throw error;
        
        toast({
          title: "User Deleted",
          description: "The user has been permanently removed.",
        });
      } else {
        // Update user status
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
          
        if (error) throw error;
        
        toast({
          title: "User Updated",
          description: `User has been ${action === 'suspend' ? 'suspended' : 'activated'}.`,
        });
      }
      
      // Refresh users list
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || "There was an error processing your request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      (user.name?.toLowerCase().includes(search)) ||
      (user.xtream_username?.toLowerCase().includes(search))
    );
  });

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
                Monitor and manage SteadyStream TV users
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                className="bg-gold hover:bg-gold-dark text-black"
                onClick={loadUsers}
              >
                Refresh Data
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                <CardDescription>Active Subscriptions</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="text-gold" />
                  {stats.activeSubscriptions}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Trial Users</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Calendar className="text-gold" />
                  {stats.trialUsers}
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
          
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="text-gold" />
                User Management
              </CardTitle>
              <CardDescription>View and manage all users</CardDescription>
              
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Search by name or username..."
                  className="pl-9 bg-dark-300 border-gray-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="bg-dark-300 border-b border-gray-800 w-full rounded-t-lg">
                  <TabsTrigger value="all" className="data-[state=active]:bg-dark-100">All Users</TabsTrigger>
                  <TabsTrigger value="active" className="data-[state=active]:bg-dark-100">Active</TabsTrigger>
                  <TabsTrigger value="trial" className="data-[state=active]:bg-dark-100">Trial</TabsTrigger>
                  <TabsTrigger value="expired" className="data-[state=active]:bg-dark-100">Expired/Suspended</TabsTrigger>
                </TabsList>
                
                <div className="mt-4">
                  <TabsContent value="all" className="m-0">
                    <UsersTable 
                      users={filteredUsers} 
                      loading={loading} 
                      onUserAction={handleUserAction}
                    />
                  </TabsContent>
                  
                  <TabsContent value="active" className="m-0">
                    <UsersTable 
                      users={filteredUsers.filter(u => u.subscription_status === 'active')}
                      loading={loading}
                      onUserAction={handleUserAction}
                    />
                  </TabsContent>
                  
                  <TabsContent value="trial" className="m-0">
                    <UsersTable 
                      users={filteredUsers.filter(u => 
                        u.subscription_tier === 'free-trial' && 
                        new Date(u.trial_end_date) > new Date()
                      )}
                      loading={loading}
                      onUserAction={handleUserAction}
                    />
                  </TabsContent>
                  
                  <TabsContent value="expired" className="m-0">
                    <UsersTable 
                      users={filteredUsers.filter(u => 
                        u.subscription_status !== 'active' || 
                        (u.trial_end_date && new Date(u.trial_end_date) < new Date())
                      )}
                      loading={loading}
                      onUserAction={handleUserAction}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <FooterSection />
    </div>
  );
};

interface UsersTableProps {
  users: any[];
  loading: boolean;
  onUserAction: (userId: string, action: 'suspend' | 'activate' | 'delete') => void;
}

const UsersTable = ({ users, loading, onUserAction }: UsersTableProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        No users found
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption>SteadyStream TV users</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>IPTV Username</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Trial Ends</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
              <TableCell>{user.xtream_username || "N/A"}</TableCell>
              <TableCell>
                {user.subscription_tier === "free-trial" && "Free Trial"}
                {user.subscription_tier === "standard" && "Standard"}
                {user.subscription_tier === "premium" && "Premium"}
                {user.subscription_tier === "ultimate" && "Ultimate"}
                {!user.subscription_tier && "N/A"}
              </TableCell>
              <TableCell>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  user.subscription_status === 'active' 
                    ? 'bg-green-900/30 text-green-500' 
                    : 'bg-red-900/30 text-red-500'
                }`}>
                  {user.subscription_status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </TableCell>
              <TableCell>{formatDate(user.trial_end_date)}</TableCell>
              <TableCell>
                <div className="flex justify-end space-x-1">
                  {user.subscription_status === 'active' ? (
                    <Button
                      variant="outline" 
                      size="icon" 
                      className="w-8 h-8 text-yellow-500 hover:text-yellow-300"
                      onClick={() => onUserAction(user.id, 'suspend')}
                      title="Suspend User"
                    >
                      <AlertCircle size={14} />
                    </Button>
                  ) : (
                    <Button
                      variant="outline" 
                      size="icon" 
                      className="w-8 h-8 text-green-500 hover:text-green-300"
                      onClick={() => onUserAction(user.id, 'activate')}
                      title="Activate User"
                    >
                      <Shield size={14} />
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-8 h-8 text-red-500 hover:text-red-300"
                    onClick={() => onUserAction(user.id, 'delete')}
                    title="Delete User"
                  >
                    <UserX size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminDashboard;
