
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading, checkAdminAccess } = useAuth();

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          return;
        }

        console.log('AdminRoute: Checking admin access...');
        console.log('User:', user?.email);
        console.log('IsAdmin from context:', isAdmin);

        if (!user) {
          console.log('AdminRoute: No user, redirecting to login');
          toast({
            title: "Authentication Required",
            description: "Please sign in to access the admin dashboard",
            variant: "destructive",
          });
          navigate("/admin-login");
          return;
        }

        // Double-check admin status
        const adminStatus = await checkAdminAccess();
        console.log('AdminRoute: Admin status check result:', adminStatus);

        if (!adminStatus && !isAdmin) {
          console.log('AdminRoute: User is not admin, redirecting to dashboard');
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        console.log('AdminRoute: Admin access verified, showing admin content');
        setLoading(false);
      } catch (error: any) {
        console.error('AdminRoute: Error checking admin access:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin access",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    };

    verifyAdminAccess();
  }, [user, isAdmin, authLoading, navigate, toast, checkAdminAccess]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Verifying admin access...</div>
      </div>
    );
  }

  return <>{children}</>;
};
