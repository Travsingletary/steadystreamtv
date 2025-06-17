
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { IPTVFormData, IPTVPlan } from '@/types/iptv';

interface IPTVPaymentConfirmationProps {
  formData: IPTVFormData;
  plans: IPTVPlan[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onStripeCheckout: () => void;
}

export const IPTVPaymentConfirmation = ({ 
  formData, 
  plans, 
  loading, 
  error, 
  onBack, 
  onStripeCheckout 
}: IPTVPaymentConfirmationProps) => {
  const selectedPlan = plans.find(p => p.id === formData.planType);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Complete Your Purchase</CardTitle>
        <CardDescription>Secure payment via Stripe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Name:</span>
            <span>{formData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Plan:</span>
            <span>{selectedPlan?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Price:</span>
            <span className="text-blue-600 font-bold">
              {selectedPlan?.price}/month
            </span>
          </div>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <div className="flex space-x-4">
          <Button variant="outline" onClick={onBack} disabled={loading}>
            Back
          </Button>
          <Button onClick={onStripeCheckout} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay with Stripe'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
