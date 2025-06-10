
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface AdminLoginFormProps {
  form: UseFormReturn<z.infer<typeof loginSchema>>;
  onSubmit: (values: z.infer<typeof loginSchema>) => Promise<void>;
  isLoading: boolean;
}

export const AdminLoginForm = ({ form, onSubmit, isLoading }: AdminLoginFormProps) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
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
          control={form.control}
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
  );
};

export { loginSchema };
