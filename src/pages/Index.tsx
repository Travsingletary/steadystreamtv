
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import DevicesSection from "@/components/DevicesSection";
import ChannelsSection from "@/components/ChannelsSection";
import PricingSection from "@/components/PricingSection";
import FooterSection from "@/components/FooterSection";
import { Button } from "@/components/ui/button";
import { Calendar, Tv } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <DevicesSection />
      <ChannelsSection />
      <PricingSection />
      
      {/* Quick Access Section */}
      <section className="py-12 bg-dark-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/public/lovable-uploads/1ef1cff2-803f-48c1-8c26-54512fd8f1b6.png"
                alt="SteadyStream Logo"
                className="h-8"
              />
              <h2 className="text-3xl font-bold text-gradient-gold">Quick Access</h2>
            </div>
            <p className="text-gray-300 max-w-2xl">
              Access our web player and automation tools directly from your browser.
              No downloads required!
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-dark-300 rounded-xl p-6 border border-gray-800 flex flex-col items-center text-center">
              <Tv className="h-12 w-12 text-gold mb-4" />
              <h3 className="text-xl font-semibold mb-2">Web Player</h3>
              <p className="text-gray-400 mb-4">
                Stream your favorite channels directly in your browser with our web player.
              </p>
              <Link to="/player" className="mt-auto">
                <Button className="bg-gold hover:bg-gold-dark text-black">
                  Launch Player
                </Button>
              </Link>
            </div>
            
            <div className="bg-dark-300 rounded-xl p-6 border border-gray-800 flex flex-col items-center text-center">
              <Calendar className="h-12 w-12 text-gold mb-4" />
              <h3 className="text-xl font-semibold mb-2">Automation Center</h3>
              <p className="text-gray-400 mb-4">
                Schedule recordings and create automated playlists for your convenience.
              </p>
              <Link to="/automation" className="mt-auto">
                <Button className="bg-gold hover:bg-gold-dark text-black">
                  Open Automation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <FooterSection />
    </div>
  );
};

export default Index;
