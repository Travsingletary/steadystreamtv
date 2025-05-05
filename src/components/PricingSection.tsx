
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

// Pricing plan data
const pricingPlans = [
  {
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

const PricingSection = () => {
  return (
    <section id="pricing" className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, <span className="text-gradient-gold">Affordable</span> Plans
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Choose the perfect subscription plan for your streaming needs with no hidden fees or contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pricingPlans.map((plan, index) => (
            <PricingCard 
              key={index} 
              plan={plan}
              delay={0.1 * (index + 1)} 
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
  delay
}: { 
  plan: {
    name: string;
    price: number;
    features: string[];
    isPopular: boolean;
  };
  delay: number;
}) => (
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
      <span className="text-4xl font-bold">${plan.price}</span>
      <span className="text-gray-400">/month</span>
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
    >
      Subscribe Now
    </Button>
  </div>
);

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
