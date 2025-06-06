
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface AutomationFormProps {
  initialData?: {
    name: string;
    email: string;
    password: string;
    plan: string;
  };
  onSubmit: (formData: {
    name: string;
    email: string;
    password: string;
    plan: string;
  }) => Promise<void>;
  loading: boolean;
  error?: string;
}

export const AutomationForm: React.FC<AutomationFormProps> = ({ 
  initialData, 
  onSubmit, 
  loading, 
  error 
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: initialData?.password || '',
    plan: initialData?.plan || 'trial'
  });

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Your Complete TV Experience Awaits</CardTitle>
        <CardDescription className="text-gray-300">
          📺 Stream anywhere • ⚡ Works on every device • 🌍 At home or travel
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 bg-red-600 text-white p-3 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}
        <form className="space-y-4">
          {/* Name Field - Fixed */}
          <div>
            <Label htmlFor="user-name" className="text-white">Full Name</Label>
            <Input
              id="user-name"
              name="fullName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              required
              aria-describedby="name-help"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Email Field - Fixed */}
          <div>
            <Label htmlFor="user-email" className="text-white">Email Address</Label>
            <Input
              id="user-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              required
              aria-describedby="email-help"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Password Field - Fixed */}
          <div>
            <Label htmlFor="user-password" className="text-white">Password</Label>
            <Input
              id="user-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Create a password (6+ characters)"
              required
              minLength={6}
              aria-describedby="password-help"
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p id="password-help" className="text-xs text-gray-500 mt-1">
              Must be at least 6 characters
            </p>
          </div>

          {/* Plan Selection - Fixed */}
          <div>
            <Label htmlFor="subscription-plan" className="text-white">Choose Your Plan</Label>
            <Select 
              value={formData.plan} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}
              name="subscriptionPlan"
            >
              <SelectTrigger id="subscription-plan" aria-describedby="plan-help" className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                <SelectItem value="trial">🎉 24-Hour FREE Trial (1 Stream)</SelectItem>
                <SelectItem value="basic">📺 $20/month - Solo Streaming (1 Stream)</SelectItem>
                <SelectItem value="duo">🌍 $35/month - Duo Streaming (2 Streams)</SelectItem>
                <SelectItem value="family">👨‍👩‍👧‍👦 $45/month - Family Streaming (3 Streams)</SelectItem>
              </SelectContent>
            </Select>
            <p id="plan-help" className="text-xs text-gray-500 mt-1">
              Same content on all plans, just different stream limits
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
            aria-describedby="submit-help"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Your Account...
              </>
            ) : (
              '📺 Start Streaming Now'
            )}
          </Button>
          <p id="submit-help" className="text-xs text-gray-500 text-center">
            📺 No credit card required • 🌍 Works on every device
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
