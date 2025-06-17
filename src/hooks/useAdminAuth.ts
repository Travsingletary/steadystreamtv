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
import { checkRedirectLimit, resetRedirectCount, checkAdminStatusWithCircuitBreaker } from "@/utils/adminCircuitBreaker";

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
          
          // Check if circuit breaker is tripped
          if (checkRedirectLimit()) {
            console.error('Admin login circuit breaker triggered');
            toast({
              title: "Login Error",
              description: "Too many admin check attempts. Please wait before trying again.",
              variant: "destructive",
            });
            setIsCheckingAdmin(false);
            return;
          }

          const adminStatus = await checkAdminStatusWithCircuitBreaker(user.id);
          
          if (adminStatus || isAdmin) {
            console.log('User is admin, redirecting to /admin');
            resetRedirectCount();
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
  }, [user, isAdmin, navigate, toast]);

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    console.log('Starting login process for:', values.email);

    try {
      // Clear any previous redirect counts
      resetRedirectCount();

      // Use the AuthContext signIn method
      const { error } = await signIn(values.email, values.password);

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful, checking admin status...');
      
      const adminStatus = await checkAdminStatus();
      
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
    resetRedirectCount();
    window.history.replaceState({}, document.title, '/admin-login');
  };

  const handleForgotPassword = () => {
    setIsResetMode(true);
    setIsPasswordReset(false);
  };

  const handleReturnToMain = () => {
    // Clear all admin-related session storage
    resetRedirectCount();
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
