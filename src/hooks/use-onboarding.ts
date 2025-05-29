
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { detectDevice } from "@/utils/deviceDetection";
import { useAuthErrorHandler } from "@/utils/errorHandling";
import { createUserAccount, createUserProfile, createXtreamAccount } from "@/services/authService";
import { OnboardingUserData } from "@/types/onboarding";

export const useOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkAuthErrors } = useAuthErrorHandler();
  
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

  // Set default device based on user agent
  const setDefaultDevice = () => {
    const detectedDevice = detectDevice();
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
      
      // Create user account
      const authData = await createUserAccount(userData);
      
      // Create user profile
      if (authData?.user?.id) {
        await createUserProfile(authData.user.id, userData);
        
        // Create Xtream account
        const xtreamData = await createXtreamAccount(authData.user.id, userData);
        
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
