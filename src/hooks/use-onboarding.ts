
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

      // Ensure we have a Supabase user session
      console.log("Ensuring Supabase user session...");
      let userId: string | null = null;
      const { data: userResp } = await supabase.auth.getUser();
      if (userResp.user) {
        userId = userResp.user.id;
      } else {
        const generatedPassword = (userData as any).password || Math.random().toString(36).slice(2) + '!Aa1';
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: generatedPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
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

        userId = authData.user.id;

        // Ensure active session
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          await supabase.auth.signInWithPassword({ email: userData.email, password: generatedPassword });
        }
      }

      console.log("Supabase user ready:", userId);

      // Create or update user profile in our public table
      console.log("Creating/updating user profile...");
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          supabase_user_id: userId!,
          email: userData.email,
          full_name: userData.name,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'supabase_user_id'
        });

      if (profileError) {
        console.error("Profile creation/update error:", profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log("Profile created/updated successfully");

      // Create subscription record if subscription is selected
      if (userData.subscription && userData.subscription.plan !== "free-trial") {
        console.log("Creating subscription record...");
        
        try {
          // Generate a payment ID for the subscription
          const paymentId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert({
              customer_email: userData.email,
              customer_name: userData.name,
              plan_id: userData.subscription.plan,
              plan_name: userData.subscription.plan.replace('_', ' ').toUpperCase(),
              plan_price: userData.subscription.plan === 'premium' ? 19.99 : 9.99,
              payment_id: paymentId,
              payment_method: 'onboarding',
              payment_status: 'completed',
              status: 'active',
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              user_id: userId!
            });

          if (subscriptionError) {
            console.error("Subscription creation error:", subscriptionError);
            throw new Error(`Subscription creation failed: ${subscriptionError.message}`);
          }

          console.log("Subscription record created successfully");

          // Create MegaOTT account
          const { data: xtreamData, error: xtreamError } = await supabase.functions.invoke('create-xtream-account', {
            body: {
              userId: userId!,
              email: userData.email,
              name: userData.name,
              planType: userData.subscription.plan
            }
          });

          if (xtreamError) {
            console.error("Xtream account creation error:", xtreamError);
          } else if (xtreamData?.username && xtreamData?.password) {
            console.log("Xtream account created successfully");
            
            // Update subscription with IPTV credentials
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                iptv_username: xtreamData.username,
                iptv_password: xtreamData.password,
                m3u_url: xtreamData?.playlistUrls?.m3u_plus || xtreamData?.playlistUrls?.m3u || null,
                xtream_url: xtreamData?.server_url || null,
                megaott_user_id: xtreamData?.subscription_id || null
              })
              .eq('payment_id', paymentId);

            if (updateError) {
              console.error("Failed to update subscription with IPTV credentials:", updateError);
            } else {
              console.log("Subscription updated with IPTV credentials");
            }
          }
        } catch (error) {
          console.error("Subscription setup failed:", error);
          toast.error("Account created but subscription setup failed. You can set this up later in your dashboard.");
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
