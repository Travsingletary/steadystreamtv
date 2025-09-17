import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PaymentService } from "@/services/paymentService";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setStatus('error');
        toast({
          title: "Invalid Session",
          description: "No payment session found",
          variant: "destructive"
        });
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // Wait for subscription to be activated (webhook processing)
        toast({
          title: "Processing Payment",
          description: "Please wait while we activate your subscription...",
        });

        const isActivated = await PaymentService.waitForSubscriptionActivation(user.id, 30);
        
        if (isActivated) {
          const subscriptionStatus = await PaymentService.getSubscriptionStatus(user.id);
          setSubscriptionData(subscriptionStatus);
          setStatus('success');
          
          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated",
          });
        } else {
          setStatus('error');
          toast({
            title: "Activation Pending",
            description: "Your payment was successful but activation is taking longer than expected. Please contact support if this persists.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        toast({
          title: "Verification Error",
          description: "Unable to verify payment status. Please contact support.",
          variant: "destructive"
        });
      }
    };

    verifyPayment();
  }, [sessionId, navigate, toast]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleContactSupport = () => {
    // Open support email or chat
    window.location.href = 'mailto:support@yoursite.com';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
              <CardTitle>Processing Payment</CardTitle>
              <CardDescription>
                Please wait while we verify your payment and activate your subscription...
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <CardTitle className="text-green-700">Payment Successful!</CardTitle>
              <CardDescription>
                Your subscription has been activated and you now have access to all features.
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <CardTitle className="text-red-700">Payment Issue</CardTitle>
              <CardDescription>
                There was an issue processing your payment or activating your subscription.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && subscriptionData && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Subscription Details
              </h3>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <p><strong>Plan:</strong> {subscriptionData.subscription?.plan_name}</p>
                <p><strong>Type:</strong> {subscriptionData.subscription?.subscription_type?.toUpperCase()}</p>
                <p><strong>Connections:</strong> {subscriptionData.subscription?.max_connections}</p>
                {subscriptionData.expires_at && (
                  <p><strong>Expires:</strong> {new Date(subscriptionData.expires_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {status === 'success' && (
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            )}

            {status === 'error' && (
              <>
                <Button onClick={handleContactSupport} className="w-full">
                  Contact Support
                </Button>
                <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </>
            )}

            {status === 'checking' && (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Session ID: {sessionId}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;