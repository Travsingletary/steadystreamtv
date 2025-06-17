
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { checkRedirectLimit, resetRedirectCount } from "@/utils/adminCircuitBreaker";
import { CircuitBreakerError } from "./CircuitBreakerError";
import { AdminBypass } from "./AdminBypass";

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, checkAdminStatus } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    const checkAccess = async () => {
      try {
        // First check for bypass flag
        const bypassData = localStorage.getItem('admin_bypass');
        if (bypassData) {
          try {
            const bypass = JSON.parse(bypassData);
            const isExpired = Date.now() - bypass.timestamp > 3600000; // 1 hour
            
            if (!isExpired && bypass.isAdmin && bypass.bypassed) {
              console.log('🔓 Admin bypass detected - granting access');
              resetRedirectCount();
              if (isMounted) {
                setLoading(false);
              }
              return;
            } else if (isExpired) {
              localStorage.removeItem('admin_bypass');
            }
          } catch (e) {
            localStorage.removeItem('admin_bypass');
          }
        }

        // Check if circuit breaker is tripped
        if (checkRedirectLimit()) {
          console.error('Admin redirect circuit breaker triggered - showing bypass');
          if (isMounted) {
            setShowBypass(true);
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
    setShowBypass(false);
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
    localStorage.removeItem('admin_bypass');
    resetRedirectCount();
    navigate('/');
  };

  const handleShowBypass = () => {
    setShowBypass(true);
    setError(false);
    setLoading(false);
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

  if (showBypass) {
    return <AdminBypass />;
  }

  if (error) {
    return (
      <CircuitBreakerError
        onRetry={handleRetry}
        onForceAccess={handleForceAccess}
        onReset={handleReset}
        onShowBypass={handleShowBypass}
      />
    );
  }

  // Check if user has bypass access
  const bypassData = localStorage.getItem('admin_bypass');
  let hasBypassAccess = false;
  
  if (bypassData) {
    try {
      const bypass = JSON.parse(bypassData);
      const isExpired = Date.now() - bypass.timestamp > 3600000; // 1 hour
      hasBypassAccess = !isExpired && bypass.isAdmin && bypass.bypassed;
    } catch (e) {
      localStorage.removeItem('admin_bypass');
    }
  }

  if (!isAdmin && user?.id !== 'de395bc5-08a6-4359-934a-e7509b4eff46' && !hasBypassAccess) {
    return null;
  }

  return <>{children}</>;
};
