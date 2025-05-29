
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
    playlistUrl?: string;
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

  // Generate a secure password that meets Supabase requirements
  const generateSecurePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Ensure at least one character from each category
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest with random characters from all categories
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

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
      console.log("Starting onboarding completion process...");
      console.log("User data:", userData);
      
      // Generate a secure random password that meets Supabase requirements
      const password = generateSecurePassword();
      console.log("Generated secure password for user");
      
      // Sign up user with Supabase
      console.log("Creating Supabase user...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: password,
        options: {
          data: {
            name: userData.name,
            preferred_device: userData.preferredDevice
          }
        }
      });

      if (authError) {
        console.error("Supabase auth error:", authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      console.log("Supabase user created successfully:", authData?.user?.id);
      
      // Create user profile
      if (authData?.user?.id) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + (userData.subscription?.trialDays || 7));
        
        console.log("Creating user profile...");
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            name: userData.name,
            preferred_device: userData.preferredDevice,
            genres: userData.genres,
            subscription_status: 'trial',
            subscription_tier: userData.subscription?.plan || 'basic',
            trial_end_date: trialEndDate.toISOString()
          });
        
        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
        
        console.log("User profile created successfully");
        
        // Create Xtream account via Supabase Edge Function
        console.log("Creating IPTV account...");
        const { data: xtreamData, error: xtreamError } = await supabase.functions.invoke('create-xtream-account', {
          body: { 
            userId: authData.user.id,
            planType: (userData.subscription?.plan || 'standard').toLowerCase(), 
            email: userData.email,
            name: userData.name
          }
        });

        if (xtreamError) {
          console.error("IPTV account creation error:", xtreamError);
          throw new Error(`IPTV account creation failed: ${xtreamError.message}`);
        }
        
        console.log("IPTV account created successfully:", xtreamData);
        
        // Store Xtream credentials in user data for completion screen
        if (xtreamData?.data) {
          updateUserData({ 
            xtreamCredentials: { 
              username: xtreamData.data.username, 
              password: xtreamData.data.password,
              playlistUrl: xtreamData.data.playlistUrls?.m3u
            }
          });
          console.log("IPTV credentials stored in user data");
        }
      }

      console.log("Onboarding completion successful, moving to step 5");
      // Move to completion step
      setStep(5);
      
      toast({
        title: "Account Created Successfully!",
        description: "Your SteadyStream TV account is ready to use.",
      });
      
    } catch (error: any) {
      console.error("Complete onboarding error:", error);
      toast({
        title: "Error Setting Up Account",
        description: error.message || "An error occurred during account setup. Please try again.",
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
