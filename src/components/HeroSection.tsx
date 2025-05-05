
import { Button } from "@/components/ui/button";
import { CheckCircle, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  
  const handleStartStreaming = () => {
    navigate("/onboarding");
  };
  
  const handleViewPlans = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
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
              <Button 
                size="lg" 
                className="bg-gold hover:bg-gold-dark text-black font-semibold"
                onClick={handleStartStreaming}
              >
                Start Streaming Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gold text-gold hover:bg-gold/10"
                onClick={handleViewPlans}
              >
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
              <div className="tv-glow">
                <div className="bg-dark-300 border-2 border-gold/30 rounded-xl overflow-hidden w-full max-w-md aspect-video">
                  <div className="relative rounded-3xl bg-black px-[48px] my-[7px] mx-0 py-[14px]">
                    <img 
                      alt="Family on couch with remote control" 
                      src="https://images.unsplash.com/photo-1600210492493-0946911123ea" 
                      className="w-full h-full object-cover rounded" 
                    />
                  </div>
                </div>
                
                <div className="relative flex justify-center mt-6">
                  <img 
                    alt="SteadyStream TV" 
                    src="/lovable-uploads/f52a5114-91be-4cee-8320-5125cabacc9f.png" 
                    className="w-1/2 h-auto object-contain" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};

export default HeroSection;
