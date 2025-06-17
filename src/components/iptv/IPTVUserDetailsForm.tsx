
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IPTVFormData } from '@/types/iptv';

interface IPTVUserDetailsFormProps {
  formData: IPTVFormData;
  error: string;
  onInputChange: (field: keyof IPTVFormData, value: string) => void;
  onNext: () => void;
}

export const IPTVUserDetailsForm = ({ formData, error, onInputChange, onNext }: IPTVUserDetailsFormProps) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-blue-600">Get Your IPTV Subscription</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            type="text"
            placeholder="Enter your country"
            value={formData.country}
            onChange={(e) => onInputChange('country', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone/WhatsApp (Optional)</Label>
          <Input
            id="phone"
            type="text"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button onClick={onNext} className="w-full">Continue</Button>
      </CardContent>
    </Card>
  );
};
