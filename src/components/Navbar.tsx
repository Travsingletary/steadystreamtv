
import { useState, useEffect } from "react";
import { Tv, Home, List, Monitor, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigation = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (sectionId.startsWith('/')) {
      navigate(sectionId);
    } else {
      const element = document.getElementById(sectionId.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-dark-100/95 backdrop-blur-md py-3 shadow-lg" : "bg-transparent py-5"}`}>
      <div className="container mx-auto px-4 flex items-center justify-between py-[65px]">
        <a href="#home" className="flex items-center gap-2" onClick={(e) => handleNavigation('#home', e)}>
          <img src="/public/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" alt="SteadyStream Logo" className="h-16 object-contain" />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="#home" icon={<Home size={16} />} onClick={(e) => handleNavigation('#home', e)}>
            Home
          </NavLink>
          <NavLink href="#features" icon={<List size={16} />} onClick={(e) => handleNavigation('#features', e)}>
            Features
          </NavLink>
          <NavLink href="#devices" icon={<Monitor size={16} />} onClick={(e) => handleNavigation('#devices', e)}>
            Devices
          </NavLink>
          <NavLink href="#channels" icon={<Tv size={16} />} onClick={(e) => handleNavigation('#channels', e)}>
            Channels
          </NavLink>
          <NavLink href="#pricing" icon={<Play size={16} />} onClick={(e) => handleNavigation('#pricing', e)}>
            Plans
          </NavLink>
          <NavLink href="/player" icon={<Play size={16} />} onClick={(e) => handleNavigation('/player', e)}>
            Web Player
          </NavLink>
        </nav>

        <div className="hidden md:block">
          <Button className="bg-gold hover:bg-gold-dark text-black font-medium" onClick={handleGetStarted}>
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white p-2 focus:outline-none" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <List className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && <div className="md:hidden bg-dark-200 border-t border-gray-800">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <MobileNavLink href="#home" onClick={(e) => handleNavigation('#home', e)}>
              Home
            </MobileNavLink>
            <MobileNavLink href="#features" onClick={(e) => handleNavigation('#features', e)}>
              Features
            </MobileNavLink>
            <MobileNavLink href="#devices" onClick={(e) => handleNavigation('#devices', e)}>
              Devices
            </MobileNavLink>
            <MobileNavLink href="#channels" onClick={(e) => handleNavigation('#channels', e)}>
              Channels
            </MobileNavLink>
            <MobileNavLink href="#pricing" onClick={(e) => handleNavigation('#pricing', e)}>
              Plans
            </MobileNavLink>
            <MobileNavLink href="/player" onClick={(e) => handleNavigation('/player', e)}>
              Web Player
            </MobileNavLink>
            <Button className="bg-gold hover:bg-gold-dark text-black font-medium w-full" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>}
    </header>;
};

const NavLink = ({
  href,
  children,
  icon,
  onClick
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}) => (
  <a 
    href={href} 
    className="text-gray-300 hover:text-gold transition-colors flex items-center gap-1.5 text-sm font-medium"
    onClick={onClick}
  >
    {icon}
    {children}
  </a>
);

const MobileNavLink = ({
  href,
  children,
  onClick
}: {
  href: string;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}) => (
  <a 
    href={href} 
    className="text-gray-300 hover:text-gold py-2 transition-colors block text-center font-medium" 
    onClick={onClick}
  >
    {children}
  </a>
);

export default Navbar;
