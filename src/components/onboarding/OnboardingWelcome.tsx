
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, User, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SignInForm } from "./SignInForm";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])/, {
    message: "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character.",
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
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userData.name || "",
      email: userData.email || "",
      password: userData.password || "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    // Validate password complexity
    const hasLowercase = /[a-z]/.test(values.password);
    const hasUppercase = /[A-Z]/.test(values.password);
    const hasNumber = /\d/.test(values.password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(values.password);
    
    if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
      toast({
        title: "Password Error",
        description: "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      try {
        updateUserData({
          name: values.name,
          email: values.email,
          password: values.password,
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
      <h1 className="text-3xl font-bold mb-2">Welcome to SteadyStream TV</h1>
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Create a password" 
                      type="password" 
                      className="pl-10 bg-dark-300 border-gray-700" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500 mt-1">
                  Password must contain at least 8 characters including uppercase, lowercase, number, and special character.
                </p>
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Continue"}
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
