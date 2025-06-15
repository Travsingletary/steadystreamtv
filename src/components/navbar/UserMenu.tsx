
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  onSignOut: () => void;
}

export const UserMenu = ({ isAuthenticated, isAdmin, onSignOut }: UserMenuProps) => {
  if (isAuthenticated) {
    return (
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
          onClick={onSignOut}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
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
  );
};
