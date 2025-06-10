
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, resetSchema } from "@/components/admin/AdminLoginForm";

export const useAdminAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
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
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/admin-login`,
      });

      if (error) {
        throw error;
      }

      setResetEmailSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link",
      });
    } catch (error: any) {
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
    resetForm.reset();
  };

  const handleForgotPassword = () => {
    setIsResetMode(true);
  };

  const handleReturnToMain = () => {
    navigate("/");
  };

  return {
    isLoading,
    isCheckingAdmin,
    isResetMode,
    resetEmailSent,
    loginForm,
    resetForm,
    onLoginSubmit,
    onResetSubmit,
    handleBackToLogin,
    handleForgotPassword,
    handleReturnToMain,
  };
};
