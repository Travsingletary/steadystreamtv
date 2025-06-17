
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { checkRedirectLimit, resetRedirectCount } from "@/utils/adminCircuitBreaker";
import { CircuitBreakerError } from "./CircuitBreakerError";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, checkAdminStatus } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    const checkAccess = async () => {
      try {
        // Check if circuit breaker is tripped
        if (checkRedirectLimit()) {
          console.error('Admin redirect circuit breaker triggered');
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
          return;
        }

        if (!user) {
          if (isMounted) {
            toast({
              title: "Authentication Required",
              description: "Please sign in to access the admin dashboard",
              variant: "destructive",
            });
            navigate("/admin-login");
          }
          return;
        }

        console.log('Checking admin access for user:', user.id);

        // For the known admin user, skip API calls and grant access immediately
        if (user.id === 'de395bc5-08a6-4359-934a-e7509b4eff46') {
          console.log('🎯 Known admin user detected - granting immediate access');
          resetRedirectCount();
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // Use the context's checkAdminStatus method for other users
        const adminStatus = await checkAdminStatus();
        
        if (!isMounted) return;
        
        if (!adminStatus && !isAdmin) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        // Success - reset counters
        resetRedirectCount();
        setLoading(false);
        
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    checkAccess();
    
    return () => {
      isMounted = false;
    };
  }, [user, isAdmin, navigate, toast, checkAdminStatus]);

  const handleRetry = () => {
    // Reset all counters and try again
    resetRedirectCount();
    setError(false);
    setLoading(true);
    // The useEffect will automatically re-run
  };

  const handleForceAccess = () => {
    // Force admin access for known admin user
    if (user?.id === 'de395bc5-08a6-4359-934a-e7509b4eff46') {
      localStorage.setItem('admin_check_cache', JSON.stringify({
        isAdmin: true,
        source: 'forced_access',
        timestamp: Date.now(),
        userId: user.id
      }));
      resetRedirectCount();
      setError(false);
      setLoading(false);
      
      toast({
        title: "Access Granted",
        description: "Forced admin access enabled",
      });
    }
  };

  const handleReset = () => {
    // Clear all admin-related storage and return to homepage
    localStorage.removeItem('admin_check_cache');
    resetRedirectCount();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent mx-auto mb-4"></div>
          <div className="text-white text-xl">Verifying admin access...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <CircuitBreakerError
        onRetry={handleRetry}
        onForceAccess={handleForceAccess}
        onReset={handleReset}
      />
    );
  }

  if (!isAdmin && user?.id !== 'de395bc5-08a6-4359-934a-e7509b4eff46') {
    return null;
  }

  return <>{children}</>;
};
