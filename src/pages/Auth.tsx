import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Password reset state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetReady, setResetReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              name
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        
        // Create profile
        if (data.user) {
          await supabase.from('profiles').insert({
            supabase_user_id: data.user.id,
            email,
            full_name: name
          });
        }
        
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });

        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`
      });

      if (error) throw error;

      toast({
        title: "Password reset sent!",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      // Clear reset mode from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.toString());
      setIsResetMode(false);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const code = params.get('code');
    const hash = window.location.hash;

    const init = async () => {
      try {
        if (mode === 'reset' || (hash && hash.includes('type=recovery')) || code) {
          setIsResetMode(true);
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
          }
          // Verify session exists
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            // In some cases, session is in hash; supabase picks it up automatically
            // Give it a moment
            setTimeout(async () => {
              const { data: { session: s2 } } = await supabase.auth.getSession();
              setResetReady(!!s2);
            }, 300);
          } else {
            setResetReady(true);
          }
        }
      } catch (e: any) {
        setError(e.message);
      }
    };

    init();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md bg-dark-200 border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-gold">
            {isResetMode ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Sign In')}
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            {isResetMode
              ? 'Enter a new password for your account'
              : (isSignUp 
                ? 'Create your SteadyStream TV account' 
                : 'Sign in to your SteadyStream TV account')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isResetMode ? (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-dark-300 border-gray-700"
                  placeholder="Enter a new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-dark-300 border-gray-700"
                  placeholder="Confirm your new password"
                />
              </div>

              {error && (
                <Alert className="bg-red-900/30 border-red-500">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
                disabled={!resetReady}
              >
                Set New Password
              </Button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                      className="bg-dark-300 border-gray-700"
                      placeholder="Enter your full name"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-dark-300 border-gray-700"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-dark-300 border-gray-700 pr-10"
                      placeholder="Enter your password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert className="bg-red-900/30 border-red-500">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-black border-r-transparent border-b-transparent border-l-transparent mr-2"></div>
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {isSignUp ? <UserPlus className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </div>
                  )}
                </Button>
              </form>

              {!isSignUp && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={handlePasswordReset}
                    disabled={resetLoading || !email}
                    className="text-sm border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    {resetLoading ? 'Sending Reset Email...' : 'Forgot Password?'}
                  </Button>
                </div>
              )}

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                  }}
                  className="text-gold hover:text-gold-dark"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"
                  }
                </Button>
              </div>

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => navigate('/')}
                  className="text-gray-400 hover:text-white"
                >
                  Back to Home
                </Button>
              </div>
            </>
          )}
        </CardContent>

      </Card>
    </div>
  );
};

export default AuthPage;