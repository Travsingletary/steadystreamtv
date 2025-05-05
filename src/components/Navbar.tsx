
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, MonitorPlay, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { toast } = useToast();

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData.user);
        }
        setLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle scroll events
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account."
      });
      // Close mobile menu if open
      setMobileMenuOpen(false);
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message
      });
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Player", path: "/player" },
  ];

  const authLinks = user ? [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={16} className="mr-2" /> },
    { name: "Player", path: "/player", icon: <MonitorPlay size={16} className="mr-2" /> },
    { name: "Profile", path: "/profile", icon: <User size={16} className="mr-2" /> }
  ] : [];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled || mobileMenuOpen ? "bg-black shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png"
              alt="SteadyStream TV"
              className="h-10 md:h-12"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-base transition-colors ${
                  isActive(link.path)
                    ? "text-gold font-medium"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {!loading && (
              <>
                {user ? (
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      className="text-white flex items-center gap-2"
                    >
                      <User size={18} />
                      <span className="max-w-[100px] truncate">
                        {user.email}
                      </span>
                    </Button>
                    <div className="absolute right-0 top-full pt-2 hidden group-hover:block min-w-[200px]">
                      <div className="bg-dark-200 rounded-md shadow-lg border border-gray-800 overflow-hidden">
                        {authLinks.map((link) => (
                          <Link
                            key={link.path}
                            to={link.path}
                            className={`block px-4 py-2.5 text-sm hover:bg-dark-100 ${
                              isActive(link.path)
                                ? "text-gold bg-dark-300"
                                : "text-gray-300"
                            }`}
                          >
                            <div className="flex items-center">
                              {link.icon}
                              {link.name}
                            </div>
                          </Link>
                        ))}
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-dark-100 border-t border-gray-800"
                        >
                          <div className="flex items-center">
                            <LogOut size={16} className="mr-2" />
                            Sign Out
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    asChild
                    className="bg-gold hover:bg-gold-dark text-black font-medium"
                  >
                    <Link to="/onboarding">Get Started</Link>
                  </Button>
                )}
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-full text-gray-300 hover:text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-200 border-t border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-base py-2 ${
                    isActive(link.path)
                      ? "text-gold font-medium"
                      : "text-gray-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

              {!loading && (
                <>
                  {user ? (
                    <>
                      <div className="border-t border-gray-700 pt-4">
                        <p className="text-sm text-gray-400 mb-2">
                          Signed in as:
                        </p>
                        <p className="text-white font-medium mb-4 truncate">
                          {user.email}
                        </p>
                      </div>

                      {authLinks.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          className={`flex items-center text-base py-2 ${
                            isActive(link.path)
                              ? "text-gold font-medium"
                              : "text-gray-300"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.icon}
                          {link.name}
                        </Link>
                      ))}

                      <button
                        onClick={handleSignOut}
                        className="flex items-center text-base py-2 text-red-400 w-full text-left"
                      >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Button
                      asChild
                      className="bg-gold hover:bg-gold-dark text-black font-medium w-full mt-2"
                    >
                      <Link
                        to="/onboarding"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
