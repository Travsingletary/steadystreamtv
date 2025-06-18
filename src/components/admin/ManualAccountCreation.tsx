
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Mail, User, CreditCard, Calendar } from "lucide-react";

export const ManualAccountCreation = ({ onAccountCreated }: { onAccountCreated: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subscriptionPlan: 'trial',
    activationCode: '',
    notes: ''
  });
  const { toast } = useToast();

  const generateActivationCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, activationCode: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Full name and email are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          subscription_plan: formData.subscriptionPlan,
          activation_code: formData.activationCode || Math.random().toString(36).substring(2, 8).toUpperCase()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Account Created Successfully",
        description: `Account for ${formData.fullName} has been created`,
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        subscriptionPlan: 'trial',
        activationCode: '',
        notes: ''
      });

      onAccountCreated();
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-gold" />
          Create New Account
        </CardTitle>
        <CardDescription className="text-gray-400">
          Manually create new user accounts with custom settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="pl-10 bg-dark-300 border-gray-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 bg-dark-300 border-gray-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionPlan" className="text-white">Subscription Plan</Label>
              <Select
                value={formData.subscriptionPlan}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subscriptionPlan: value }))}
              >
                <SelectTrigger className="bg-dark-300 border-gray-700 text-white">
                  <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-300 border-gray-700">
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="ultimate">Ultimate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activationCode" className="text-white">Activation Code</Label>
              <div className="flex gap-2">
                <Input
                  id="activationCode"
                  type="text"
                  placeholder="Auto-generated"
                  value={formData.activationCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, activationCode: e.target.value.toUpperCase() }))}
                  className="bg-dark-300 border-gray-700 text-white font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateActivationCode}
                  className="border-gray-700 hover:bg-dark-200"
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this account..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-dark-300 border-gray-700 text-white"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({
                fullName: '',
                email: '',
                subscriptionPlan: 'trial',
                activationCode: '',
                notes: ''
              })}
              className="border-gray-700 hover:bg-dark-200"
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gold hover:bg-gold-dark text-black"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
