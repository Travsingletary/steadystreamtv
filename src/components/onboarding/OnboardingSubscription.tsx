
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star } from "lucide-react";
import { OnboardingUserData } from "@/types/onboarding";

interface OnboardingSubscriptionProps {
  userData: OnboardingUserData;
  updateUserData: (data: Partial<OnboardingUserData>) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  isProcessing: boolean;
}

const subscriptionPlans = [
  {
    id: "free-trial",
    name: "Free Trial",
    price: 0,
    trialDays: 7,
    description: "Perfect for trying out our service",
    features: [
      "7-day free trial",
      "Access to basic channels",
      "1 device connection",
      "Standard video quality"
    ],
    recommended: false
  },
  {
    id: "standard",
    name: "Standard",
    price: 9.99,
    trialDays: 3,
    description: "Great for individuals",
    features: [
      "3-day free trial",
      "Full channel lineup",
      "2 device connections",
      "HD video quality",
      "Mobile apps included"
    ],
    recommended: true
  },
  {
    id: "premium",
    name: "Premium",
    price: 19.99,
    trialDays: 3,
    description: "Best for families",
    features: [
      "3-day free trial",
      "Full channel lineup + premium channels",
      "5 device connections",
      "4K video quality",
      "All apps included",
      "Priority support"
    ],
    recommended: false
  }
];

export const OnboardingSubscription = ({ 
  userData, 
  updateUserData, 
  onNext, 
  onBack,
  isProcessing 
}: OnboardingSubscriptionProps) => {
  const [selectedPlan, setSelectedPlan] = useState(userData.subscription?.plan || "");

  const handleContinue = async () => {
    if (!selectedPlan) {
      return;
    }

    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    if (plan) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + plan.trialDays);
      
      updateUserData({ 
        subscription: {
          plan: plan.id,
          price: plan.price,
          trialDays: plan.trialDays,
          trialEndDate: trialEndDate.toISOString()
        }
      });
    }

    await onNext();
  };

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
      <p className="text-gray-400 mb-8">
        Select the subscription plan that works best for you. All plans include a free trial period.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {subscriptionPlans.map((plan) => (
          <Card 
            key={plan.id}
            className={`cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? "border-gold bg-dark-300"
                : "border-gray-700 bg-dark-300 hover:border-gray-500"
            } ${plan.recommended ? "ring-2 ring-gold/50" : ""}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {plan.name}
                  {plan.recommended && (
                    <Badge className="ml-2 bg-gold text-black">
                      <Star className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                </CardTitle>
                {selectedPlan === plan.id && (
                  <CheckCircle className="h-6 w-6 text-gold" />
                )}
              </div>
              <CardDescription className="text-gray-400">
                {plan.description}
              </CardDescription>
              <div className="text-3xl font-bold text-gold">
                ${plan.price}
                <span className="text-sm text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline"
          className="border-gray-700 text-gray-300"
          onClick={onBack}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button 
          className="bg-gold hover:bg-gold-dark text-black font-semibold flex-1"
          onClick={handleContinue}
          disabled={!selectedPlan || isProcessing}
        >
          {isProcessing ? "Setting up your account..." : "Complete Setup"}
        </Button>
      </div>
    </div>
  );
};
