import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const AdminLogin = () => {
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

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-dark-200 border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-gold" />
          </div>
          <CardTitle className="text-2xl text-white">
            {isResetMode ? "Reset Password" : "Admin Access"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isResetMode 
              ? "Enter your email to reset your password"
              : "Sign in to access the SteadyStream TV admin dashboard"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isResetMode ? (
            // Login Form
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="admin@steadystreamtv.com"
                            type="email"
                            className="pl-10 bg-dark-300 border-gray-700 text-white"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Enter your password"
                            type="password"
                            className="pl-10 bg-dark-300 border-gray-700 text-white"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Access Dashboard"}
                </Button>
              </form>
            </Form>
          ) : (
            // Reset Password Form
            <>
              {!resetEmailSent ? (
                <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
                    <FormField
                      control={resetForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                              <Input
                                placeholder="Enter your email address"
                                type="email"
                                className="pl-10 bg-dark-300 border-gray-700 text-white"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Send Reset Email"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-green-900/20 border border-green-700 rounded-md">
                    <p className="text-green-400 text-sm">
                      Password reset email sent! Check your inbox and follow the instructions to reset your password.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => onResetSubmit(resetForm.getValues())}
                    disabled={isLoading}
                    className="w-full border-gray-700 text-white hover:bg-gray-800"
                  >
                    {isLoading ? "Sending..." : "Resend Email"}
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="mt-6 text-center space-y-2">
            {!isResetMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-gold hover:underline text-sm"
                >
                  Forgot your password?
                </button>
                <p className="text-gray-400 text-sm">
                  Need access?{" "}
                  <button
                    onClick={() => navigate("/")}
                    className="text-gold hover:underline"
                  >
                    Return to main site
                  </button>
                </p>
              </>
            ) : (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex items-center justify-center gap-2 text-gold hover:underline text-sm mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
