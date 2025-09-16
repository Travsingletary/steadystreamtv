
import { Tv, Mail, Phone } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-dark-200 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/lovable-uploads/595f3348-0a60-4bbf-ad62-144c2ab406c1.png"
                alt="SteadyStream Logo"
                className="h-10"
              />
              <span className="font-bold text-gold text-xl">
                SteadyStream TV
              </span>
            </div>
            <p className="text-gray-400 mb-6">
              Premium IPTV service offering thousands of channels and VOD content worldwide.
            </p>
            <div className="flex space-x-4">
              <SocialIcon icon="facebook" />
              <SocialIcon icon="twitter" />
              <SocialIcon icon="instagram" />
              <SocialIcon icon="youtube" />
            </div>
          </div>

          <div className="col-span-1">
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <FooterLink href="#home">Home</FooterLink>
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#devices">Devices</FooterLink>
              <FooterLink href="#channels">Channels</FooterLink>
              <FooterLink href="#pricing">Pricing</FooterLink>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-white font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <FooterLink href="#">Terms of Service</FooterLink>
              <FooterLink href="#">Privacy Policy</FooterLink>
              <FooterLink href="#">Refund Policy</FooterLink>
              <FooterLink href="#">FAQ</FooterLink>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-400">
                <Mail size={18} className="text-gold" />
                <span>support@steadystream.tv</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone size={18} className="text-gold" />
                <span>+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} SteadyStream TV. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon }: { icon: string }) => (
  <a
    href="#"
    className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gold hover:text-black transition-colors"
  >
    <span className="sr-only">{icon}</span>
    <i className={`fab fa-${icon}`}></i>
  </a>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <a href={href} className="text-gray-400 hover:text-gold transition-colors">
      {children}
    </a>
  </li>
);

export default FooterSection;
