import { Tv, Smartphone, Monitor, Laptop } from "lucide-react";
const DevicesSection = () => {
  return <section id="devices" className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Watch on <span className="text-gradient-gold">Any Device</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            SteadyStream TV works seamlessly across all your devices, providing the ultimate flexibility for your entertainment needs.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <DeviceCard icon={<Tv size={40} />} title="Smart TVs" description="Samsung, LG, Android TV" delay={0.1} />
          <DeviceCard icon={<Monitor size={40} />} title="Streaming Devices" description="FireStick, Apple TV, Roku" delay={0.2} />
          <DeviceCard icon={<Smartphone size={40} />} title="Mobile Devices" description="iOS & Android" delay={0.3} />
          <DeviceCard icon={<Laptop size={40} />} title="Computers" description="Windows, Mac & Web" delay={0.4} />
        </div>

        <div className="mt-16 bg-dark-200 rounded-xl border border-gray-800 p-6 md:p-10 opacity-0 animate-fade-in" style={{
        animationDelay: "0.6s"
      }}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h3 className="text-xl md:text-2xl font-bold mb-4">
                Featured App: <span className="text-gold">Firestick Integration</span>
              </h3>
              <ul className="space-y-3 text-gray-300">
                <DeviceFeature text="Easy one-click installation process" />
                <DeviceFeature text="Full DVR functionality with cloud storage" />
                <DeviceFeature text="Multi-room viewing capabilities" />
                <DeviceFeature text="Voice control through Alexa integration" />
                <DeviceFeature text="Personalized recommendations" />
              </ul>
            </div>
            <div className="md:w-1/2 flex justify-center mt-6 md:mt-0 px-0 py-0 bg-black">
              <div className="relative bg-black/50 p-2 rounded-xl border border-gray-800 max-w-sm py-[74px] px-[37px]">
                <img alt="Firestick App Interface" src="/lovable-uploads/5bf14f55-63a7-47a0-9b22-edda005dfece.png" className="rounded-lg w-full object-contain" />
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
const DeviceCard = ({
  icon,
  title,
  description,
  delay
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) => <div className="bg-dark-200 rounded-lg p-6 border border-gray-800 hover:border-gold/30 transition-all duration-300 flex flex-col items-center text-center opacity-0 animate-fade-in" style={{
  animationDelay: `${delay}s`
}}>
    <div className="bg-gold/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
      <div className="text-gold">{icon}</div>
    </div>
    <h3 className="text-lg font-semibold mb-1 text-white">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </div>;
const DeviceFeature = ({
  text
}: {
  text: string;
}) => <li className="flex items-center gap-2">
    <div className="bg-gold/20 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
      <div className="w-2 h-2 bg-gold rounded-full"></div>
    </div>
    <span>{text}</span>
  </li>;
export default DevicesSection;