
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, User, Lock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SignInForm } from "./SignInForm";
import { validatePasswordSecurity } from "@/utils/passwordSecurity";

// SECURITY: Enhanced password validation schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().refine((password) => {
    const validation = validatePasswordSecurity(password);
    return validation.isValid;
  }, {
    message: "Password must meet security requirements",
  }),
});

interface UserData {
  name: string;
  email: string;
  password?: string;
  preferredDevice: string;
  genres: string[];
  subscription: any;
}

interface OnboardingWelcomeProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onNext: () => void;
}

export const OnboardingWelcome = ({ userData, updateUserData, onNext }: OnboardingWelcomeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userData.name || "",
      email: userData.email || "",
      password: userData.password || "",
    },
  });

  // SECURITY: Real-time password validation
  const handlePasswordChange = (password: string) => {
    const validation = validatePasswordSecurity(password);
    setPasswordStrength(validation.strength);
    
    if (!validation.isValid && password.length > 0) {
      form.setError('password', {
        message: validation.errors[0]
      });
    } else {
      form.clearErrors('password');
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    // SECURITY: Final password validation
    const passwordValidation = validatePasswordSecurity(values.password);
    
    if (!passwordValidation.isValid) {
      toast({
        title: "Password Security Error",
        description: passwordValidation.errors.join('. '),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      try {
        updateUserData({
          full_name: values.name,
          email: values.email,
          password: values.password,
        });
        
        toast({
          title: "Account Created",
          description: `Welcome ${values.name}! Your secure account has been created.`,
        });
        
        onNext();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "There was an error processing your information.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  if (isSignIn) {
    return <SignInForm switchToSignUp={() => setIsSignIn(false)} />;
  }

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-6 w-6 text-gold" />
        <h1 className="text-3xl font-bold">Welcome to SteadyStream TV</h1>
      </div>
      <p className="text-gray-400 mb-8">
        Let's get you set up with your personalized streaming experience. 
        We'll guide you through a few quick steps to customize your SteadyStream TV.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Enter your name" 
                      className="pl-10 bg-dark-300 border-gray-700" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Enter your email" 
                      type="email" 
                      className="pl-10 bg-dark-300 border-gray-700" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Password
                  <Shield className="h-4 w-4 text-gold" />
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Create a secure password" 
                      type="password" 
                      className="pl-10 bg-dark-300 border-gray-700" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handlePasswordChange(e.target.value);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
                
                {/* SECURITY: Password strength indicator */}
                {field.value && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">Strength:</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      passwordStrength === 'strong' ? 'bg-green-900/30 text-green-400' :
                      passwordStrength === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {passwordStrength.toUpperCase()}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <p>• At least 8 characters with uppercase, lowercase, number, and special character</p>
                  <p>• Avoid common passwords and repeated characters</p>
                </div>
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
              disabled={isLoading || passwordStrength === 'weak'}
            >
              {isLoading ? "Creating Secure Account..." : "Continue"}
            </Button>
            
            <div className="mt-4 text-center">
              <p className="text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignIn(true)}
                  className="text-gold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
