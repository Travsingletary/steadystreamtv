
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingDeviceSetup } from "@/components/onboarding/OnboardingDeviceSetup";
import { OnboardingPreferences } from "@/components/onboarding/OnboardingPreferences";
import { OnboardingSubscription } from "@/components/onboarding/OnboardingSubscription";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [isProcessingXtream, setIsProcessingXtream] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    preferredDevice: isMobile ? "smartphone" : "web",
    genres: [],
    subscription: null,
    xtreamCredentials: null
  });

  // Check if redirected from previous auth attempt
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    
    if (error && message) {
      toast({
        title: "Authentication Error",
        description: message,
        variant: "destructive"
      });
    }
  }, [location, toast]);

  // Set default device based on device detection
  useEffect(() => {
    if (isMobile !== undefined) {
      setUserData(prev => ({
        ...prev,
        preferredDevice: isMobile ? "smartphone" : "web"
      }));
    }
  }, [isMobile]);

  const updateUserData = (data) => {
    setUserData(prevData => ({
      ...prevData,
      ...data
    }));
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const completeOnboarding = async () => {
    if (isProcessingXtream) return;
    
    setIsProcessingXtream(true);
    
    try {
      // Create user account with email/password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name
          }
        }
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error("Failed to create user account");
      }
      
      // Map subscription plan to MegaOTT plan type
      const planMapping = {
        'free-trial': 'solo',
        'standard': 'solo',
        'premium': 'duo',
        'ultimate': 'family'
      };
      
      const planType = planMapping[userData.subscription.id] || 'solo';
      
      // Create profile with preferences
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        name: userData.name,
        preferred_device: userData.preferredDevice,
        genres: userData.genres,
        subscription_tier: userData.subscription.id,
        subscription_status: 'active',
        trial_end_date: userData.subscription.trialEndDate
      });
      
      if (profileError) {
        throw profileError;
      }
      
      // Create Xtream credentials using edge function
      const { data: xtreamData, error: xtreamError } = await supabase.functions.invoke('create-xtream-account', {
        body: {
          userId: authData.user.id,
          planType: planType,
          name: userData.name,
          email: userData.email
        }
      });
      
      if (xtreamError) {
        throw xtreamError;
      }
      
      // Update user data with Xtream credentials
      updateUserData({
        xtreamCredentials: {
          username: xtreamData.data.username,
          password: xtreamData.data.password,
          playlistUrls: xtreamData.data.playlistUrls
        }
      });
      
      // Proceed to completion page
      handleNext();
      
      // Sign in user after successful onboarding
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });
      
      if (signInError) {
        console.error("Error signing in:", signInError);
        // Continue anyway as the account is created
      }
      
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Onboarding Error",
        description: error.message || "Failed to complete signup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingXtream(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <OnboardingWelcome 
            userData={userData} 
            updateUserData={updateUserData} 
            onNext={handleNext} 
          />
        );
      case 2:
        return (
          <OnboardingDeviceSetup 
            userData={userData} 
            updateUserData={updateUserData} 
            onNext={handleNext} 
            onBack={handleBack} 
          />
        );
      case 3:
        return (
          <OnboardingPreferences 
            userData={userData} 
            updateUserData={updateUserData} 
            onNext={handleNext} 
            onBack={handleBack} 
          />
        );
      case 4:
        return (
          <OnboardingSubscription 
            userData={userData} 
            updateUserData={updateUserData} 
            onNext={completeOnboarding} 
            onBack={handleBack}
            isProcessing={isProcessingXtream}
          />
        );
      case 5:
        return (
          <OnboardingComplete 
            userData={userData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black py-20 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {renderStep()}
      </div>
    </div>
  );
};

export default Onboarding;
