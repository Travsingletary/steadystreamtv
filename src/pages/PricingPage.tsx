
import React from 'react';
import Navbar from "@/components/Navbar";
import PricingSection from "@/components/PricingSection";
import FooterSection from "@/components/FooterSection";

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-20">
        <PricingSection />
      </div>
      <FooterSection />
    </div>
  );
};

export default PricingPage;
