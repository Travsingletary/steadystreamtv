
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OnboardingUserData {
  name: string;
  email: string;
  preferredDevice: string;
  genres: string[];
  subscription: {
    plan: string;
    price: number;
    trialDays: number;
    trialEndDate?: string;
  } | null;
  xtreamCredentials?: {
    username: string;
    password: string;
  };
}

export const useOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isProcessingXtream, setIsProcessingXtream] = useState(false);
  
  const [userData, setUserData] = useState<OnboardingUserData>({
    name: "",
    email: "",
    preferredDevice: "",
    genres: [],
    subscription: null
  });

  // Update user data by merging with existing data
  const updateUserData = (data: Partial<OnboardingUserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  // Check for authentication errors in the URL (after redirects)
  const checkAuthErrors = () => {
    const query = new URLSearchParams(location.search);
    const error = query.get("error");
    const errorDescription = query.get("error_description");
    
    if (error) {
      toast({
        title: "Authentication Error",
        description: errorDescription || "An error occurred during sign-up. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Set default device based on user agent
  const setDefaultDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    let detectedDevice = "web"; // default
    
    if (/(iphone|ipod|ipad)/i.test(userAgent)) {
      detectedDevice = userAgent.indexOf("ipad") !== -1 ? "tablet" : "smartphone";
    } else if (/android/i.test(userAgent)) {
      detectedDevice = userAgent.indexOf("tablet") !== -1 ? "tablet" : "smartphone";
    } else if (/amazon-fire/i.test(userAgent) || /kf[a-z]{2,4}/i.test(userAgent)) {
      detectedDevice = "firestick";
    } else if (/smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast/i.test(userAgent)) {
      detectedDevice = "smart-tv";
    }
    
    updateUserData({ preferredDevice: detectedDevice });
  };

  // Navigation handlers
  const handleNext = () => {
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Complete the onboarding process
  const completeOnboarding = async () => {
    try {
      setIsProcessingXtream(true);
      
      // Sign up user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`.substring(0, 12),
        options: {
          data: {
            name: userData.name,
            preferred_device: userData.preferredDevice
          }
        }
      });

      if (authError) throw authError;
      
      // Create Xtream account via Supabase Edge Function
      const { data: xtreamData, error: xtreamError } = await supabase.functions.invoke('create-xtream-account', {
        body: { 
          name: userData.name, 
          email: userData.email,
          plan: userData.subscription?.plan || 'basic'
        }
      });

      if (xtreamError) throw xtreamError;
      
      // Add user info to profiles table
      if (authData?.user?.id) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + (userData.subscription?.trialDays || 7));
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: userData.name,
            preferred_device: userData.preferredDevice,
            genres: userData.genres,
            subscription_status: 'trial',
            subscription_tier: userData.subscription?.plan || 'basic',
            trial_end_date: trialEndDate.toISOString(),
            xtream_username: xtreamData?.username,
            xtream_password: xtreamData?.password
          });
        
        if (profileError) throw profileError;
      }
      
      // Store Xtream credentials in user data for completion screen
      updateUserData({ 
        xtreamCredentials: { 
          username: xtreamData?.username, 
          password: xtreamData?.password 
        }
      });

      // Move to completion step
      setStep(5);
    } catch (error: any) {
      toast({
        title: "Error Setting Up Account",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingXtream(false);
    }
  };
  
  return {
    step,
    userData,
    isProcessingXtream,
    updateUserData,
    handleNext,
    handleBack,
    completeOnboarding,
    checkAuthErrors,
    setDefaultDevice
  };
};
