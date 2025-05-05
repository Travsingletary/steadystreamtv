
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingDeviceSetup } from "@/components/onboarding/OnboardingDeviceSetup";
import { OnboardingPreferences } from "@/components/onboarding/OnboardingPreferences";
import { OnboardingSubscription } from "@/components/onboarding/OnboardingSubscription";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define a common UserData interface to be used across all components
export interface UserData {
  name: string;
  email: string;
  password?: string; // Added password for signup
  preferredDevice: string;
  genres: string[];
  subscription: any;
  xtreamCredentials?: {
    username: string;
    password: string;
  };
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    password: "",
    preferredDevice: "",
    genres: [],
    subscription: null,
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // If already logged in, redirect to dashboard
        navigate("/dashboard");
      }
    };
    
    checkSession();
  }, [navigate]);

  const updateUserData = (data: Partial<UserData>) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const createXtreamAccount = async (userId: string, plan: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-xtream-account', {
        body: { userId, plan: plan || 'free-trial' }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success("Streaming account created successfully!");
        updateUserData({ 
          xtreamCredentials: {
            username: data.username,
            password: data.password
          }
        });
        return data;
      } else {
        throw new Error(data.message || "Failed to create streaming account");
      }
    } catch (error: any) {
      console.error("Failed to create Xtream account:", error);
      toast.error("Failed to create streaming account. Please try again later.");
      return null;
    }
  };

  const finalizeOnboarding = async () => {
    // This function is called at the final step
    if (!userData.email || !userData.password) {
      toast.error("Email and password are required");
      return;
    }

    setIsCreatingAccount(true);
    
    try {
      // 1. Create user account with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          }
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // 2. Store user preferences in Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            name: userData.name,
            preferred_device: userData.preferredDevice,
            genres: userData.genres,
            subscription_tier: userData.subscription?.id || 'free-trial',
            subscription_status: 'active',
            trial_end_date: userData.subscription?.trialEndDate || null
          });
          
        if (profileError) throw profileError;
        
        // 3. Call the create-xtream-account edge function
        const xtreamAccount = await createXtreamAccount(
          authData.user.id, 
          userData.subscription?.id || 'free-trial'
        );
        
        if (!xtreamAccount) {
          // Still continue even if Xtream account creation fails
          // We'll retry it later or let user manually trigger it
          console.warn("Xtream account creation failed but continuing onboarding");
        }
        
        toast.success("Account created successfully!");
        // Continue to final step which will redirect to player
        nextStep();
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const steps = [
    <OnboardingWelcome 
      key="welcome" 
      userData={userData} 
      updateUserData={updateUserData} 
      onNext={nextStep} 
    />,
    <OnboardingDeviceSetup 
      key="device" 
      userData={userData} 
      updateUserData={updateUserData} 
      onNext={nextStep} 
      onBack={prevStep} 
    />,
    <OnboardingPreferences 
      key="preferences" 
      userData={userData} 
      updateUserData={updateUserData} 
      onNext={nextStep} 
      onBack={prevStep} 
    />,
    <OnboardingSubscription 
      key="subscription" 
      userData={userData} 
      updateUserData={updateUserData} 
      onNext={finalizeOnboarding}
      isProcessing={isCreatingAccount}
      onBack={prevStep} 
    />,
    <OnboardingComplete 
      key="complete" 
      userData={userData} 
    />,
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" 
            alt="SteadyStream Logo" 
            className="h-16 object-contain" 
          />
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div 
                    className={`rounded-full h-10 w-10 flex items-center justify-center ${
                      step === currentStep 
                        ? "bg-gold text-black" 
                        : step < currentStep 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {step < currentStep ? "✓" : step + 1}
                  </div>
                  {step < 4 && (
                    <div 
                      className={`w-12 h-1 ${
                        step < currentStep ? "bg-green-500" : "bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {steps[currentStep]}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
