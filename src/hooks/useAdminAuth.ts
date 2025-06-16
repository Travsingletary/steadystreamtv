
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema } from "@/components/admin/AdminLoginForm";
import { resetSchema } from "@/components/admin/PasswordResetForm";

export const useAdminAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, signIn, checkAdminStatus } = useAuth();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  // Helper function to safely get URL parameters
  const getUrlParams = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        type: urlParams.get('type'),
        accessToken: urlParams.get('access_token'),
        refreshToken: urlParams.get('refresh_token'),
        error: urlParams.get('error'),
        errorDescription: urlParams.get('error_description')
      };
    } catch (error) {
      console.error('Error parsing URL parameters:', error);
      return {};
    }
  };

  // Check for password reset on component mount
  useEffect(() => {
    const params = getUrlParams();
    console.log('URL params:', params);
    
    if (params.type === 'recovery' && params.accessToken && params.refreshToken) {
      console.log('Password reset detected from URL');
      setIsPasswordReset(true);
      setIsResetMode(false);
      setResetEmailSent(false);
    }

    if (params.error) {
      console.error('Auth error from URL:', params.error, params.errorDescription);
      toast({
        title: "Authentication Error",
        description: params.errorDescription || params.error || "An authentication error occurred",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Check if user is already logged in and is admin
  useEffect(() => {
    const checkAdminStatusAsync = async () => {
      try {
        if (user) {
          console.log('Checking admin role for user:', user.id);
          
          // Check redirect count to prevent infinite loops
          const storedCount = sessionStorage.getItem('admin_login_redirect_count') || '0';
          const redirectCount = parseInt(storedCount, 10);
          
          if (redirectCount > 5) {
            console.error('Admin login redirect circuit breaker triggered');
            toast({
              title: "Login Error",
              description: "Too many redirect attempts. Please try again later.",
              variant: "destructive",
            });
            setIsCheckingAdmin(false);
            return;
          }

          // Increment redirect count
          sessionStorage.setItem('admin_login_redirect_count', (redirectCount + 1).toString());
          
          // Use timeout for admin status check
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Admin check timeout')), 8000);
          });

          const adminStatusPromise = checkAdminStatus();
          
          let adminStatus = false;
          try {
            adminStatus = await Promise.race([adminStatusPromise, timeoutPromise]);
          } catch (timeoutError) {
            console.error('Admin check timed out, using fallback');
            
            // Use cached status or hardcoded fallback for known admin
            const cachedStatus = localStorage.getItem('user_is_admin');
            if (cachedStatus === 'true' || user.id === 'de395bc5-08a6-4359-934a-e7509b4eff46') {
              adminStatus = true;
            }
          }
          
          if (adminStatus || isAdmin) {
            console.log('User is admin, redirecting to /admin');
            // Reset counter on success
            sessionStorage.setItem('admin_login_redirect_count', '0');
            navigate('/admin');
            return;
          } else {
            console.log('User is not admin');
          }
        }
        setIsCheckingAdmin(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatusAsync();
  }, [user, isAdmin, navigate, checkAdminStatus, toast]);

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    console.log('Starting login process for:', values.email);

    try {
      // Clear any previous redirect counts
      sessionStorage.removeItem('admin_login_redirect_count');
      sessionStorage.removeItem('admin_redirect_count');
      sessionStorage.removeItem('admin_check_count');

      // Use the AuthContext signIn method
      const { error } = await signIn(values.email, values.password);

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful, checking admin status...');
      
      // Check admin status after login with timeout
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Admin check timeout')), 8000);
      });

      const adminStatusPromise = checkAdminStatus();
      
      let adminStatus = false;
      try {
        adminStatus = await Promise.race([adminStatusPromise, timeoutPromise]);
      } catch (timeoutError) {
        console.error('Admin check timed out after login, using fallback');
        
        // For the specific admin user, force admin status
        if (values.email === 'trav.singletary@gmail.com') {
          localStorage.setItem('user_is_admin', 'true');
          adminStatus = true;
        }
      }
      
      if (adminStatus) {
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard",
        });
        navigate('/admin');
      } else {
        toast({
          title: "Access denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials or insufficient privileges",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (values: z.infer<typeof resetSchema>) => {
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/admin-login`;
      console.log('Sending reset email with redirect URL:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setResetEmailSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link. The link will expire in 1 hour.",
      });
    } catch (error: any) {
      console.error('Reset email error:', error);
      toast({
        title: "Reset failed",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsResetMode(false);
    setResetEmailSent(false);
    setIsPasswordReset(false);
    resetForm.reset();
    // Clear redirect counts
    sessionStorage.removeItem('admin_login_redirect_count');
    window.history.replaceState({}, document.title, '/admin-login');
  };

  const handleForgotPassword = () => {
    setIsResetMode(true);
    setIsPasswordReset(false);
  };

  const handleReturnToMain = () => {
    // Clear all admin-related session storage
    sessionStorage.removeItem('admin_login_redirect_count');
    sessionStorage.removeItem('admin_redirect_count');
    sessionStorage.removeItem('admin_check_count');
    navigate("/");
  };

  const handlePasswordUpdateComplete = () => {
    setIsPasswordReset(false);
    window.history.replaceState({}, document.title, '/admin-login');
    toast({
      title: "Password updated successfully",
      description: "You can now log in with your new password",
    });
  };

  return {
    isLoading,
    isCheckingAdmin,
    isResetMode,
    resetEmailSent,
    isPasswordReset,
    loginForm,
    resetForm,
    onLoginSubmit,
    onResetSubmit,
    handleBackToLogin,
    handleForgotPassword,
    handleReturnToMain,
    handlePasswordUpdateComplete,
  };
};
