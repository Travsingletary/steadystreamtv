
import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface OnboardingData {
  name: string;
  email: string;
  password: string;
  plan: string;
  preferences: {
    favoriteGenres: string[];
    deviceType: string;
    notifications: boolean;
  };
}

export const EnhancedOnboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    email: '',
    password: '',
    plan: 'trial',
    preferences: {
      favoriteGenres: [],
      deviceType: 'tv',
      notifications: true
    }
  });
  const { toast } = useToast();

  const genres = ['Sports', 'Movies', 'News', 'Documentary', 'Kids', 'Entertainment'];
  const plans = [
    { id: 'trial', name: 'Free Trial', price: 0, duration: '24 hours' },
    { id: 'standard', name: 'Standard', price: 20, duration: 'monthly' },
    { id: 'premium', name: 'Premium', price: 35, duration: 'monthly' },
    { id: 'ultimate', name: 'Ultimate', price: 45, duration: 'monthly' }
  ];

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleGenreToggle = (genre: string) => {
    const newGenres = data.preferences.favoriteGenres.includes(genre)
      ? data.preferences.favoriteGenres.filter(g => g !== genre)
      : [...data.preferences.favoriteGenres, genre];
    
    setData({
      ...data,
      preferences: {
        ...data.preferences,
        favoriteGenres: newGenres
      }
    });
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      // Call enhanced automation
      const response = await supabase.functions.invoke('automated-registration', {
        body: {
          name: data.name,
          email: data.email,
          password: data.password,
          plan: data.plan,
          preferences: data.preferences,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Account Created!",
        description: "Your SteadyStream TV account has been created successfully.",
      });

      // Move to success step
      setStep(5);

    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Welcome to SteadyStream TV</CardTitle>
              <CardDescription>Let's create your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  placeholder="Create a password"
                />
              </div>
              <Button 
                onClick={handleNext} 
                className="w-full"
                disabled={!data.name || !data.email || !data.password}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Choose Your Plan</CardTitle>
              <CardDescription>Select the plan that works best for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={data.plan} onValueChange={(value) => setData({ ...data, plan: value })}>
                {plans.map((plan) => (
                  <div key={plan.id} className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value={plan.id} id={plan.id} />
                    <div className="flex-1">
                      <Label htmlFor={plan.id} className="font-medium">
                        {plan.name}
                      </Label>
                      <p className="text-sm text-gray-500">
                        ${plan.price}/{plan.duration}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Your Preferences</CardTitle>
              <CardDescription>Help us personalize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Favorite Genres</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {genres.map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={genre}
                        checked={data.preferences.favoriteGenres.includes(genre)}
                        onCheckedChange={() => handleGenreToggle(genre)}
                      />
                      <Label htmlFor={genre} className="text-sm">
                        {genre}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-base font-medium">Primary Device</Label>
                <RadioGroup 
                  value={data.preferences.deviceType} 
                  onValueChange={(value) => setData({
                    ...data,
                    preferences: { ...data.preferences, deviceType: value }
                  })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tv" id="tv" />
                    <Label htmlFor="tv">Smart TV / Fire Stick</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mobile" id="mobile" />
                    <Label htmlFor="mobile">Mobile / Tablet</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="computer" id="computer" />
                    <Label htmlFor="computer">Computer</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <CardDescription>Please review your information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div>
                  <Label className="text-sm text-gray-500">Name</Label>
                  <p>{data.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Email</Label>
                  <p>{data.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Plan</Label>
                  <p>{plans.find(p => p.id === data.plan)?.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Favorite Genres</Label>
                  <p>{data.preferences.favoriteGenres.join(', ') || 'None selected'}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleComplete} 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <CardTitle>Welcome to SteadyStream TV!</CardTitle>
              <CardDescription>Your account has been created successfully</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Check your email for setup instructions and your activation code.
              </p>
              <Button 
                onClick={() => window.location.href = '/dashboard'} 
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= step 
                    ? 'bg-gold text-black' 
                    : 'bg-gray-600 text-white'
                }`}
              >
                {i}
              </div>
            ))}
          </div>
        </div>

        {renderStep()}
      </div>
    </div>
  );
};
