import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Tv, Copy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_live_51RMcvVRwOs2QPPvggeWS8jHf1SBl9HDwyzw0gRdRnSFKaJNBHSHK3bwfOly3hyMErV1qEJYErEi2HmXrUxYLP3u300ixHe6K7C');

const EnhancedIPTVSubscription = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', country: '', phone: '', planType: ''
  });
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');

  // UPDATE THESE WITH YOUR ACTUAL STRIPE PRICE IDs
  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '$9.99',
      priceId: 'price_1234567890', // REPLACE WITH YOUR ACTUAL PRICE ID
      features: ['1000+ Channels', 'HD Quality', '1 Connection', 'Basic Support'],
      packageId: 1
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: '$19.99',
      priceId: 'price_1234567891', // REPLACE WITH YOUR ACTUAL PRICE ID
      features: ['2500+ Channels', 'HD & 4K Quality', '2 Connections', 'VOD Library'],
      packageId: 2,
      popular: true
    },
    {
      id: 'ultimate',
      name: 'Ultimate Plan',
      price: '$29.99',
      priceId: 'price_1234567892', // REPLACE WITH YOUR ACTUAL PRICE ID
      features: ['5000+ Channels', 'HD & 4K Quality', '3 Connections', 'Adult Content'],
      packageId: 3
    }
  ];

  useEffect(() => {
    checkExistingSubscription();
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('customer_email', user.email)
          .eq('status', 'active')
          .single();

        if (subscription) {
          setCredentials({
            username: subscription.megaott_username,
            password: subscription.megaott_password,
            server_url: subscription.server_url,
            playlist_url: subscription.playlist_url,
            max_connections: subscription.max_connections,
            expiration_date: subscription.expiration_date
          });
          setCurrentStep(4);
        }
      }
    } catch (error) {
      console.log('No existing subscription found');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email) {
        setError('Please fill in all required fields');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.planType) {
        setError('Please select a subscription plan');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
    setError('');
  };

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const selectedPlan = plans.find(p => p.id === formData.planType);

      const { data, error: checkoutError } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          priceId: selectedPlan.priceId,
          customerEmail: formData.email,
          customerName: formData.name,
          planType: formData.planType,
          metadata: {
            customer_country: formData.country,
            customer_phone: formData.phone
          }
        }
      });

      if (checkoutError) throw new Error(checkoutError.message);

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (err) {
      setError(err.message || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const renderStep1 = () => (
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
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            type="text"
            placeholder="Enter your country"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone/WhatsApp (Optional)</Label>
          <Input
            id="phone"
            type="text"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button onClick={handleNext} className="w-full">Continue</Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select the perfect IPTV package</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
              formData.planType === plan.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
            } ${plan.popular ? 'border-blue-500' : ''}`}
            onClick={() => handleInputChange('planType', plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-blue-600">{plan.price}</div>
              <CardDescription>per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
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
        <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
        <Button onClick={handleNext} disabled={!formData.planType}>Continue</Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
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
            <span>{plans.find(p => p.id === formData.planType)?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Price:</span>
            <span className="text-blue-600 font-bold">
              {plans.find(p => p.id === formData.planType)?.price}/month
            </span>
          </div>
        </div>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={loading}>
            Back
          </Button>
          <Button onClick={handleStripeCheckout} disabled={loading} className="flex-1">
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

  const renderStep4 = () => (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Welcome to Premium IPTV!</CardTitle>
          <CardDescription>Your subscription is active and ready to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Tv className="mr-2 h-5 w-5" />
              Your IPTV Credentials
            </h3>
            <div className="grid gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Username:</Label>
                <div className="bg-white p-2 rounded border font-mono text-sm flex items-center justify-between">
                  <span>{credentials?.username}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(credentials?.username)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Password:</Label>
                <div className="bg-white p-2 rounded border font-mono text-sm flex items-center justify-between">
                  <span>{credentials?.password}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(credentials?.password)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Server URL:</Label>
                <div className="bg-white p-2 rounded border font-mono text-sm flex items-center justify-between">
                  <span className="break-all">{credentials?.server_url}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(credentials?.server_url)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">M3U Playlist:</Label>
                <div className="bg-white p-2 rounded border font-mono text-sm flex items-center justify-between">
                  <span className="break-all">{credentials?.playlist_url}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(credentials?.playlist_url)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">✅ Powered by MegaOTT</h4>
            <p className="text-sm text-green-700">
              Your subscription expires on {new Date(credentials?.expiration_date).toLocaleDateString()}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="py-12">
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
      <div className="flex justify-center">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default EnhancedIPTVSubscription;
