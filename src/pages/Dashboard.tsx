import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { cardToCryptoService, RECEIVE_CURRENCIES } from "@/services/cardToCryptoService";
import { CreditCard, Calendar, CheckCircle, Clock, Lock, User, Key, AlertTriangle, Bitcoin } from "lucide-react";
import {
  profileService,
  ProfilePermissionError,
  ProfileSchemaError,
} from "@/services/profileService";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('USDT');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const searchParams = new URLSearchParams(location.search);
  const paymentSuccess = searchParams.get("success") === "true";
  const paymentCanceled = searchParams.get("canceled") === "true";
  const sessionId = searchParams.get("session_id");

  // Debug logging function
  const addDebugInfo = (message: string) => {
    console.log(`[DASHBOARD DEBUG] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Plans data
  const plans = [
    {
      id: "standard",
      name: "Standard",
      price: 20,
      description: "Our basic streaming package with all essential channels.",
      features: [
        "7,000+ Live TV Channels",
        "Standard VOD Library",
        "HD Quality Streaming",
        "2 Devices Simultaneously",
        "24/7 Basic Support",
        "3 Connection Types"
      ],
      isPopular: false
    },
    {
      id: "premium",
      name: "Premium",
      price: 35,
      description: "Enhanced streaming with more channels and better quality.",
      features: [
        "10,000+ Live TV Channels",
        "Extended VOD Library",
        "Full HD Streaming",
        "4 Devices Simultaneously",
        "24/7 Premium Support",
        "All Connection Types",
        "DVR Functionality"
      ],
      isPopular: true
    },
    {
      id: "ultimate",
      name: "Ultimate",
      price: 45,
      description: "The ultimate streaming experience with all premium features.",
      features: [
        "10,000+ Live TV Channels",
        "Complete VOD Library",
        "4K Ultra HD Streaming",
        "6 Devices Simultaneously",
        "24/7 Priority Support",
        "All Connection Types",
        "Advanced DVR Functionality",
        "Premium Sports Packages"
      ],
      isPopular: false
    }
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      addDebugInfo("Starting user data fetch");
      
      try {
        const { user: currentUser, profile: currentProfile } = await profileService.fetchProfile();

        if (!currentUser) {
          addDebugInfo("No authenticated user found, redirecting to onboarding");
          navigate("/onboarding");
          return;
        }

        addDebugInfo(`User authenticated: ${currentUser.email} (ID: ${currentUser.id})`);
        setUser(currentUser);

        addDebugInfo(`Profile loaded: subscription_tier=${currentProfile?.subscription_tier}, status=${currentProfile?.subscription_status}`);
        setProfile(currentProfile);
      } catch (error) {
        console.error("Error fetching user data:", error);

        if (error instanceof ProfilePermissionError) {
          addDebugInfo("Profile permission error encountered");
          toast({
            title: "Profile access blocked",
            description: "Row Level Security policies for the profiles table are missing. Apply the latest Supabase migrations and policies.",
            variant: "destructive",
          });
        } else if (error instanceof ProfileSchemaError) {
          addDebugInfo("Profile schema error encountered");
          toast({
            title: "Profiles table out of date",
            description: "The profiles table is missing required columns. Run the Supabase migrations to sync the schema.",
            variant: "destructive",
          });
        } else {
          addDebugInfo(`Error fetching user data: ${error}`);
          toast({
            title: "Error",
            description: "Failed to load your subscription information",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    
    // Show toast for payment status
    if (paymentSuccess && sessionId) {
      addDebugInfo(`Payment successful with session ID: ${sessionId}`);
      toast({
        title: "Payment Successful",
        description: "Thank you for subscribing to SteadyStream TV!",
        variant: "default",
      });
      // Clear URL params after showing toast
      navigate('/dashboard', { replace: true });
    } else if (paymentCanceled) {
      addDebugInfo("Payment was canceled by user");
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. You can try again anytime.",
        variant: "default",
      });
      // Clear URL params after showing toast
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, toast, paymentSuccess, paymentCanceled, sessionId]);

  const handleSubscribe = async (planId: string) => {
    if (processingPayment || !user) {
      addDebugInfo(`Subscribe blocked: processingPayment=${processingPayment}, user=${!!user}`);
      return;
    }

    setProcessingPayment(true);
    addDebugInfo(`Starting card-to-crypto payment for plan: ${planId}, crypto: ${selectedCrypto}`);

    try {
      // Verify user authentication
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      addDebugInfo(`User verified for payment: ${currentUser.email}`);

      // Create card-to-crypto payment
      const paymentResponse = await cardToCryptoService.createPayment(
        planId as any,
        'ETH', // Always use ETH for card-to-crypto payments
        user.id,
        user.email || ''
      );

      addDebugInfo(`Payment created: ${JSON.stringify(paymentResponse)}`);

      if (paymentResponse.payment_url) {
        addDebugInfo(`Opening payment page in new tab: ${paymentResponse.payment_url}`);

        // Show user feedback before opening new tab
        toast({
          title: "Redirecting to Payment",
          description: "A new tab will open with your secure card payment page. We'll receive your payment in cryptocurrency.",
          variant: "default",
        });

        // Open payment page in a new tab
        const newWindow = window.open(paymentResponse.payment_url, '_blank');

        if (!newWindow) {
          // Fallback if popup was blocked
          addDebugInfo("Popup blocked, providing manual link");
          toast({
            title: "Popup Blocked",
            description: "Please allow popups and try again, or click the payment link below.",
            variant: "destructive",
          });

          console.log("Direct payment link:", paymentResponse.payment_url);
        } else {
          addDebugInfo("Payment tab opened successfully");
        }

        setProcessingPayment(false);
      } else {
        addDebugInfo("No payment URL returned");
        throw new Error("No payment URL returned from payment service");
      }

    } catch (error) {
      console.error("Card-to-crypto payment error:", error);
      addDebugInfo(`Payment error: ${error}`);

      let errorMessage = "Could not process your payment. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive"
      });
      setProcessingPayment(false);
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

  const isTrialActive = () => {
    if (!profile?.trial_end_date) return false;
    const trialEnd = new Date(profile.trial_end_date);
    return trialEnd > new Date();
  };

  const getTrialTimeRemaining = () => {
    if (!profile?.trial_end_date) return null;
    
    const now = new Date();
    const trialEnd = new Date(profile.trial_end_date);
    
    if (trialEnd <= now) return null;
    
    const diffMs = trialEnd.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      hours: diffHrs,
      minutes: diffMins
    };
  };

  const trialRemaining = getTrialTimeRemaining();

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
              <h1 className="text-4xl font-bold text-gold mb-2">My Dashboard</h1>
              <p className="text-gray-400">
                Manage your subscription and streaming account
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                variant="outline"
                className="border-gray-700 text-white"
                onClick={() => navigate('/account')}
              >
                <User className="mr-2 h-4 w-4" /> Account Settings
              </Button>
            </div>
          </div>
          
          {/* Debug Panel */}
          {debugInfo.length > 0 && (
            <Card className="mb-8 bg-dark-200 border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="h-4 w-4" />
                  Debug Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto text-xs text-gray-300 space-y-1">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="font-mono">{info}</div>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setDebugInfo([])}
                >
                  Clear Debug Info
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Payment Instructions Alert */}
          <Alert className="mb-8 bg-blue-900/30 border-blue-500 text-blue-100">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payment Process</AlertTitle>
            <AlertDescription>
              When you click "Subscribe", a new tab will open with your secure Stripe payment page. 
              Please complete your payment there and return to this page.
            </AlertDescription>
          </Alert>
          
          {isTrialActive() && (
            <Alert className="mb-8 bg-gold/20 border-gold text-gold">
              <Clock className="h-4 w-4" />
              <AlertTitle>Free Trial Active</AlertTitle>
              <AlertDescription>
                Your free trial ends in {trialRemaining?.hours} hours and {trialRemaining?.minutes} minutes. 
                Subscribe to a plan to continue streaming.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card className="bg-dark-200 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="text-gold" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>Your subscription details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Plan</p>
                    <p className="font-medium">
                      {profile?.subscription_tier === "standard" && "Standard Plan"}
                      {profile?.subscription_tier === "premium" && "Premium Plan"}
                      {profile?.subscription_tier === "ultimate" && "Ultimate Plan"}
                      {profile?.subscription_tier === "free-trial" && "Free Trial"}
                      {!profile?.subscription_tier && "No active subscription"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      profile?.subscription_status === 'active' 
                        ? 'bg-green-900/30 text-green-500' 
                        : 'bg-red-900/30 text-red-500'
                    }`}>
                      {profile?.subscription_status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{profile?.subscription_tier === "free-trial" ? "Trial Ends" : "Next Billing Date"}</p>
                    <p className="font-medium">{formatDate(profile?.trial_end_date)}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
                    onClick={() => navigate('/player')}
                  >
                    Start Streaming
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="bg-dark-200 border-gray-800 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="text-gold" />
                    Streaming Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">IPTV Username</p>
                    <p className="font-medium">{profile?.xtream_username || "Not available"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">IPTV Password</p>
                    <p className="font-medium">{profile?.xtream_password || "Not available"}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-dark-400 hover:bg-dark-500 text-white"
                    onClick={() => navigate('/account')}
                  >
                    View Full Details
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Tabs defaultValue="subscription">
                <TabsList className="bg-dark-300 border-b border-gray-800 w-full rounded-t-lg">
                  <TabsTrigger value="subscription" className="data-[state=active]:bg-dark-200">Subscription Plans</TabsTrigger>
                  <TabsTrigger value="billing" className="data-[state=active]:bg-dark-200">Billing History</TabsTrigger>
                </TabsList>
                
                <div className="bg-dark-200 border border-gray-800 border-t-0 rounded-b-lg p-6">
                  <TabsContent value="subscription" className="mt-0">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Choose a Plan</h3>
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-gold" />
                          <span className="text-sm text-gold">Secure Payment</span>
                        </div>
                      </div>
                      
                      <Separator className="border-gray-700" />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                          <Card 
                            key={plan.id} 
                            className={`${
                              profile?.subscription_tier === plan.id 
                                ? 'bg-dark-100 border-gold' 
                                : 'bg-dark-300 border-gray-700 hover:border-gray-500'
                            } relative transition-all duration-300`}
                          >
                            {plan.isPopular && (
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="bg-gold text-black text-xs font-bold uppercase px-3 py-1 rounded-full">
                                  Most Popular
                                </div>
                              </div>
                            )}
                            
                            {profile?.subscription_tier === plan.id && (
                              <div className="absolute top-3 right-3">
                                <div className="bg-gold text-black text-xs font-bold uppercase px-2 py-0.5 rounded">
                                  Current Plan
                                </div>
                              </div>
                            )}
                            
                            <CardHeader>
                              <CardTitle className="text-xl">{plan.name}</CardTitle>
                              <div className="text-3xl font-bold mt-2">
                                ${plan.price}
                                <span className="text-sm text-gray-400 font-normal">/month</span>
                              </div>
                              <CardDescription className="mt-2">
                                {plan.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {plan.features.map((feature, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="text-gold h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                            <CardFooter>
                              <Button 
                                className={`w-full ${
                                  profile?.subscription_tier === plan.id 
                                    ? 'bg-dark-400 hover:bg-dark-300 text-white' 
                                    : 'bg-gold hover:bg-gold-dark text-black'
                                }`}
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={processingPayment || profile?.subscription_tier === plan.id}
                              >
                                {processingPayment 
                                  ? "Processing..." 
                                  : profile?.subscription_tier === plan.id 
                                    ? "Current Plan" 
                                    : "Subscribe"}
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="bg-dark-300 rounded-lg p-4 border border-gray-700 mt-4">
                        <div className="text-sm text-gray-300">
                          <p className="mb-2 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-gold" />
                            <span className="font-medium">Secure Payments</span>
                          </p>
                          <p>All payments are processed securely through Stripe. Your payment information is never stored on our servers.</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="billing" className="mt-0">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Payment History</h3>
                        <Button variant="outline" className="border-gray-700 text-white">
                          Download Receipts
                        </Button>
                      </div>
                      
                      <Separator className="border-gray-700" />
                      
                      {profile?.subscription_tier === "free-trial" || !profile?.subscription_tier ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="mb-4">
                            <Calendar className="h-12 w-12 mx-auto text-gray-500" />
                          </div>
                          <h4 className="text-lg font-medium mb-2">No billing history yet</h4>
                          <p>
                            You're currently on the free trial. Subscribe to a plan to continue streaming after your trial ends.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-gray-700 rounded-lg overflow-hidden">
                          <div className="grid grid-cols-4 bg-dark-300 px-4 py-2 text-sm font-medium text-gray-300">
                            <div>Date</div>
                            <div>Description</div>
                            <div>Amount</div>
                            <div>Status</div>
                          </div>
                          <div className="divide-y divide-gray-700">
                            <div className="grid grid-cols-4 px-4 py-3 text-sm">
                              <div>{formatDate(profile?.updated_at || new Date().toISOString())}</div>
                              <div>Monthly subscription - {profile?.subscription_tier}</div>
                              <div>
                                ${profile?.subscription_tier === "standard" ? "20.00" : 
                                   profile?.subscription_tier === "premium" ? "35.00" : 
                                   profile?.subscription_tier === "ultimate" ? "45.00" : "0.00"}
                              </div>
                              <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-900/30 text-green-500">
                                  Paid
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      
      <FooterSection />
    </div>
  );
};

export default Dashboard;
