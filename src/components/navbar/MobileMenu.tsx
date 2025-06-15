
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

interface NavItem {
  name: string;
  href: string;
}

interface MobileMenuProps {
  items: NavItem[];
  isOpen: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  onSignOut: () => void;
  onLinkClick: () => void;
}

export const MobileMenu = ({ 
  items, 
  isOpen, 
  isAuthenticated, 
  isAdmin, 
  onSignOut, 
  onLinkClick 
}: MobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black border-t border-gray-800">
        {items.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="text-gray-300 hover:text-gold block px-3 py-2 rounded-md text-base font-medium"
            onClick={onLinkClick}
          >
            {item.name}
          </a>
        ))}
        
        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="text-gray-300 hover:text-gold block px-3 py-2 rounded-md text-base font-medium"
              onClick={onLinkClick}
            >
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                to="/admin-login"
                className="text-purple-400 hover:text-purple-300 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                onClick={onLinkClick}
              >
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </Link>
            )}
            <button
              onClick={onSignOut}
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
              onClick={onLinkClick}
            >
              Sign In
            </Link>
            <Link
              to="/admin-login"
              className="text-purple-400 hover:text-purple-300 block px-3 py-2 rounded-md text-base font-medium flex items-center"
              onClick={onLinkClick}
            >
              <Shield className="h-4 w-4 mr-1" />
              Admin Access
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
