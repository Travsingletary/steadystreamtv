
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import { nowPaymentsService } from "@/services/nowPaymentsService";

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
        
        const orderId = searchParams.get('order_id');
        let userId = searchParams.get('user_id');

        console.log("Order ID:", orderId);
        console.log("User ID from URL:", userId);

        if (!orderId) {
          console.error("No order ID found in URL params");
          setError("Payment order not found. Please complete the onboarding process again.");
          setIsProcessing(false);
          return;
        }

        // Get current authenticated user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          console.error("User authentication error:", userError);
          setError("User authentication failed. Please sign in and try again.");
          setIsProcessing(false);
          return;
        }

        // Use the authenticated user's ID
        userId = userData.user.id;
        console.log("Using authenticated user ID:", userId);

        // Verify payment completion with NOWPayments service
        console.log("Verifying payment completion...");
        const paymentCompleted = await nowPaymentsService.processPaymentCompletion(orderId, userId);

        if (!paymentCompleted) {
          console.error("Payment verification failed");
          setError("Payment verification failed. Please contact support.");
          setIsProcessing(false);
          return;
        }

        console.log("Payment verified successfully");

        // Try to get onboarding data from storage first
        let onboardingDataStr = localStorage.getItem('onboarding-data');
        if (!onboardingDataStr) {
          onboardingDataStr = sessionStorage.getItem('onboarding-data');
        }
        
        let onboardingData = null;
        if (onboardingDataStr) {
          console.log("Found onboarding data in storage");
          onboardingData = JSON.parse(onboardingDataStr);
          // Update the user ID in onboarding data to match authenticated user
          onboardingData.userId = userId;
        } else {
          console.log("No onboarding data in storage, creating minimal data");
          
          onboardingData = {
            userId: userId,
            email: userData.user.email,
            name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
            preferredDevice: "web",
            genres: [],
            subscription: {
              plan: "premium", // Default, will be updated from Stripe
              name: "Premium",
              price: 35,
              trialDays: 30
            }
          };
          console.log("Created minimal onboarding data from user:", onboardingData);
        }
        
        console.log("Using onboarding data:", onboardingData);
        
        // Create or update the user profile
        console.log("Creating/updating user profile...");
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: onboardingData.email,
            name: onboardingData.name,
            preferred_device: onboardingData.preferredDevice || "web",
            genres: onboardingData.genres || [],
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
              toast.error("Account created but streaming setup failed. You can set this up later in your dashboard.");
            } else if (xtreamData?.data?.username && xtreamData?.data?.password) {
              console.log("Xtream account created successfully");
              
              // Update profile with Xtream credentials
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  xtream_username: xtreamData.data.username,
                  xtream_password: xtreamData.data.password,
                  updated_at: new Date().toISOString()
                })
                .eq('id', userId);

              if (updateError) {
                console.error("Failed to update profile with Xtream credentials:", updateError);
              } else {
                console.log("Profile updated with Xtream credentials");
              }
            }
          } catch (xtreamError) {
            console.error("Xtream account creation failed:", xtreamError);
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

        // Clear onboarding data from both storages
        localStorage.removeItem('onboarding-data');
        sessionStorage.removeItem('onboarding-data');
        
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
