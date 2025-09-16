
import { 
  Tv, 
  Smartphone, 
  Monitor, 
  Laptop, 
  VideoIcon,
  Film, 
  Calendar,
  Clock 
} from "lucide-react";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 bg-dark-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="text-gradient-gold">SteadyStream TV</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Our premium IPTV service delivers unmatched entertainment with top features designed for the ultimate viewing experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Tv />}
            title="10,000+ Live Channels"
            description="Access thousands of channels from around the world with crystal clear HD quality streaming."
            delay={0.1}
          />
          <FeatureCard
            icon={<Film />}
            title="Extensive VOD Library"
            description="Enjoy our vast collection of movies and TV shows available on-demand anytime you want."
            delay={0.2}
          />
          <FeatureCard
            icon={<Calendar />}
            title="Live Sports Coverage"
            description="Never miss a match with comprehensive live sports coverage across all major leagues and tournaments."
            delay={0.3}
          />
          <FeatureCard
            icon={<Smartphone />}
            title="Multi-Device Support"
            description="Stream seamlessly across all your devices including smartphones, tablets, smart TVs, and computers."
            delay={0.4}
          />
          <FeatureCard
            icon={<Clock />}
            title="DVR Functionality"
            description="Record your favorite shows and watch them later with our cloud DVR feature on supported devices."
            delay={0.5}
          />
          <FeatureCard
            icon={<VideoIcon />}
            title="Premium Content"
            description="Access premium channels and exclusive content not available on regular streaming platforms."
            delay={0.6}
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description,
  delay
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay: number;
}) => (
  <div 
    className="bg-dark-200 rounded-lg p-6 border border-gray-800 hover:border-gold/30 transition-all duration-300 opacity-0 animate-fade-in"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="bg-gold/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
      <div className="text-gold">{icon}</div>
    </div>
    <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

export default FeaturesSection;
