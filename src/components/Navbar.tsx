
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { NavLinks } from "./navbar/NavLinks";
import { UserMenu } from "./navbar/UserMenu";
import { MobileMenu } from "./navbar/MobileMenu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Check admin status when user changes
  React.useEffect(() => {
    if (user) {
      // Use setTimeout to prevent infinite loops
      setTimeout(async () => {
        try {
          const { data: adminRole } = await supabase
            .from('admin_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();
          
          setIsAdmin(!!adminRole);
        } catch (error) {
          console.log('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }, 0);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav className="bg-black border-b border-gray-800 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-2xl font-bold text-gold">SteadyStream TV</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <NavLinks items={navItems} />
            <UserMenu 
              isAuthenticated={!!user}
              isAdmin={isAdmin}
              onSignOut={handleSignOut}
            />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <MobileMenu
        items={navItems}
        isOpen={isOpen}
        isAuthenticated={!!user}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
        onLinkClick={() => setIsOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
