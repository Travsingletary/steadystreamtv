import { Button } from "@/components/ui/button";
import { CheckCircle, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AspectRatio } from "@/components/ui/aspect-ratio";
const HeroSection = () => {
  const navigate = useNavigate();
  const handleStartStreaming = () => {
    navigate("/onboarding");
  };
  const handleViewPlans = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  return <section id="home" className="pt-24 pb-16 md:pt-32 md:pb-24 relative">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-1/2 space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Premium TV <span className="text-gradient-gold">Streaming</span> Service
            </h1>
            
            <p className="text-gray-300 text-lg md:text-xl max-w-xl">
              Experience the ultimate entertainment with premium channels, live sports, and VOD content on any device.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button size="lg" className="bg-gold hover:bg-gold-dark text-black font-semibold" onClick={handleStartStreaming}>
                Start Streaming Now
              </Button>
              <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold/10" onClick={handleViewPlans}>
                View Plans
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-gold h-5 w-5" />
                <span className="text-gray-200">10,000+ Channels</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-gold h-5 w-5" />
                <span className="text-gray-200">Full HD & 4K Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-gold h-5 w-5" />
                <span className="text-gray-200">24/7 Support</span>
              </div>
            </div>
          </div>
          
          <div style={{
          animationDelay: "0.3s"
        }} className="md:w-1/2 flex justify-center animate-fade-in px-0 py-[20px]">
            <div className="relative">
              {/* Modern Flatscreen TV Design */}
              <div className="tv-flatscreen">
                {/* TV frame with slim bezels */}
                <div className="bg-dark-300 border border-gray-700 rounded-md shadow-lg overflow-hidden w-full max-w-md">
                  {/* TV Stand */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1/3 h-2 bg-gray-700 rounded-b-lg"></div>
                  
                  {/* TV Screen with 16:9 aspect ratio */}
                  <div className="px-[2px] py-[2px]">
                    <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-none bg-slate-950">
                      
                    </AspectRatio>
                  </div>
                </div>
                
                {/* TV Brand Logo below */}
                <div className="relative flex justify-center mt-6">
                  <img alt="SteadyStream TV" src="/lovable-uploads/02b1a674-0365-4ccb-b387-38a69c2c5b7c.png" className="w-1/2 h-auto object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;