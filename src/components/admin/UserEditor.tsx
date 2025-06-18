
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Save, X, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  subscription_plan: string | null;
  activation_code: string | null;
  created_at: string | null;
}

interface UserEditorProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: () => void;
}

export const UserEditor = ({ user, onClose, onUpdate }: UserEditorProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    subscription_plan: user.subscription_plan || 'trial',
    activation_code: user.activation_code || ''
  });
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          subscription_plan: formData.subscription_plan,
          activation_code: formData.activation_code
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "User Updated",
        description: "User information has been successfully updated",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanBadgeColor = (plan: string | null) => {
    switch (plan) {
      case 'trial': return 'bg-yellow-600';
      case 'standard': return 'bg-blue-600';
      case 'premium': return 'bg-purple-600';
      case 'ultimate': return 'bg-gold';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-dark-200 border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit User
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-gray-400">
            Modify user account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-white">Full Name</Label>
            <Input
              id="fullName"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="bg-dark-300 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-dark-300 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan" className="text-white">Subscription Plan</Label>
            <Select
              value={formData.subscription_plan}
              onValueChange={(value) => setFormData(prev => ({ ...prev, subscription_plan: value }))}
            >
              <SelectTrigger className="bg-dark-300 border-gray-700 text-white">
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
            <Input
              id="activationCode"
              value={formData.activation_code}
              onChange={(e) => setFormData(prev => ({ ...prev, activation_code: e.target.value.toUpperCase() }))}
              className="bg-dark-300 border-gray-700 text-white font-mono"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-400">Current Plan:</span>
            <Badge className={`${getPlanBadgeColor(user.subscription_plan)} text-white`}>
              {user.subscription_plan || 'None'}
            </Badge>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-700 hover:bg-dark-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-gold hover:bg-gold-dark text-black"
            >
              {loading ? 'Saving...' : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
