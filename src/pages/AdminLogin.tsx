
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user already has bypass access
  useEffect(() => {
    const bypassData = localStorage.getItem('admin_bypass');
    if (bypassData) {
      try {
        const bypass = JSON.parse(bypassData);
        const isExpired = Date.now() - bypass.timestamp > 3600000; // 1 hour
        
        if (!isExpired && bypass.isAdmin && bypass.bypassed) {
          console.log('🔓 Existing bypass detected - redirecting to admin');
          navigate('/admin');
          return;
        } else if (isExpired) {
          localStorage.removeItem('admin_bypass');
        }
      } catch (e) {
        localStorage.removeItem('admin_bypass');
      }
    }
  }, [navigate]);

  const handleBypassLogin = async () => {
    setLoading(true);
    
    try {
      // Updated admin credentials with capital letters and special characters
      const adminCredentials = {
        'admin@steadystreamtv.com': 'Admin123!',
        'trav.singletary@gmail.com': 'Password123!',
        'vincent@steadystreamtv.com': 'Admin456!'
      };

      if (adminCredentials[email] === password) {
        // Set bypass flag in localStorage
        localStorage.setItem('admin_bypass', JSON.stringify({
          isAdmin: true,
          email: email,
          timestamp: Date.now(),
          bypassed: true
        }));

        // Clear any circuit breaker storage
        sessionStorage.removeItem('admin_redirect_attempts');
        sessionStorage.removeItem('admin_redirect_timeout');
        localStorage.removeItem('admin_check_cache');

        toast({
          title: "Admin Access Granted",
          description: "Successfully authenticated via bypass system"
        });

        // Redirect to admin dashboard
        navigate('/admin');
      } else {
        toast({
          title: "Invalid Credentials",
          description: "Please check your email and password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleBypassLogin();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-dark-200 border-gray-800">
        <div className="text-center p-6 pb-0">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-400">Enter your admin credentials</p>
        </div>
        
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@steadystreamtv.com"
                className="pl-10 bg-dark-300 border-gray-700 text-white"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter admin password"
                className="pl-10 bg-dark-300 border-gray-700 text-white"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            onClick={handleBypassLogin}
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
          >
            {loading ? "Signing in..." : "Access Admin Dashboard"}
          </Button>

          <div className="text-center text-sm text-gray-400 mt-4">
            <p className="mb-2">Valid admin credentials:</p>
            <div className="space-y-1 text-xs">
              <p>admin@steadystreamtv.com / Admin123!</p>
              <p>trav.singletary@gmail.com / Password123!</p>
              <p>vincent@steadystreamtv.com / Admin456!</p>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-700">
            <p>Need help? Contact support</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
