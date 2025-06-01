
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingUserData } from "@/types/onboarding";
import { toast } from "sonner";
import { detectDevice } from "@/utils/deviceDetection";

export const useOnboarding = () => {
  const [step, setStep] = useState(1);
  const [isProcessingXtream, setIsProcessingXtream] = useState(false);
  const [userData, setUserData] = useState<OnboardingUserData>({
    name: "",
    email: "",
    preferredDevice: "",
    genres: [],
    subscription: null,
  });
  const navigate = useNavigate();

  const updateUserData = (data: Partial<OnboardingUserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const checkAuthErrors = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      console.error('Auth error:', error, errorDescription);
      toast.error(`Authentication failed: ${errorDescription || error}`);
    }
  };

  const setDefaultDevice = () => {
    if (!userData.preferredDevice) {
      const detectedDevice = detectDevice();
      updateUserData({ preferredDevice: detectedDevice });
    }
  };

  const completeOnboarding = async () => {
    try {
      console.log("Starting user account creation process...");
      console.log("User data:", userData);
      
      setIsProcessingXtream(true);

      // Sign up the user with Supabase Auth
      console.log("Creating Supabase user...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: (userData as any).password,
        options: {
          data: {
            name: userData.name,
          }
        }
      });

      if (authError) {
        console.error("Supabase auth error:", authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      console.log("Supabase user created successfully:", authData.user.id);

      // Use UPSERT to create or update the profile
      console.log("Creating/updating user profile...");
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          preferred_device: userData.preferredDevice,
          genres: userData.genres,
          subscription_tier: userData.subscription?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error("Profile creation/update error:", profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log("Profile created/updated successfully");

      // Create Xtream account if subscription is selected
      if (userData.subscription && userData.subscription.id !== "free-trial") {
        console.log("Creating Xtream account...");
        
        try {
          const { data: xtreamData, error: xtreamError } = await supabase.functions.invoke('create-xtream-account', {
            body: {
              email: userData.email,
              name: userData.name,
              planId: userData.subscription.id
            }
          });

          if (xtreamError) {
            console.error("Xtream account creation error:", xtreamError);
            throw new Error(`Xtream account creation failed: ${xtreamError.message}`);
          }

          if (xtreamData?.username && xtreamData?.password) {
            console.log("Xtream account created successfully");
            
            // Update profile with Xtream credentials
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                xtream_username: xtreamData.username,
                xtream_password: xtreamData.password,
                updated_at: new Date().toISOString()
              })
              .eq('id', authData.user.id);

            if (updateError) {
              console.error("Failed to update profile with Xtream credentials:", updateError);
            } else {
              console.log("Profile updated with Xtream credentials");
            }
          }
        } catch (xtreamError) {
          console.error("Xtream account creation failed:", xtreamError);
          // Don't throw here - allow onboarding to continue even if Xtream fails
          toast.error("Account created but streaming setup failed. You can set this up later in your dashboard.");
        }
      }

      // Send welcome email
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: userData.email,
            name: userData.name
          }
        });
        console.log("Welcome email sent");
      } catch (emailError) {
        console.error("Welcome email failed:", emailError);
        // Don't throw - this is not critical
      }

      setStep(5); // Move to completion step
      toast.success("Welcome to SteadyStream TV! Your account has been created successfully.");
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);

    } catch (error: any) {
      console.error("Complete onboarding error:", error);
      toast.error(error.message || "Failed to complete onboarding. Please try again.");
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
