
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if user has admin role using direct query
          const { data: adminRole } = await supabase
            .from('admin_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single();

          if (adminRole) {
            navigate('/admin');
            return;
          }
        }
      } catch (error) {
        console.log('No active admin session');
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Listen for auth state changes to detect password reset flow
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery event detected');
          setIsPasswordReset(true);
          setIsResetMode(false);
          setResetEmailSent(false);
        } else if (event === 'SIGNED_IN' && session) {
          // Check if this is from a password reset
          const params = getUrlParams();
          
          if (params.type === 'recovery') {
            console.log('Password reset session detected');
            setIsPasswordReset(true);
            setIsResetMode(false);
            setResetEmailSent(false);
          } else {
            // Regular login - check admin status
            try {
              const { data: adminRole } = await supabase
                .from('admin_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .eq('role', 'admin')
                .single();

              if (adminRole) {
                navigate('/admin');
              }
            } catch (error) {
              console.log('User is not an admin');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setIsPasswordReset(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Login failed');
      }

      // Check if user has admin role using direct query
      const { data: adminRole, error: roleError } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !adminRole) {
        // Sign out the user if they're not an admin
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      toast({
        title: "Login successful",
        description: "Welcome to the admin dashboard",
      });

      navigate('/admin');
    } catch (error: any) {
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
      // Use the current window location as the redirect URL
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
    // Clear URL parameters
    window.history.replaceState({}, document.title, '/admin-login');
  };

  const handleForgotPassword = () => {
    setIsResetMode(true);
    setIsPasswordReset(false);
  };

  const handleReturnToMain = () => {
    navigate("/");
  };

  const handlePasswordUpdateComplete = () => {
    setIsPasswordReset(false);
    // Clear URL parameters
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
