
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AddCustomerProps {
  userId: string;
  onSuccess: () => void;
}

export const AddCustomer: React.FC<AddCustomerProps> = ({ userId, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    plan: 'basic',
    duration: '1',
    note: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Generate random credentials
      const username = formData.name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 100);
      const password = Math.random().toString(36).slice(-8);
      
      // Simulate adding a customer
      // In a real app, this would be a Supabase insert
      setTimeout(() => {
        toast({
          title: "Customer added successfully",
          description: "The customer subscription has been created"
        });
        
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: "Error adding customer",
        description: error.message,
      });
      setLoading(false);
    }
  };

  const plans = [
    { value: "basic", label: "Basic Plan" },
    { value: "premium", label: "Premium Plan" },
    { value: "ultimate", label: "Ultimate Plan" }
  ];

  const durations = [
    { value: "1", label: "1 Month" },
    { value: "3", label: "3 Months" },
    { value: "6", label: "6 Months" },
    { value: "12", label: "12 Months" }
  ];

  if (success) {
    return (
      <Card className="bg-dark-200 border-gray-800 p-6 text-center">
        <div className="rounded-full bg-green-900/30 p-3 inline-flex mx-auto">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold mt-4 mb-2">Customer Added Successfully</h3>
        <p className="text-gray-400">
          The customer has been added to your account
        </p>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-200 border-gray-800 p-6">
      <h3 className="text-xl font-semibold mb-4">Add New Customer</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Customer's full name"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-dark-300 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-dark-300 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select
                value={formData.plan}
                onValueChange={(value) => handleSelectChange('plan', value)}
              >
                <SelectTrigger className="bg-dark-300 border-gray-700">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Subscription Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => handleSelectChange('duration', value)}
              >
                <SelectTrigger className="bg-dark-300 border-gray-700">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map(duration => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2 h-full">
              <Label htmlFor="note">Customer Note (Optional)</Label>
              <textarea
                id="note"
                name="note"
                placeholder="Add any notes about this customer"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                className="w-full h-[calc(100%-2rem)] min-h-[120px] p-3 rounded-md bg-dark-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gold"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-400">
                This will use 1 credit from your account
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onSuccess}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                className="bg-gold hover:bg-gold-dark text-black"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Create Subscription'
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
};
