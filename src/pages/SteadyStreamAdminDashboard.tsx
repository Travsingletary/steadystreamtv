import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Trash2, 
  Shield, 
  LogOut, 
  Search,
  Calendar,
  Monitor
} from "lucide-react";
import { MegaOTTDiagnostics } from "@/components/admin/MegaOTTDiagnostics";
import { MegaOTTCredits } from "@/components/admin/MegaOTTCredits";

interface SteadyStreamUser {
  id: string;
  full_name: string;
  email: string;
  username: string;
  subscription_plan: string;
  subscription_status: string;
  max_connections: number;
  created_at: string;
  expiry_date: string;
  is_active: boolean;
}

const SteadyStreamAdminDashboard = () => {
  const [users, setUsers] = useState<SteadyStreamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    totalRevenue: 0
  });
  
  // New user form state
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    subscription_plan: 'trial',
    max_connections: 1,
    expiry_days: 30
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check admin access on mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/admin-login');
          return;
        }

        const { data: adminRole } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (!adminRole) {
          navigate('/admin-login');
          return;
        }

        loadUsers();
      } catch (error) {
        navigate('/admin-login');
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('steadystream_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersData = data || [];
      setUsers(usersData);
      calculateStats(usersData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userList: SteadyStreamUser[]) => {
    const now = new Date();
    const planPrices = { trial: 0, standard: 20, premium: 35, ultimate: 45 };
    
    const activeUsers = userList.filter(u => 
      u.is_active && new Date(u.expiry_date) > now
    ).length;
    
    const expiredUsers = userList.filter(u => 
      new Date(u.expiry_date) <= now
    ).length;
    
    const revenue = userList
      .filter(u => u.is_active && new Date(u.expiry_date) > now)
      .reduce((total, user) => {
        const price = planPrices[user.subscription_plan as keyof typeof planPrices] || 0;
        return total + price;
      }, 0);

    setStats({
      totalUsers: userList.length,
      activeUsers,
      expiredUsers,
      totalRevenue: revenue
    });
  };

  const createUser = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.username || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      // Generate activation code and playlist token
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const playlistToken = btoa(JSON.stringify({
        username: newUser.username,
        timestamp: Date.now(),
        expires: Date.now() + (newUser.expiry_days * 24 * 60 * 60 * 1000)
      }));
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + newUser.expiry_days);

      // Create user using direct insert
      const { data: userData, error: userError } = await supabase
        .from('steadystream_users')
        .insert({
          full_name: newUser.full_name,
          email: newUser.email,
          username: newUser.username,
          password: newUser.password,
          subscription_plan: newUser.subscription_plan,
          max_connections: newUser.max_connections,
          expiry_date: expiryDate.toISOString()
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create playlist entry using direct insert
      const playlistUrl = `${window.location.origin}/api/playlist/${playlistToken}.m3u8`;
      
      const { error: playlistError } = await supabase
        .from('steadystream_playlists')
        .insert({
          steadystream_user_id: userData.id,
          playlist_url: playlistUrl,
          activation_code: activationCode,
          playlist_token: playlistToken
        });

      if (playlistError) throw playlistError;

      toast({
        title: "Success",
        description: `User ${newUser.username} created successfully!`,
      });

      // Reset form
      setNewUser({
        full_name: '',
        email: '',
        username: '',
        password: '',
        subscription_plan: 'trial',
        max_connections: 1,
        expiry_days: 30
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('steadystream_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${username} deleted successfully`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin-login');
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800 bg-dark-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-gold" />
            <h1 className="text-xl font-bold text-gold">SteadyStream Admin</h1>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <CardDescription>Active Users</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Monitor className="text-green-500" />
                {stats.activeUsers}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription>Expired Users</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="text-red-500" />
                {stats.expiredUsers}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription>Monthly Revenue</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <span className="text-gold">$</span>
                {stats.totalRevenue}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-dark-300 border-b border-gray-800">
            <TabsTrigger value="users">Users Management</TabsTrigger>
            <TabsTrigger value="create">Create User</TabsTrigger>
            <TabsTrigger value="megaott">MegaOTT Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="text-gold" />
                    Users Management
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search users..."
                      className="pl-9 bg-dark-300 border-gray-700 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs bg-blue-900 text-blue-300">
                              {user.subscription_plan.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.is_active && new Date(user.expiry_date) > new Date()
                                ? 'bg-green-900 text-green-300'
                                : 'bg-red-900 text-red-300'
                            }`}>
                              {user.is_active && new Date(user.expiry_date) > new Date() ? 'Active' : 'Expired'}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(user.expiry_date)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUser(user.id, user.username)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="text-gold" />
                  Create New User
                </CardTitle>
                <CardDescription>
                  Add a new user to the SteadyStream TV platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <Input
                      value={newUser.full_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                      className="bg-dark-300 border-gray-700"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-dark-300 border-gray-700"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <Input
                      value={newUser.username}
                      onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-dark-300 border-gray-700"
                      placeholder="johndoe123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-dark-300 border-gray-700"
                      placeholder="Strong password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subscription Plan</label>
                    <Select value={newUser.subscription_plan} onValueChange={(value) => setNewUser(prev => ({ ...prev, subscription_plan: value }))}>
                      <SelectTrigger className="bg-dark-300 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="standard">Standard ($20/month)</SelectItem>
                        <SelectItem value="premium">Premium ($35/month)</SelectItem>
                        <SelectItem value="ultimate">Ultimate ($45/month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Connections</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newUser.max_connections}
                      onChange={(e) => setNewUser(prev => ({ ...prev, max_connections: parseInt(e.target.value) || 1 }))}
                      className="bg-dark-300 border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Expiry (Days)</label>
                    <Input
                      type="number"
                      min="1"
                      value={newUser.expiry_days}
                      onChange={(e) => setNewUser(prev => ({ ...prev, expiry_days: parseInt(e.target.value) || 30 }))}
                      className="bg-dark-300 border-gray-700"
                    />
                  </div>
                </div>
                
                <Button
                  onClick={createUser}
                  disabled={isCreating}
                  className="bg-gold hover:bg-gold-dark text-black font-semibold"
                >
                  {isCreating ? "Creating..." : "Create User"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="megaott" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MegaOTTCredits />
              <div>
                <MegaOTTDiagnostics />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SteadyStreamAdminDashboard;
