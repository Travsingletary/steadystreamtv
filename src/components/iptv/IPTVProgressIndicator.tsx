
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface IPTVProgressIndicatorProps {
  currentStep: number;
}

export const IPTVProgressIndicator = ({ currentStep }: IPTVProgressIndicatorProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
            {step < 4 && (
              <div className={`w-16 h-1 mx-2 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>Details</span>
        <span>Plan</span>
        <span>Payment</span>
        <span>Ready</span>
      </div>
    </div>
  );
};
