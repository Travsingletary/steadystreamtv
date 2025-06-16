
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CircuitBreakerErrorProps {
  onRetry: () => void;
  onForceAccess: () => void;
  onReset: () => void;
}

export const CircuitBreakerError = ({ onRetry, onForceAccess, onReset }: CircuitBreakerErrorProps) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-dark-200 border-gray-800">
        <CardHeader className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <CardTitle className="text-2xl text-white">Admin Access Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-gray-300 space-y-2">
            <p>Multiple failed attempts detected. Circuit breaker activated to prevent infinite loops.</p>
            <p className="text-sm">The system has temporarily stopped making admin verification requests.</p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={onRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
            
            <Button 
              onClick={onForceAccess}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Force Admin Access
            </Button>
            
            <Button 
              onClick={onReset}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Reset & Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
