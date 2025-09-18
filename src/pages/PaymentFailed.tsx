import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, ArrowLeft } from "lucide-react";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('order_id');
  const reason = searchParams.get('reason') || 'Payment processing failed';

  useEffect(() => {
    // Log failed payment for analytics
    console.log('Payment failed:', { orderId, reason });
  }, [orderId, reason]);

  const handleRetryPayment = () => {
    // Go back to onboarding subscription step
    navigate('/onboarding?step=subscription');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    // Open support email or chat
    window.open('mailto:support@steadystream.tv?subject=Payment Failed - Order ' + orderId, '_blank');
  };

  return (
    <div className="min-h-screen bg-black py-20 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-dark-200 rounded-xl border border-gray-800 p-8 text-center">
        <div className="inline-flex items-center justify-center bg-red-500/20 rounded-full p-4 mb-6">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>

        <p className="text-gray-400 mb-6">
          We couldn't process your payment. This can happen for several reasons:
        </p>

        <div className="bg-dark-100 border border-gray-700 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold mb-2">Common reasons:</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Insufficient crypto balance</li>
            <li>• Payment sent to wrong address</li>
            <li>• Network congestion delays</li>
            <li>• Payment window expired</li>
            <li>• Incorrect amount sent</li>
          </ul>
        </div>

        {orderId && (
          <div className="bg-dark-100 border border-gray-700 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">Order ID:</p>
            <p className="font-mono text-sm">{orderId}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleRetryPayment}
            className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Payment Again
          </Button>

          <Button
            onClick={handleContactSupport}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Contact Support
          </Button>

          <Button
            onClick={handleGoHome}
            variant="ghost"
            className="w-full text-gray-400 hover:text-gray-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team with your order ID for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;