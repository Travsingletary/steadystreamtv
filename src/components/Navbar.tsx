
import { useState, useEffect } from "react";
import { Tv, Home, List, Monitor, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  return <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-dark-100/95 backdrop-blur-md py-3 shadow-lg" : "bg-transparent py-5"}`}>
      <div className="container mx-auto px-4 flex items-center justify-between py-[65px]">
        <a href="#home" className="flex items-center gap-2">
          <img src="/public/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" alt="SteadyStream Logo" className="h-16 object-none" />
          
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="#home" icon={<Home size={16} />}>
            Home
          </NavLink>
          <NavLink href="#features" icon={<List size={16} />}>
            Features
          </NavLink>
          <NavLink href="#devices" icon={<Monitor size={16} />}>
            Devices
          </NavLink>
          <NavLink href="#channels" icon={<Tv size={16} />}>
            Channels
          </NavLink>
          <NavLink href="#pricing" icon={<Play size={16} />}>
            Plans
          </NavLink>
          <NavLink href="/player" icon={<Play size={16} />}>
            Web Player
          </NavLink>
        </nav>

        <div className="hidden md:block">
          <Button className="bg-gold hover:bg-gold-dark text-black font-medium">
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
            <MobileNavLink href="#home" onClick={() => setMobileMenuOpen(false)}>
              Home
            </MobileNavLink>
            <MobileNavLink href="#features" onClick={() => setMobileMenuOpen(false)}>
              Features
            </MobileNavLink>
            <MobileNavLink href="#devices" onClick={() => setMobileMenuOpen(false)}>
              Devices
            </MobileNavLink>
            <MobileNavLink href="#channels" onClick={() => setMobileMenuOpen(false)}>
              Channels
            </MobileNavLink>
            <MobileNavLink href="#pricing" onClick={() => setMobileMenuOpen(false)}>
              Plans
            </MobileNavLink>
            <MobileNavLink href="/player" onClick={() => setMobileMenuOpen(false)}>
              Web Player
            </MobileNavLink>
            <Button className="bg-gold hover:bg-gold-dark text-black font-medium w-full">
              Get Started
            </Button>
          </div>
        </div>}
    </header>;
};
const NavLink = ({
  href,
  children,
  icon
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) => <a href={href} className="text-gray-300 hover:text-gold transition-colors flex items-center gap-1.5 text-sm font-medium">
    {icon}
    {children}
  </a>;
const MobileNavLink = ({
  href,
  children,
  onClick
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) => <a href={href} className="text-gray-300 hover:text-gold py-2 transition-colors block text-center font-medium" onClick={onClick}>
    {children}
  </a>;
export default Navbar;
