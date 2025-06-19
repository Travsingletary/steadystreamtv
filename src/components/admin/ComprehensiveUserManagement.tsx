
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Plus, Edit, Trash2, RefreshCw } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  subscription_tier?: string;
  subscription_status?: string;
  created_at: string;
  trial_end_date?: string;
}

interface ComprehensiveUserManagementProps {
  onStatsUpdate: (stats: any) => void;
}

export const ComprehensiveUserManagement: React.FC<ComprehensiveUserManagementProps> = ({ onStatsUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(profiles || []);
      setFilteredUsers(profiles || []);
      
      // Calculate and update stats
      const stats = calculateStats(profiles || []);
      onStatsUpdate(stats);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userList: User[]) => {
    const totalUsers = userList.length;
    const planCounts = userList.reduce((acc, user) => {
      const plan = user.subscription_tier || 'trial';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers,
      trial: planCounts.trial || 0,
      standard: planCounts.standard || 0,
      premium: planCounts.premium || 0,
      ultimate: planCounts.ultimate || 0
    };
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterUsers(term, selectedFilter);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    filterUsers(searchTerm, filter);
  };

  const filterUsers = (term: string, filter: string) => {
    let filtered = users;

    if (term) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(term.toLowerCase()))
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter(user => user.subscription_tier === filter);
    }

    setFilteredUsers(filtered);
  };

  const updateUserSubscription = async (userId: string, newTier: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: newTier,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User subscription updated successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user subscription",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trial': return 'bg-yellow-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanColor = (plan?: string) => {
    switch (plan) {
      case 'standard': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      case 'ultimate': return 'bg-gold';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage all SteadyStream TV users and subscriptions
            </CardDescription>
          </div>
          <Button 
            onClick={fetchUsers} 
            variant="outline" 
            size="sm"
            className="border-gray-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-dark-300 border-gray-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'trial', 'standard', 'premium', 'ultimate'].map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(filter)}
                className={selectedFilter === filter ? "bg-gold text-black" : "border-gray-700 text-white"}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="bg-dark-300 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-white">
                          {user.name || user.email}
                        </h3>
                        <Badge className={`${getPlanColor(user.subscription_tier)} text-white`}>
                          {user.subscription_tier || 'trial'}
                        </Badge>
                        <Badge className={`${getStatusColor(user.subscription_status)} text-white`}>
                          {user.subscription_status || 'pending'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>Email: {user.email}</p>
                        <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                        {user.trial_end_date && (
                          <p>Trial Ends: {new Date(user.trial_end_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={user.subscription_tier || 'trial'}
                        onChange={(e) => updateUserSubscription(user.id, e.target.value)}
                        className="bg-dark-400 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                      >
                        <option value="trial">Trial</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="ultimate">Ultimate</option>
                      </select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                        className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
