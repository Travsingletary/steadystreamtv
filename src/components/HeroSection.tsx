
import { Button } from "@/components/ui/button";
import { CheckCircle, Tv } from "lucide-react";

const HeroSection = () => {
  return (
    <section id="home" className="pt-24 pb-16 md:pt-32 md:pb-24 relative">
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
              <Button size="lg" className="bg-gold hover:bg-gold-dark text-black font-semibold">
                Start Streaming Now
              </Button>
              <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold/10">
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
          
          <div className="md:w-1/2 flex justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative">
              <div className="tv-glow">
                <div className="bg-dark-300 border-2 border-gold/30 rounded-xl overflow-hidden w-full max-w-md aspect-video">
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1586899028174-e7098a71b9ae?q=80&w=1771&auto=format&fit=crop" 
                      alt="SteadyStream TV" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/40 rounded-full p-4">
                        <Tv size={48} className="text-gold" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-dark-200 px-6 py-2 rounded-full border border-gold/20">
                  <span className="text-gold font-semibold">SteadyStream</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
