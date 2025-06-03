
import React from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import DevicesSection from "@/components/DevicesSection";
import ChannelsSection from "@/components/ChannelsSection";
import PricingSection from "@/components/PricingSection";
import FooterSection from "@/components/FooterSection";
import { IntegratedAutomation } from "@/components/AutomationComponents";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      
      {/* Add automation button after hero section */}
      <section className="container mx-auto px-6 py-8 text-center">
        <IntegratedAutomation className="text-lg" />
        <p className="text-sm text-gray-400 mt-4">
          ✅ No credit card required • ✅ Instant activation • ✅ Cancel anytime
        </p>
      </section>
      
      <FeaturesSection />
      <DevicesSection />
      <ChannelsSection />
      <PricingSection />
      <FooterSection />
    </div>
  );
};

export default Index;
