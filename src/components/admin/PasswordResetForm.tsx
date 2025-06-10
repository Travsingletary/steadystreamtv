
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

interface PasswordResetFormProps {
  form: UseFormReturn<z.infer<typeof resetSchema>>;
  onSubmit: (values: z.infer<typeof resetSchema>) => Promise<void>;
  isLoading: boolean;
  resetEmailSent: boolean;
}

export const PasswordResetForm = ({ form, onSubmit, isLoading, resetEmailSent }: PasswordResetFormProps) => {
  if (resetEmailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-green-900/20 border border-green-700 rounded-md">
          <p className="text-green-400 text-sm">
            Password reset email sent! Check your inbox and follow the instructions to reset your password.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => onSubmit(form.getValues())}
          disabled={isLoading}
          className="w-full border-gray-700 text-white hover:bg-gray-800"
        >
          {isLoading ? "Sending..." : "Resend Email"}
        </Button>
      </div>
    );
  }

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
  );
};

export { resetSchema };
