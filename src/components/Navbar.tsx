
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if user is admin
        const { data: adminRole } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setIsAdmin(!!adminRole);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </a>
              ))}
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/dashboard"
                    className="text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin-login"
                      className="text-purple-400 hover:text-purple-300 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Admin
                    </Link>
                  )}
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/onboarding"
                    className="text-gray-300 hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link to="/admin-login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-600 text-purple-400 hover:text-purple-300 hover:border-purple-500"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Admin Access
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

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

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black border-t border-gray-800">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-gold block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
            
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-gold block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin-login"
                    className="text-purple-400 hover:text-purple-300 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-gold block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/onboarding"
                  className="text-gray-300 hover:text-gold block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/admin-login"
                  className="text-purple-400 hover:text-purple-300 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Admin Access
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
