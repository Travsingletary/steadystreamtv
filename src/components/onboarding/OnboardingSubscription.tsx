
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserData {
  name: string;
  email: string;
  preferredDevice: string;
  genres: string[];
  subscription: any;
}

interface OnboardingSubscriptionProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onNext: () => void;
  onBack: () => void;
  isProcessing?: boolean;
}

// Pricing plan data - using the same data as in PricingSection
const pricingPlans = [
  {
    id: "standard",
    name: "Standard",
    price: 20,
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

export const OnboardingSubscription = ({ 
  userData, 
  updateUserData, 
  onNext, 
  onBack,
  isProcessing = false
}: OnboardingSubscriptionProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(
    userData.subscription?.plan || ""
  );
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error("Please select a subscription plan");
      return;
    }

    if (isProcessing || isLocalProcessing) return;
    
    setIsLocalProcessing(true);
    
    try {
      // First create user account before payment
      console.log("Creating user account before payment...");
      
      // Generate a secure password for the user
      const generateSecurePassword = () => {
        const length = 16;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
      };

      const password = generateSecurePassword();
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: password,
        options: {
          data: {
            name: userData.name,
          }
        }
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      console.log("User created successfully:", authData.user.id);
      
      // Store onboarding data in localStorage for after payment - with more persistent storage
      const onboardingData = {
        ...userData,
        subscription: {
          plan: selectedPlan,
          name: pricingPlans.find(p => p.id === selectedPlan)?.name,
          price: pricingPlans.find(p => p.id === selectedPlan)?.price,
          trialDays: 1
        },
        userId: authData.user.id,
        password: password
      };
      
      // Store in multiple ways to ensure persistence
      localStorage.setItem('onboarding-data', JSON.stringify(onboardingData));
      sessionStorage.setItem('onboarding-data', JSON.stringify(onboardingData));
      
      console.log("Stored onboarding data:", onboardingData);
      
      // Get the selected plan details
      const plan = pricingPlans.find(p => p.id === selectedPlan);
      
      // Call the create-payment function with the real user ID and onboarding data
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          userId: authData.user.id, // Use the actual user ID, not "onboarding"
          planId: selectedPlan,
          customerEmail: userData.email,
          customerName: userData.name,
          isRecurring: true,
          onboardingData: onboardingData
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        console.log("Redirecting to payment URL:", data.url);
        // Redirect to crypto payment
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Could not process your payment. Please try again.");
      setIsLocalProcessing(false);
    }
  };

  const handleFreeTrial = () => {
    if (isProcessing || isLocalProcessing) return;
    
    setIsLocalProcessing(true);
    
    // Set up free trial subscription data
    setTimeout(() => {
      updateUserData({ 
        subscription: {
          plan: "free-trial",
          name: "Free Trial",
          price: 0,
          trialDays: 1,
          trialEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      });
      
      setIsLocalProcessing(false);
      toast.success("Your 24-hour free trial has started!");
      onNext();
    }, 1000);
  };

  const isButtonDisabled = isProcessing || isLocalProcessing;

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
      <p className="text-gray-400 mb-6">
        Select a subscription plan that fits your streaming needs or start with a free trial.
      </p>

      <div className="bg-dark-100 border border-gold p-6 rounded-lg mb-8 text-center">
        <h2 className="text-xl font-bold mb-2 text-gold">Try SteadyStream Free</h2>
        <p className="text-gray-300 mb-4">
          Get full access to all premium features for 24 hours.
          No credit card required.
        </p>
        <Button 
          className="bg-gold hover:bg-gold-dark text-black font-semibold w-full sm:w-auto"
          onClick={handleFreeTrial}
          disabled={isButtonDisabled}
        >
          <Clock className="mr-2 h-5 w-5" />
          {isButtonDisabled ? "Processing..." : "Start 24-Hour Free Trial"}
        </Button>
      </div>

      <div className="flex items-center mb-8">
        <div className="flex-grow h-px bg-gray-700"></div>
        <p className="px-4 text-gray-400">OR CHOOSE A PLAN</p>
        <div className="flex-grow h-px bg-gray-700"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {pricingPlans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg p-6 border transition-all duration-300 cursor-pointer relative ${
              selectedPlan === plan.id
                ? "border-gold shadow-gold/30 shadow-lg"
                : "border-gray-700 hover:border-gray-500"
            } ${plan.isPopular ? "bg-dark-100" : "bg-dark-300"}`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            {plan.isPopular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gold text-black text-xs font-bold uppercase px-3 py-1 rounded-full">
                  Most Popular
                </div>
              </div>
            )}
            
            <h3 className="text-xl font-bold mb-2 mt-2">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-4">
              {plan.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="text-gold h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </li>
              ))}
              {plan.features.length > 4 && (
                <li className="text-sm text-gray-400">
                  +{plan.features.length - 4} more features
                </li>
              )}
            </ul>
            
            <div className={`h-4 w-4 absolute top-4 right-4 rounded-full border-2 ${
              selectedPlan === plan.id 
                ? "border-gold bg-gold" 
                : "border-gray-500"
            }`}>
              {selectedPlan === plan.id && (
                <div className="h-2 w-2 rounded-full bg-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline"
          className="border-gray-700 text-gray-300"
          onClick={onBack}
          disabled={isButtonDisabled}
        >
          Back
        </Button>
        <Button 
          className="bg-gray-600 hover:bg-gray-500 text-white font-semibold flex-1"
          onClick={handleSubscribe}
          disabled={isButtonDisabled || !selectedPlan}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          {isButtonDisabled ? "Processing..." : "Subscribe to Selected Plan"}
        </Button>
      </div>
    </div>
  );
};
