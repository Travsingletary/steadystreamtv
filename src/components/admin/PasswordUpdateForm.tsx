
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const passwordUpdateSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface PasswordUpdateFormProps {
  onComplete: () => void;
}

export const PasswordUpdateForm = ({ onComplete }: PasswordUpdateFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof passwordUpdateSchema>>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof passwordUpdateSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting to update password...');
      
      // Get current session to verify we have a valid reset session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Session error: ' + sessionError.message);
      }
      
      if (!session) {
        throw new Error('No active session found. Please request a new password reset link.');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        throw updateError;
      }

      console.log('Password updated successfully');
      
      toast({
        title: "Password updated successfully",
        description: "You can now log in with your new password",
      });
      
      // Sign out to force re-login with new password
      await supabase.auth.signOut();
      
      onComplete();
    } catch (error: any) {
      console.error('Password update error:', error);
      const errorMessage = error.message || "Failed to update password";
      setError(errorMessage);
      
      toast({
        title: "Failed to update password",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Enter your new password"
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

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Confirm your new password"
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
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
