import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CreditCard, Bitcoin, Shield, Zap, Lock, Globe } from 'lucide-react';

interface CardToCryptoPaymentProps {
  planId: string;
  planName: string;
  price: number;
  currency: string;
  onBack?: () => void;
}

const CardToCryptoPayment: React.FC<CardToCryptoPaymentProps> = ({
  planId,
  planName,
  price,
  currency,
  onBack
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const handleCardPayment = async () => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to continue');
        return;
      }

      // Create NowPayments checkout for card payment
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: {
          plan_id: planId,
          user_id: user.id,
          amount: price,
          currency: currency,
          payment_method: 'card'
        }
      });

      if (error) throw new Error(error.message || 'Failed to create payment');

      if (data?.checkout_url) {
        toast.success('Redirecting to secure card payment...');
        window.location.href = data.checkout_url;
      }

    } catch (error: any) {
      console.error('Card payment error:', error);
      toast.error(error.message || 'Failed to process card payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoPayment = async () => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to continue');
        return;
      }

      // Create NowPayments checkout for crypto payment
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: {
          plan_id: planId,
          user_id: user.id,
          amount: price,
          currency: currency,
          payment_method: 'crypto'
        }
      });

      if (error) throw new Error(error.message || 'Failed to create payment');

      if (data?.checkout_url) {
        toast.success('Redirecting to secure crypto payment...');
        window.location.href = data.checkout_url;
      }

    } catch (error: any) {
      console.error('Crypto payment error:', error);
      toast.error(error.message || 'Failed to process crypto payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
          Complete Your Payment
        </h2>
        <p className="text-muted-foreground">Choose your preferred payment method</p>
      </div>

      <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-background to-muted/10">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-foreground">{planName}</h3>
          <div className="text-3xl font-bold text-primary mt-2">
            ${price}<span className="text-lg text-muted-foreground">/{currency === 'usd' ? 'mo' : currency}</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card Payment
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4" />
              Cryptocurrency
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-blue-500" />
                <span>Bank Grade</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleCardPayment}
              disabled={isProcessing}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ${price} with Card
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="font-medium text-sm">Bitcoin</div>
                <div className="text-xs text-muted-foreground">BTC</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="font-medium text-sm">Ethereum</div>
                <div className="text-xs text-muted-foreground">ETH</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="font-medium text-sm">USDT</div>
                <div className="text-xs text-muted-foreground">Tether</div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div className="text-sm">
                    <div className="font-medium">Lightning Fast</div>
                    <div className="text-muted-foreground">Instant confirmations</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <div className="text-sm">
                    <div className="font-medium">Global Access</div>
                    <div className="text-muted-foreground">No geographical restrictions</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div className="text-sm">
                    <div className="font-medium">Enhanced Privacy</div>
                    <div className="text-muted-foreground">Decentralized & secure</div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCryptoPayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-3"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Bitcoin className="h-4 w-4 mr-2" />
                  Pay ${price} with Crypto
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isProcessing}
            className="w-full mt-4 text-muted-foreground hover:text-foreground"
          >
            Back to Plans
          </Button>
        )}
      </Card>

      <div className="text-center">
        <div className="text-xs text-muted-foreground">
          Secure payments powered by NowPayments • 256-bit SSL encryption
        </div>
      </div>
    </div>
  );
};

export default CardToCryptoPayment;