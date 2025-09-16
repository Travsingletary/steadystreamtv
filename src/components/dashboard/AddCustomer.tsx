
import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const customerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  plan: z.string(),
  username: z.string().min(3, { message: "Username must be at least 3 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers and underscores" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface AddCustomerProps {
  userId: string;
  onSuccess: () => void;
}

export const AddCustomer: React.FC<AddCustomerProps> = ({ userId, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      plan: "Basic",
      username: "",
      password: ""
    }
  });

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      // Get the reseller ID for the current user
      const { data: reseller, error: resellerError } = await supabase
        .from('resellers')
        .select('id, credits')
        .eq('user_id', userId)
        .single();
      
      if (resellerError) throw resellerError;
      
      if (reseller.credits <= 0) {
        toast({
          title: "Insufficient credits",
          description: "You need at least 1 credit to create a new customer",
        });
        return;
      }
      
      // Set expiry date to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      // Check if username or email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .or(`username.eq.${data.username},email.eq.${data.email}`)
        .maybeSingle();
      
      if (existingUser) {
        toast({
          title: "User already exists",
          description: "A customer with this username or email already exists",
        });
        return;
      }
      
      // Create the new customer
      const { error: insertError } = await supabase
        .from('customers')
        .insert([
          {
            reseller_id: reseller.id,
            name: data.name,
            email: data.email,
            plan: data.plan,
            username: data.username,
            password: data.password,
            status: 'active',
            expiry_date: expiryDate.toISOString()
          }
        ]);
      
      if (insertError) throw insertError;
      
      // Deduct 1 credit from the reseller
      const { error: updateError } = await supabase
        .from('resellers')
        .update({ credits: reseller.credits - 1 })
        .eq('id', reseller.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Customer created",
        description: "New customer has been added successfully",
      });
      
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error creating customer",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-dark-200 border-gray-800 p-6">
      <h2 className="text-xl font-bold mb-4">Add New Customer</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} className="bg-dark-300 border-gray-700" />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} className="bg-dark-300 border-gray-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="john_smith" {...field} className="bg-dark-300 border-gray-700" />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-400">
                    The username for customer login
                  </FormDescription>
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
                    <Input type="password" placeholder="••••••" {...field} className="bg-dark-300 border-gray-700" />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-400">
                    Minimum 6 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-dark-300 border-gray-700">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-300 border-gray-700">
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Ultimate">Ultimate</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gold hover:bg-gold-dark text-black"
            >
              {isSubmitting ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};
