
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, checkAdminStatus } = useAuth();

  useEffect(() => {
    checkAccess();
  }, [user, isAdmin]);

  const checkAccess = async () => {
    try {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access the admin dashboard",
          variant: "destructive",
        });
        navigate("/admin-login");
        return;
      }

      // Double-check admin status
      const adminStatus = await checkAdminStatus();
      
      if (!adminStatus && !isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Verifying admin access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};
