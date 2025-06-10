
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSteadyStreamAutomation } from '@/hooks/useSteadyStreamAutomation';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { setupGlobalErrorHandlers } from '@/utils/errorHandling';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export const SteadyStreamAutomationModal: React.FC<AutomationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { loading, error, executeAutomation } = useSteadyStreamAutomation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'trial' as 'trial' | 'standard' | 'premium' | 'ultimate'
  });
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Setup global error handlers when modal opens
  useEffect(() => {
    if (isOpen) {
      setupGlobalErrorHandlers();
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'plan' ? value as 'trial' | 'standard' | 'premium' | 'ultimate' : value 
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Please enter your full name';
    }
    if (!formData.email.trim()) {
      return 'Please enter your email address';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    if (!formData.password.trim()) {
      return 'Please enter a password';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setIsRetrying(false);
      const result = await executeAutomation(formData);

      if (result.success) {
        onSuccess({
          userData: formData,
          credentials: result.credentials,
          user: result.user
        });
        onClose();
        setRetryCount(0);
      }
    } catch (err: any) {
      console.error('💥 Automation submission failed:', err);
      setRetryCount(prev => prev + 1);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    await handleSubmit();
    setIsRetrying(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-dark-200 border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Start Your Free Trial</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-gray-400">
            Join SteadyStream TV with our independent platform
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg text-red-300 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              {retryCount > 0 && retryCount < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="mt-2 text-xs"
                >
                  {isRetrying ? 'Retrying...' : `Try Again (${retryCount}/3)`}
                </Button>
              )}
            </div>
          )}

          {!error && loading && (
            <div className="bg-blue-900/30 border border-blue-600 p-3 rounded-lg text-blue-300 text-sm">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-transparent"></div>
                <span>Creating your account...</span>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Full Name</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-dark-300 border-gray-700 text-white"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Email Address</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-dark-300 border-gray-700 text-white"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Password</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-dark-300 border-gray-700 text-white"
              placeholder="Create a password (6+ characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Choose Plan</label>
            <Select value={formData.plan} onValueChange={(value) => handleInputChange('plan', value)}>
              <SelectTrigger className="bg-dark-300 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">🎉 24-Hour FREE Trial</SelectItem>
                <SelectItem value="standard">💰 $20/month - Standard (2 Devices)</SelectItem>
                <SelectItem value="premium">💎 $35/month - Premium (4 Devices)</SelectItem>
                <SelectItem value="ultimate">👨‍👩‍👧‍👦 $45/month - Ultimate (6 Devices)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || isRetrying || !formData.name || !formData.email || !formData.password || formData.password.length < 6}
            className="w-full bg-gold hover:bg-gold-dark text-black font-bold"
          >
            {loading || isRetrying ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                {isRetrying ? 'Retrying...' : 'Creating Your Account...'}
              </div>
            ) : (
              '🚀 Start Streaming Now'
            )}
          </Button>

          <div className="text-center text-sm text-gray-400 space-y-1">
            <p>✅ No credit card required for trial</p>
            <p>✅ Instant activation with our independent platform</p>
            <p>✅ Full control and reliability</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
