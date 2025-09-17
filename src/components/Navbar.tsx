
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X, User, Heart, Layout, LogOut, Link as LinkIcon, LogIn } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Only show sign-up button on homepage and when not logged in
  const showSignUpButton = location.pathname === "/" && !user;
  // Show sign-in button when not logged in
  const showSignInButton = !user && !loading;

  return (
    <nav className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-sm z-50 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" onClick={closeMenu}>
              <img
                src="/lovable-uploads/595f3348-0a60-4bbf-ad62-144c2ab406c1.png"
                alt="SteadyStream Logo"
                className="h-8"
              />
              <span className="text-lg font-semibold ml-2 text-white">SteadyStream</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <NavLink to="/player" onClick={closeMenu}>
                  Stream
                </NavLink>
                <NavLink to="/favorites" onClick={closeMenu}>
                  Favorites
                </NavLink>
                <NavLink to="/dashboard" onClick={closeMenu}>
                  Dashboard
                </NavLink>
                <NavLink to="/connect-apps" onClick={closeMenu}>
                  Connect Apps
                </NavLink>
                <div className="relative group ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-gray-800"
                  >
                    <User className="h-5 w-5 text-gray-300" />
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-dark-200 border border-gray-700 hidden group-hover:block">
                    <div className="py-1">
                      <Link
                        to="/account"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-dark-300 flex items-center gap-2"
                        onClick={closeMenu}
                      >
                        <User className="h-4 w-4" /> My Account
                      </Link>
                      <Link
                        to="/favorites"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-dark-300 flex items-center gap-2"
                        onClick={closeMenu}
                      >
                        <Heart className="h-4 w-4" /> Favorites
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-dark-300 flex items-center gap-2"
                        onClick={closeMenu}
                      >
                        <Layout className="h-4 w-4" /> Dashboard
                      </Link>
                      <Link
                        to="/connect-apps"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-dark-300 flex items-center gap-2"
                        onClick={closeMenu}
                      >
                        <LinkIcon className="h-4 w-4" /> Connect Apps
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-dark-300 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                {showSignInButton && (
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-gray-800"
                    onClick={() => navigate("/auth")}
                  >
                    <LogIn className="h-4 w-4 mr-2" /> Sign In
                  </Button>
                )}
                {showSignUpButton && (
                  <Button
                    className="bg-gold hover:bg-gold-dark text-black"
                    onClick={() => navigate("/onboarding")}
                  >
                    Get Started
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {user && !loading && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full mr-2 hover:bg-gray-800"
                onClick={() => navigate("/account")}
              >
                <User className="h-5 w-5 text-gray-300" />
              </Button>
            )}
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden bg-dark-200 border-t border-gray-800 ${
          isMenuOpen ? "block" : "hidden"
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {user ? (
            <>
              <MobileNavLink to="/player" onClick={closeMenu}>
                Stream
              </MobileNavLink>
              <MobileNavLink to="/favorites" onClick={closeMenu}>
                Favorites
              </MobileNavLink>
              <MobileNavLink to="/dashboard" onClick={closeMenu}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink to="/connect-apps" onClick={closeMenu}>
                Connect Apps
              </MobileNavLink>
              <MobileNavLink to="/account" onClick={closeMenu}>
                My Account
              </MobileNavLink>
              <button
                onClick={handleSignOut}
                className="w-full text-left block px-4 py-2 text-base text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-2 p-2">
              <MobileNavLink to="/auth" onClick={closeMenu}>
                Sign In
              </MobileNavLink>
              {showSignUpButton && (
                <div className="px-4 py-2">
                  <Button
                    className="bg-gold hover:bg-gold-dark text-black w-full"
                    onClick={() => {
                      navigate("/onboarding");
                      closeMenu();
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm ${
        isActive
          ? "text-gold font-medium"
          : "text-gray-300 hover:text-white hover:bg-gray-800"
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

const MobileNavLink = ({ to, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`block px-4 py-2 rounded-md text-base ${
        isActive
          ? "bg-gray-800 text-gold font-medium"
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export default Navbar;
