
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { User, Key, Calendar, CreditCard, Layout, Smartphone, Users } from "lucide-react";

const Account = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      
      try {
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/onboarding");
          return;
        }
        
        setUser(user);
        
        // Get user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        setProfile(profile);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load your account information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Signed out",
        description: "You have been signed out successfully"
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDeviceName = (device: string) => {
    const deviceMap: Record<string, string> = {
      "web": "Computer (Web)",
      "smartphone": "Smartphone",
      "smart-tv": "Smart TV",
      "firestick": "Fire TV Stick",
      "tablet": "Tablet"
    };
    
    return deviceMap[device] || device;
  };

  const getPlanName = (tier: string) => {
    const planMap: Record<string, string> = {
      "free-trial": "Free Trial",
      "standard": "Standard Plan",
      "premium": "Premium Plan",
      "ultimate": "Ultimate Plan"
    };
    
    return planMap[tier] || tier;
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
              <h1 className="text-4xl font-bold text-gold mb-2">My Account</h1>
              <p className="text-gray-400">
                Manage your SteadyStream TV account and preferences
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                variant="outline"
                className="border-gray-700 text-white"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="text-gold" />
                    Profile
                  </CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="font-medium">{profile?.name || user?.user_metadata?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-medium">{user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Preferred Device</p>
                    <p className="font-medium">{getDeviceName(profile?.preferred_device)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Genres</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile?.genres?.map((genre: string, i: number) => (
                        <div key={i} className="px-2 py-1 bg-dark-300 rounded-md text-xs">
                          {genre}
                        </div>
                      )) || "No genres selected"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Tabs defaultValue="subscription">
                <TabsList className="bg-dark-300 border-b border-gray-800 w-full rounded-t-lg">
                  <TabsTrigger value="subscription" className="data-[state=active]:bg-dark-200">Subscription</TabsTrigger>
                  <TabsTrigger value="streaming" className="data-[state=active]:bg-dark-200">Streaming Details</TabsTrigger>
                </TabsList>
                
                <div className="bg-dark-200 border border-gray-800 border-t-0 rounded-b-lg p-6">
                  <TabsContent value="subscription" className="mt-0">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-dark-100 p-3">
                          <CreditCard className="h-6 w-6 text-gold" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{getPlanName(profile?.subscription_tier)}</h3>
                          <p className="text-gray-400">
                            {profile?.subscription_status === 'active' 
                              ? 'Your subscription is active' 
                              : 'Your subscription is inactive'}
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="border-gray-700" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-400">Trial End Date</p>
                            <p className="font-medium">{formatDate(profile?.trial_end_date)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Layout className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-400">Devices</p>
                            <p className="font-medium">
                              {profile?.subscription_tier === "standard" && "2 Devices"}
                              {profile?.subscription_tier === "premium" && "4 Devices"}
                              {profile?.subscription_tier === "ultimate" && "6 Devices"}
                              {(profile?.subscription_tier === "free-trial" || !profile?.subscription_tier) && "1 Device"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          className="bg-gold hover:bg-gold-dark text-black font-semibold"
                          onClick={() => navigate("/dashboard")}
                        >
                          Manage Subscription
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="streaming" className="mt-0">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-dark-100 p-3">
                          <Key className="h-6 w-6 text-gold" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">IPTV Credentials</h3>
                          <p className="text-gray-400">
                            Use these details to access your streams in external players
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="border-gray-700" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-400">Username</p>
                            <p className="font-medium">{profile?.xtream_username || "Not available"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Key className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-400">Password</p>
                            <p className="font-medium">{profile?.xtream_password || "Not available"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-dark-300 rounded-lg p-4 border border-gray-700">
                        <h4 className="font-medium mb-3 text-gold">Playlist URLs</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-400">M3U URL</p>
                            <p className="text-sm font-mono bg-dark-400 p-2 rounded mt-1 overflow-x-auto text-white">
                              {profile?.xtream_username ? 
                                `http://megaott.net/get.php?username=${profile.xtream_username}&password=${profile.xtream_password}&type=m3u_plus&output=ts` : 
                                "Not available"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">XSPF URL</p>
                            <p className="text-sm font-mono bg-dark-400 p-2 rounded mt-1 overflow-x-auto text-white">
                              {profile?.xtream_username ? 
                                `http://megaott.net/get.php?username=${profile.xtream_username}&password=${profile.xtream_password}&type=xspf&output=ts` : 
                                "Not available"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          className="bg-gold hover:bg-gold-dark text-black font-semibold"
                          onClick={() => navigate("/player")}
                        >
                          Open Player
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
              
              <Card className="bg-dark-200 border-gray-800 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="text-gold" />
                    Device Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 mb-4">
                    Your subscription allows streaming on {profile?.subscription_tier === "standard" ? "2" : 
                                                         profile?.subscription_tier === "premium" ? "4" : 
                                                         profile?.subscription_tier === "ultimate" ? "6" : "1"} devices.
                  </p>
                  
                  <div className="bg-dark-300 rounded-lg p-4 border border-gray-700">
                    <h4 className="font-medium mb-3">Connected Devices</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-dark-400 flex items-center justify-center">
                            <Smartphone className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">This device</p>
                            <p className="text-xs text-gray-400">Last active: Now</p>
                          </div>
                        </div>
                        <div className="bg-green-900/30 text-green-500 text-xs px-2 py-1 rounded-full">
                          Active
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="border-gray-700 text-white">
                    Manage Devices
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <FooterSection />
    </div>
  );
};

export default Account;
