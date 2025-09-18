
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Pricing plan data with duration options
const pricingPlans = [
  {
    id: "standard",
    name: "Standard",
    prices: {
      monthly: { price: 20, planId: "standard" },
      "6months": { price: 100, planId: "standard-6m", savings: "17%" },
      "12months": { price: 180, planId: "standard-12m", savings: "25%" }
    },
    features: [
      "7,000+ Live TV Channels",
      "Standard VOD Library",
      "HD Quality Streaming",
      "1 Device Connection",
      "24/7 Basic Support",
      "3 Connection Types"
    ],
    isPopular: false
  },
  {
    id: "premium",
    name: "Premium",
    prices: {
      monthly: { price: 35, planId: "premium" },
      "6months": { price: 180, planId: "premium-6m", savings: "14%" },
      "12months": { price: 315, planId: "premium-12m", savings: "25%" }
    },
    features: [
      "10,000+ Live TV Channels",
      "Extended VOD Library",
      "Full HD Streaming",
      "2 Device Connections",
      "24/7 Premium Support",
      "All Connection Types",
      "DVR Functionality"
    ],
    isPopular: true
  },
  {
    id: "ultimate",
    name: "Ultimate",
    prices: {
      monthly: { price: 45, planId: "ultimate" },
      "6months": { price: 225, planId: "ultimate-6m", savings: "17%" },
      "12months": { price: 405, planId: "ultimate-12m", savings: "25%" }
    },
    features: [
      "10,000+ Live TV Channels",
      "Complete VOD Library",
      "4K Ultra HD Streaming",
      "3 Device Connections",
      "24/7 Priority Support",
      "All Connection Types",
      "Advanced DVR Functionality",
      "Premium Sports Packages"
    ],
    isPopular: false
  }
];

const PricingSection = () => {
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<"monthly" | "6months" | "12months">("monthly");
  const navigate = useNavigate();

  const handleSubscribe = async (planId: string, price: number) => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // User is logged in, process subscription through dashboard
      navigate("/dashboard");
    } else {
      // User is not logged in, redirect to onboarding
      navigate("/onboarding");
    }
  };

  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case "monthly": return "Monthly";
      case "6months": return "6 Months";
      case "12months": return "12 Months";
      default: return "Monthly";
    }
  };

  return (
    <section id="pricing" className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, <span className="text-gradient-gold">Affordable</span> Plans
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Choose the perfect subscription plan for your streaming needs with no hidden fees or contracts.
          </p>

          {/* Duration Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-dark-200 rounded-lg p-1 border border-gray-800">
              {(["monthly", "6months", "12months"] as const).map((duration) => (
                <button
                  key={duration}
                  onClick={() => setSelectedDuration(duration)}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedDuration === duration
                      ? "bg-gold text-black"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {getDurationLabel(duration)}
                  {duration !== "monthly" && (
                    <span className="ml-1 text-xs">
                      (Save {duration === "6months" ? "15%" : "25%"})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              plan={plan}
              selectedDuration={selectedDuration}
              delay={0.1 * (index + 1)}
              onSubscribe={handleSubscribe}
              processingPayment={processingPayment}
            />
          ))}
        </div>

        <div className="max-w-3xl mx-auto bg-dark-200 rounded-xl border border-gray-800 p-6 md:p-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.7s" }}>
          <h3 className="text-xl font-bold mb-4 text-center">
            <span className="text-gradient-gold">Frequently Asked Questions</span>
          </h3>
          <div className="space-y-4">
            <FaqItem 
              question="How do I get started with SteadyStream TV?"
              answer="After subscribing, you'll receive account credentials and instructions to download our app on your preferred device. Setup takes just a few minutes."
            />
            <FaqItem 
              question="What devices are compatible with SteadyStream TV?"
              answer="Our service is compatible with Amazon Firestick, Android/iOS devices, Smart TVs, computers, and most streaming devices with internet access."
            />
            <FaqItem 
              question="Do you offer refunds?"
              answer="We offer a 24-hour satisfaction guarantee. If you're not satisfied with our service, contact support within 24 hours of purchase for a full refund."
            />
            <FaqItem 
              question="Is there a contract or commitment?"
              answer="No contracts or long-term commitments. All plans are month-to-month and can be canceled at any time."
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const PricingCard = ({
  plan,
  selectedDuration,
  delay,
  onSubscribe,
  processingPayment
}: {
  plan: {
    id: string;
    name: string;
    prices: {
      monthly: { price: number; planId: string };
      "6months": { price: number; planId: string; savings: string };
      "12months": { price: number; planId: string; savings: string };
    };
    features: string[];
    isPopular: boolean;
  };
  selectedDuration: "monthly" | "6months" | "12months";
  delay: number;
  onSubscribe: (planId: string, price: number) => void;
  processingPayment: boolean;
}) => {
  const currentPrice = plan.prices[selectedDuration];
  const monthlyEquivalent = selectedDuration === "monthly"
    ? currentPrice.price
    : Math.round(currentPrice.price / (selectedDuration === "6months" ? 6 : 12));

  return (
  <div 
    className={`rounded-xl p-6 border transition-all duration-300 relative flex flex-col opacity-0 animate-fade-in ${
      plan.isPopular 
        ? "tv-glow bg-dark-200 border-gold" 
        : "bg-dark-200 border-gray-800 hover:border-gold/30"
    }`}
    style={{ animationDelay: `${delay}s` }}
  >
    {plan.isPopular && (
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-gold text-black text-xs font-bold uppercase px-3 py-1 rounded-full shadow-lg">
          Most Popular
        </div>
      </div>
    )}
    <h3 className="text-xl font-bold mb-2 mt-2">{plan.name}</h3>
    <div className="mb-4">
      {selectedDuration === "monthly" ? (
        <>
          <span className="text-4xl font-bold">${currentPrice.price}</span>
          <span className="text-gray-400">/month</span>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">${currentPrice.price}</span>
            <span className="text-gray-400">/{selectedDuration === "6months" ? "6 months" : "year"}</span>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            ${monthlyEquivalent}/month equivalent
            {"savings" in currentPrice && (
              <span className="ml-2 bg-gold/20 text-gold px-2 py-1 rounded text-xs">
                Save {currentPrice.savings}
              </span>
            )}
          </div>
        </>
      )}
    </div>
    <ul className="space-y-3 mb-8 flex-grow">
      {plan.features.map((feature, index) => (
        <li key={index} className="flex items-start gap-2">
          <CheckCircle className="text-gold h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="text-gray-300 text-sm">{feature}</span>
        </li>
      ))}
    </ul>
    <Button
      className={plan.isPopular ? "bg-gold hover:bg-gold-dark text-black" : "bg-gray-800 hover:bg-gray-700"}
      size="lg"
      onClick={() => onSubscribe(currentPrice.planId, currentPrice.price)}
      disabled={processingPayment}
    >
      {processingPayment ? "Processing..." : "Subscribe Now"}
    </Button>
  </div>
  );
};

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-800 pb-4">
      <button 
        className="flex justify-between items-center w-full text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-white">{question}</span>
        <span className={`text-gold transition-transform ${isOpen ? "transform rotate-45" : ""}`}>+</span>
      </button>
      {isOpen && (
        <div className="mt-2 text-gray-400 text-sm">
          {answer}
        </div>
      )}
    </div>
  );
};

export default PricingSection;
