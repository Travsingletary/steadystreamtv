
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeOnboarding = async () => {
      try {
        console.log("Processing payment success...");
        console.log("Current URL:", window.location.href);
        console.log("Search params:", Object.fromEntries(searchParams.entries()));
        
        // Get onboarding data from localStorage
        const onboardingDataStr = localStorage.getItem('onboarding-data');
        if (!onboardingDataStr) {
          console.error("No onboarding data found in localStorage");
          throw new Error("No onboarding data found. Please restart the onboarding process.");
        }
        
        const onboardingData = JSON.parse(onboardingDataStr);
        console.log("Retrieved onboarding data:", onboardingData);
        
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          console.error("No session ID found in URL params");
          throw new Error("No payment session ID found. Please contact support.");
        }
        
        console.log("Payment session ID:", sessionId);
        
        // Create or update the user profile
        console.log("Creating/updating user profile...");
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: onboardingData.userId,
            email: onboardingData.email,
            name: onboardingData.name,
            preferred_device: onboardingData.preferredDevice,
            genres: onboardingData.genres,
            subscription_tier: onboardingData.subscription?.plan || null,
            subscription_status: 'active',
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
        if (onboardingData.subscription && onboardingData.subscription.plan !== "free-trial") {
          console.log("Creating Xtream account...");
          
          try {
            const { data: xtreamData, error: xtreamError } = await supabase.functions.invoke('create-xtream-account', {
              body: {
                email: onboardingData.email,
                name: onboardingData.name,
                planId: onboardingData.subscription.plan
              }
            });

            if (xtreamError) {
              console.error("Xtream account creation error:", xtreamError);
              // Don't throw here - allow onboarding to continue even if Xtream fails
              toast.error("Account created but streaming setup failed. You can set this up later in your dashboard.");
            } else if (xtreamData?.username && xtreamData?.password) {
              console.log("Xtream account created successfully");
              
              // Update profile with Xtream credentials
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  xtream_username: xtreamData.username,
                  xtream_password: xtreamData.password,
                  updated_at: new Date().toISOString()
                })
                .eq('id', onboardingData.userId);

              if (updateError) {
                console.error("Failed to update profile with Xtream credentials:", updateError);
              } else {
                console.log("Profile updated with Xtream credentials");
              }
            }
          } catch (xtreamError) {
            console.error("Xtream account creation failed:", xtreamError);
            // Don't throw - allow onboarding to continue even if Xtream fails
            toast.error("Account created but streaming setup failed. You can set this up later in your dashboard.");
          }
        }

        // Send welcome email
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: onboardingData.email,
              name: onboardingData.name
            }
          });
          console.log("Welcome email sent");
        } catch (emailError) {
          console.error("Welcome email failed:", emailError);
          // Don't throw - this is not critical
        }

        // Clear onboarding data from localStorage
        localStorage.removeItem('onboarding-data');
        
        setIsProcessing(false);
        toast.success("Welcome to SteadyStream TV! Your account has been created successfully.");
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);

      } catch (error: any) {
        console.error("Complete onboarding error:", error);
        setError(error.message || "Failed to complete onboarding. Please try again.");
        setIsProcessing(false);
      }
    };

    completeOnboarding();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-black py-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-dark-200 rounded-xl border border-gray-800 p-8 text-center">
          <div className="inline-flex items-center justify-center bg-red-500/20 rounded-full p-4 mb-4">
            <span className="text-red-500 text-xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">Payment Processing Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => navigate("/onboarding")}
            className="bg-gold hover:bg-gold-dark text-black font-semibold px-6 py-3 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-20 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-dark-200 rounded-xl border border-gray-800 p-8 text-center">
        <div className="inline-flex items-center justify-center bg-green-500/20 rounded-full p-4 mb-4">
          {isProcessing ? (
            <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
          ) : (
            <CheckCircle className="h-8 w-8 text-green-500" />
          )}
        </div>
        <h1 className="text-2xl font-bold mb-4">
          {isProcessing ? "Setting Up Your Account..." : "Payment Successful!"}
        </h1>
        <p className="text-gray-400 mb-6">
          {isProcessing 
            ? "We're creating your account and setting up your streaming services. This will only take a moment."
            : "Your SteadyStream TV account has been created successfully. Redirecting to your dashboard..."
          }
        </p>
        {isProcessing && (
          <div className="text-sm text-gray-500">
            Please don't close this page while we complete your setup.
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
