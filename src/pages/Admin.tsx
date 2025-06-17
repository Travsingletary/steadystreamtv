
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { EnhancedAdminDashboard } from "@/components/admin/EnhancedAdminDashboard";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!user) {
          toast({
            title: "Access Denied",
            description: "You must be logged in to access this page",
            variant: "destructive"
          });
          navigate("/");
          return;
        }

        if (!isAdmin) {
          toast({
            title: "Access Denied", 
            description: "You don't have admin privileges",
            variant: "destructive"
          });
          navigate("/");
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin access",
          variant: "destructive"
        });
        navigate("/");
      }
    };

    checkAccess();
  }, [user, isAdmin, navigate, toast]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-white">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return <EnhancedAdminDashboard />;
};

export default Admin;
