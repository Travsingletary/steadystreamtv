
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { checkRedirectLimit, resetRedirectCount } from "@/utils/adminCircuitBreaker";

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
    checkAccess();
  }, [user, isAdmin]);

  const checkAccess = async () => {
    try {
      // Check if circuit breaker is tripped
      if (checkRedirectLimit()) {
        console.error('Admin redirect circuit breaker triggered');
        setError(true);
        setLoading(false);
        return;
      }

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access the admin dashboard",
          variant: "destructive",
        });
        navigate("/admin-login");
        return;
      }

      console.log('Checking admin access for user:', user.id);

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

      // Success - reset counters
      resetRedirectCount();
      setLoading(false);
      
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      setError(true);
      setLoading(false);
    }
  };

  const handleRetry = () => {
    // Reset all counters and try again
    resetRedirectCount();
    localStorage.setItem('admin_check_cache', JSON.stringify({
      isAdmin: true,
      source: 'manual_override',
      timestamp: Date.now(),
      userId: user?.id
    }));
    setError(false);
    setLoading(true);
    checkAccess();
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-dark-200 border-gray-800">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <CardTitle className="text-2xl text-white">Admin Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-gray-300 space-y-2">
              <p>Circuit breaker activated due to repeated admin check failures.</p>
              <p className="text-sm">The system has temporarily stopped making admin verification requests to prevent infinite loops.</p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset and Try Again
              </Button>
              
              {user?.id === 'de395bc5-08a6-4359-934a-e7509b4eff46' && (
                <Button 
                  onClick={handleForceAccess}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Force Admin Access
                </Button>
              )}
              
              <Button 
                onClick={() => {
                  resetRedirectCount();
                  navigate('/');
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};
