
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock } from 'lucide-react';
import { IPTVFormData, IPTVPlan } from '@/types/iptv';

interface IPTVPlanSelectionProps {
  formData: IPTVFormData;
  plans: IPTVPlan[];
  error: string;
  onInputChange: (field: keyof IPTVFormData, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const IPTVPlanSelection = ({ formData, plans, error, onInputChange, onNext, onBack }: IPTVPlanSelectionProps) => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select the perfect IPTV package</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
              formData.planType === plan.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
            } ${
              plan.popular ? 'border-blue-500' : 
              plan.isTrial ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100' : ''
            }`}
            onClick={() => onInputChange('planType', plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                Most Popular
              </Badge>
            )}
            {plan.isTrial && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
                Start Free
              </Badge>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className={`text-3xl font-bold ${plan.isTrial ? 'text-green-600' : 'text-blue-600'}`}>
                {plan.isTrial ? (
                  <div>
                    <span>FREE</span>
                    <div className="text-sm text-gray-500 font-normal">24-hour trial</div>
                  </div>
                ) : (
                  plan.price
                )}
              </div>
              {!plan.isTrial && (
                <CardDescription>per month</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className={`h-4 w-4 mr-2 ${plan.isTrial ? 'text-green-500' : 'text-green-500'}`} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button 
          onClick={onNext} 
          disabled={!formData.planType}
          className={formData.planType === 'free-trial' ? 'bg-green-500 hover:bg-green-600' : ''}
        >
          {formData.planType === 'free-trial' ? (
            <>
              <Clock className="mr-2 h-4 w-4" />
              Start Free Trial
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
};
