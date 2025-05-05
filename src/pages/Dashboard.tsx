
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  CreditCard, 
  BarChart, 
  Settings, 
  PlusCircle, 
  RefreshCw, 
  Zap, 
  Search,
  ChevronRight,
  Link
} from "lucide-react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { ResellerStats } from "@/components/dashboard/ResellerStats";
import { CustomersList } from "@/components/dashboard/CustomersList";
import { AddCustomer } from "@/components/dashboard/AddCustomer";
import { CreditsManager } from "@/components/dashboard/CreditsManager";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  useEffect(() => {
    // Simulate authentication check and data loading
    setTimeout(() => {
      const mockUserData = {
        user: {
          id: "user-123",
          email: "demo@example.com"
        },
        reseller: {
          id: "reseller-123",
          user_id: "user-123",
          credits: 25,
          total_customers: 12,
          active_customers: 8,
          username: "demoreseller",
          panel_url: "https://steadystream.tv/panel",
          api_key: "sk_demo_123456789"
        }
      };
      
      setUserData(mockUserData);
      setLoading(false);
    }, 1000);
  }, []);

  const toggleAddCustomer = () => {
    setShowAddCustomer(!showAddCustomer);
  };

  const handleRefreshData = () => {
    // Simulate refresh
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Dashboard refreshed",
        description: "Your data has been updated",
      });
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gradient-gold">Reseller Dashboard</h1>
            <p className="text-gray-400">
              Manage your IPTV reseller business from one place
            </p>
          </div>
          
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshData}
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={() => navigate("/player")}
              className="bg-gold hover:bg-gold-dark text-black"
            >
              <Zap size={16} className="mr-2" />
              Go to Player
            </Button>
          </div>
        </div>
        
        {userData?.reseller ? (
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 bg-dark-200 p-1 border border-gray-800">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                <BarChart size={16} className="mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="customers" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                <Users size={16} className="mr-2" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="credits" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                <CreditCard size={16} className="mr-2" />
                Credits
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                <Settings size={16} className="mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <ResellerStats userData={userData} />
            </TabsContent>

            <TabsContent value="customers">
              <Card className="bg-dark-200 border-gray-800 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                      placeholder="Search customers by name or email..." 
                      className="pl-10 bg-dark-300 border-gray-700"
                    />
                  </div>
                  <Button 
                    onClick={toggleAddCustomer}
                    className="bg-gold hover:bg-gold-dark text-black"
                  >
                    <PlusCircle size={16} className="mr-2" />
                    {showAddCustomer ? "Cancel" : "Add Customer"}
                  </Button>
                </div>
              </Card>

              {showAddCustomer ? (
                <AddCustomer 
                  userId={userData.user.id} 
                  onSuccess={() => {
                    setShowAddCustomer(false);
                    toast({ 
                      title: "Customer added", 
                      description: "New customer has been added successfully" 
                    });
                  }} 
                />
              ) : (
                <CustomersList resellerId={userData.reseller.id} onUpdate={() => {
                  toast({ 
                    title: "Customer list updated", 
                    description: "Your customer list has been refreshed" 
                  });
                }} />
              )}
            </TabsContent>

            <TabsContent value="credits">
              <CreditsManager userData={userData} onUpdate={() => {
                toast({ 
                  title: "Credits updated", 
                  description: "Your credit balance has been updated" 
                });
              }} />
            </TabsContent>

            <TabsContent value="settings">
              <Card className="bg-dark-200 border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-4">Panel Credentials</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Panel URL</p>
                      <div className="flex gap-2">
                        <Input 
                          value={userData.reseller.panel_url || "https://steadystream.tv/panel"} 
                          readOnly
                          className="bg-dark-300 border-gray-700"
                        />
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(userData.reseller.panel_url || "https://steadystream.tv/panel");
                            toast({ title: "Copied to clipboard" });
                          }}
                        >
                          <Link size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Username</p>
                      <div className="flex gap-2">
                        <Input 
                          value={userData.reseller.username || userData.user.email} 
                          readOnly
                          className="bg-dark-300 border-gray-700"
                        />
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(userData.reseller.username || userData.user.email);
                            toast({ title: "Copied to clipboard" });
                          }}
                        >
                          <Link size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400 mb-1">API Key</p>
                      <div className="flex gap-2">
                        <Input 
                          value={userData.reseller.api_key || "••••••••••••••••••••"} 
                          readOnly
                          className="bg-dark-300 border-gray-700"
                        />
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(userData.reseller.api_key || "");
                            toast({ title: "Copied to clipboard" });
                          }}
                        >
                          <Link size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark-300 rounded-lg p-4 border border-gray-700">
                    <h3 className="font-semibold mb-2">Quick Guide</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <ChevronRight size={16} className="text-gold mt-1 flex-shrink-0" />
                        Use these credentials to access your reseller panel
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight size={16} className="text-gold mt-1 flex-shrink-0" />
                        The panel allows you to create and manage customer subscriptions
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight size={16} className="text-gold mt-1 flex-shrink-0" />
                        Each new subscription costs 1 credit
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight size={16} className="text-gold mt-1 flex-shrink-0" />
                        Contact support if you need to regenerate your API key
                      </li>
                    </ul>
                    
                    <div className="mt-4">
                      <Button 
                        className="bg-gold hover:bg-gold-dark text-black w-full"
                        onClick={() => window.open(userData.reseller.panel_url || "https://steadystream.tv/panel", "_blank")}
                      >
                        Open Reseller Panel
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-dark-200 border-gray-800 p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Reseller Account Not Setup</h2>
            <p className="text-gray-400 mb-4">
              You haven't set up your reseller account yet. Contact support to get started.
            </p>
            <Button className="bg-gold hover:bg-gold-dark text-black">
              Contact Support
            </Button>
          </Card>
        )}
      </div>
      
      <FooterSection />
    </div>
  );
};

export default Dashboard;
