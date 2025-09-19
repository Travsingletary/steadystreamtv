
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { nowPaymentsService, NOWPAYMENTS_CURRENCIES } from "@/services/nowPaymentsService";
import { cardToCryptoService, RECEIVE_CURRENCIES } from "@/services/cardToCryptoService";

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
  const [selectedCrypto, setSelectedCrypto] = useState<string>('usdt');
  const [paymentMethod, setPaymentMethod] = useState<'card-to-crypto' | 'crypto-only'>('card-to-crypto');
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
      
      // Create payment based on selected method
      let paymentResponse;
      if (paymentMethod === 'card-to-crypto') {
        console.log("Creating card-to-crypto payment...");
        paymentResponse = await cardToCryptoService.createPayment(
          selectedPlan as 'standard' | 'premium' | 'ultimate',
          'ETH', // Always use ETH for card-to-crypto payments
          authData.user.id,
          userData.email
        );
      } else {
        console.log("Creating NOWPayments crypto payment...");
        paymentResponse = await nowPaymentsService.createPayment(
          selectedPlan as 'standard' | 'premium' | 'ultimate',
          selectedCrypto,
          authData.user.id,
          userData.email
        );
      }

      if (paymentResponse?.payment_url || paymentResponse?.invoice_url) {
        const paymentUrl = paymentResponse.payment_url || paymentResponse.invoice_url;
        console.log("Redirecting to payment URL:", paymentUrl);
        // Redirect to payment page
        window.location.href = paymentUrl;
      } else {
        throw new Error("No payment URL returned");
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

      {selectedPlan && (
        <>
          {/* Payment Method Selector */}
          <div className="bg-gradient-to-r from-gold/20 to-gold/10 border-2 border-gold/50 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gold mb-4 text-center">
              💳 Choose How to Pay
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Card-to-Crypto Option - Featured */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === 'card-to-crypto'
                    ? 'border-gold bg-gold/20 shadow-lg shadow-gold/20'
                    : 'border-gray-600 hover:border-gold/50'
                }`}
                onClick={() => setPaymentMethod('card-to-crypto')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-6 h-6 text-gold" />
                  <h4 className="font-bold text-white">Pay with Card</h4>
                  <span className="bg-gold text-black text-xs px-2 py-1 rounded font-bold">RECOMMENDED</span>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  Pay with any credit/debit card. Simple and secure.
                </p>
                <div className="text-xs text-gray-400">
                  • Works with Visa, MasterCard, Amex<br/>
                  • Instant setup<br/>
                  • Secure payment processing
                </div>
              </div>

              {/* Crypto-Only Option */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === 'crypto-only'
                    ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                    : 'border-gray-600 hover:border-blue-500/50'
                }`}
                onClick={() => setPaymentMethod('crypto-only')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">₿</span>
                  </div>
                  <h4 className="font-bold text-white">Crypto Only</h4>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  Pay directly with cryptocurrency from your wallet.
                </p>
                <div className="text-xs text-gray-400">
                  • Requires crypto wallet<br/>
                  • 300+ supported currencies<br/>
                  • Direct crypto payments
                </div>
              </div>
            </div>

            {/* Currency Selection - Only show for crypto-only */}
            {paymentMethod === 'crypto-only' && (
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-lg font-semibold mb-3">Select Cryptocurrency</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Choose from 300+ supported cryptocurrencies for instant payments.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {NOWPAYMENTS_CURRENCIES.map((crypto) => (
                    <button
                      key={crypto.code}
                      onClick={() => setSelectedCrypto(crypto.code)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedCrypto === crypto.code
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold">{crypto.symbol} {crypto.code}</div>
                      <div className="text-xs text-gray-400">{crypto.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Card Payment Info - No currency selection needed */}
            {paymentMethod === 'card-to-crypto' && (
              <div className="border-t border-gray-700 pt-4">
                <div className="text-center">
                  <h4 className="text-lg font-semibold mb-2">Secure Card Payment</h4>
                  <p className="text-sm text-gray-400">
                    Your payment will be processed securely with industry-standard encryption.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

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
          {isButtonDisabled ? "Processing..." : 
            paymentMethod === 'card-to-crypto' ? "💳 Pay with Card" : "₿ Pay with Crypto"
          }
        </Button>
      </div>
    </div>
  );
};
