
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { SubscriptionInterface } from "@/components/customer/SubscriptionInterface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, PlayCircle, CreditCard } from "lucide-react";

const CustomerDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/');
          return;
        }

        setUser(user);

        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(profile);
        }

      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent"></div>
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
              <h1 className="text-4xl font-bold text-gold mb-2">
                Welcome back, {profile?.name || user?.email}!
              </h1>
              <p className="text-gray-400">
                Manage your SteadyStream TV subscription and account
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-2">
              <Button
                variant="outline"
                className="border-gray-700 text-white"
                onClick={() => navigate('/player')}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Watch Now
              </Button>
              <Button
                variant="outline"
                className="border-gray-700 text-white"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>

          <Tabs defaultValue="subscription" className="space-y-6">
            <TabsList className="bg-dark-300 border-b border-gray-800 w-full rounded-t-lg">
              <TabsTrigger value="subscription" className="data-[state=active]:bg-dark-200">
                <CreditCard className="mr-2 h-4 w-4" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="account" className="data-[state=active]:bg-dark-200">
                <User className="mr-2 h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-dark-200">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscription">
              <SubscriptionInterface />
            </TabsContent>

            <TabsContent value="account">
              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your account details and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Name</label>
                      <p className="text-white">{profile?.name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Member since</label>
                      <p className="text-white">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Account status</label>
                      <p className="text-white">{profile?.subscription_status || 'Active'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Manage your preferences and account settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Streaming Preferences</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Auto-play next episode</span>
                          <input type="checkbox" className="toggle" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>HD quality when available</span>
                          <input type="checkbox" className="toggle" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Email notifications</span>
                          <input type="checkbox" className="toggle" defaultChecked />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Privacy</h3>
                      <Button variant="outline" className="border-gray-700 text-white">
                        Download my data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <FooterSection />
    </div>
  );
};

export default CustomerDashboard;
