import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PaymentService } from "@/services/paymentService";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PaymentButtonProps {
  planId: string;
  planName: string;
  price: number;
  currency: string;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentButton({ 
  planId, 
  planName, 
  price, 
  currency, 
  className,
  children 
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to continue with payment",
          variant: "destructive"
        });
        return;
      }

      // Free trial case
      if (price === 0) {
        // Directly activate trial subscription
        const { data, error } = await supabase.functions.invoke('megaott-subscription', {
          body: {
            action: 'create',
            userId: user.id,
            subscriptionType: 'm3u',
            packageId: 1,
            maxConnections: 1,
            forcedCountry: 'ALL',
            adultContent: false,
            enableVpn: false
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        toast({
          title: "Trial Activated!",
          description: "Your free trial has been activated successfully",
        });

        // Redirect to dashboard
        window.location.href = '/dashboard';
        return;
      }

      // Paid plans - create checkout session
      const checkoutData = await PaymentService.createCheckout(planId, user.id);
      
      toast({
        title: "Redirecting to Payment",
        description: "Please complete your payment to activate your subscription",
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutData.checkout_url;

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment}
      disabled={loading}
      className={className}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children || (price === 0 ? 'Start Free Trial' : `Subscribe for $${price}/${currency === 'usd' ? 'mo' : currency}`)}
    </Button>
  );
}