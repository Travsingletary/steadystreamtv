
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const AdminBypass = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBypassLogin = async () => {
    setLoading(true);
    
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
        description: "Successfully bypassed authentication system"
      });

      // Redirect to admin dashboard
      navigate('/admin');
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin credentials",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleBypassLogin();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-dark-200 border-gray-800">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-2xl">A</span>
          </div>
          <CardTitle className="text-2xl text-white">Admin Bypass</CardTitle>
          <p className="text-gray-400">Emergency admin access</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@steadystreamtv.com"
              className="bg-dark-300 border-gray-700 text-white"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter admin password"
              className="bg-dark-300 border-gray-700 text-white"
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleBypassLogin}
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
          >
            {loading ? "Accessing..." : "Bypass & Access Admin"}
          </Button>

          <div className="text-center text-sm text-gray-400">
            <p>Valid credentials:</p>
            <p>admin@steadystreamtv.com / Admin123!</p>
            <p>trav.singletary@gmail.com / Password123!</p>
            <p>vincent@steadystreamtv.com / Admin456!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
