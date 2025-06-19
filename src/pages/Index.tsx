
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FooterSection from "@/components/FooterSection";
import EnhancedAutomation from "@/components/EnhancedAutomation";
import { EnhancedOnboarding } from "@/components/EnhancedOnboarding";

const Index = () => {
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          navigate('/customer-dashboard');
        }
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        navigate('/customer-dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (showOnboarding) {
    return <EnhancedOnboarding />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main>
        <HeroSection />
        
        {/* Enhanced Automation Section */}
        <section className="py-20 bg-dark-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">
              Get Started in Under 60 Seconds
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Our enhanced automation system creates your account, sets up your IPTV service, 
              and sends you everything you need to start streaming immediately.
            </p>
            <div className="flex justify-center gap-4">
              <EnhancedAutomation />
              <button 
                onClick={() => setShowOnboarding(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200"
              >
                📋 Guided Setup
              </button>
            </div>
          </div>
        </section>
        
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Index;
