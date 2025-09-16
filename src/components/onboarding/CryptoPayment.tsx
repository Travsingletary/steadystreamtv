import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Bitcoin, CreditCard, Smartphone } from 'lucide-react';

interface CryptoPaymentProps {
  customerEmail: string;
  customerName: string;
  planType: string;
  onBack: () => void;
}

const CryptoPayment: React.FC<CryptoPaymentProps> = ({
  customerEmail,
  customerName,
  planType,
  onBack
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const planDetails = {
    standard: { price: 15, name: "Standard Plan", features: ["2 Connections", "HD Quality", "Basic Support"] },
    premium: { price: 25, name: "Premium Plan", features: ["4 Connections", "4K Quality", "Priority Support"] },
    ultimate: { price: 35, name: "Ultimate Plan", features: ["6 Connections", "4K Quality", "Premium Support", "Adult Content"] }
  };

  const plan = planDetails[planType as keyof typeof planDetails];

  const handleCryptoPayment = async () => {
    setIsProcessing(true);
    
    try {
      console.log('Initiating crypto payment...');
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          customerEmail,
          customerName,
          planType
        }
      });

      if (error) {
        console.error('Payment creation error:', error);
        throw new Error(error.message || 'Failed to create payment');
      }

      if (data?.url) {
        console.log('Redirecting to crypto payment:', data.url);
        
        toast.success('Redirecting to secure crypto payment...');
        
        // External payment URL - use window.location.href for external redirect
        window.location.href = data.url;
      } else {
        throw new Error('No payment URL returned');
      }

    } catch (error: any) {
      console.error('Crypto payment error:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Secure Crypto Payment</h2>
        <p className="text-gray-400">Complete your subscription with cryptocurrency</p>
      </div>

      <Card className="p-6 bg-dark-200 border-gray-700">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gold">{plan?.name}</h3>
            <div className="text-3xl font-bold text-white mt-2">
              ${plan?.price}<span className="text-lg text-gray-400">/month</span>
            </div>
          </div>

          <div className="space-y-2">
            {plan?.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-gold rounded-full"></div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-600 pt-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Customer:</span>
              <span>{customerName}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Email:</span>
              <span>{customerEmail}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-dark-200 border-gray-700">
        <div className="space-y-4">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-gold" />
            Supported Cryptocurrencies
          </h4>
          
          <div className="grid grid-cols-3 gap-3 text-sm text-gray-400">
            <div className="text-center">
              <div className="font-medium">Bitcoin</div>
              <div>BTC</div>
            </div>
            <div className="text-center">
              <div className="font-medium">Ethereum</div>
              <div>ETH</div>
            </div>
            <div className="text-center">
              <div className="font-medium">Litecoin</div>
              <div>LTC</div>
            </div>
          </div>

          <div className="bg-dark-300 p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-gold mt-0.5" />
              <div className="text-sm">
                <div className="text-white font-medium mb-1">Why Crypto?</div>
                <ul className="text-gray-400 space-y-1">
                  <li>• Lower fees than credit cards</li>
                  <li>• Instant global payments</li>
                  <li>• Enhanced privacy protection</li>
                  <li>• No chargebacks or disputes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Button
          onClick={handleCryptoPayment}
          disabled={isProcessing}
          className="w-full bg-gold hover:bg-gold-dark text-black font-semibold py-3"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Payment...
            </>
          ) : (
            <>
              <Bitcoin className="h-4 w-4 mr-2" />
              Pay with Cryptocurrency
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isProcessing}
          className="w-full text-gray-400 hover:text-white"
        >
          Back to Plan Selection
        </Button>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Smartphone className="h-4 w-4" />
          <span>Secure payment powered by NowPayments</span>
        </div>
      </div>
    </div>
  );
};

export default CryptoPayment;