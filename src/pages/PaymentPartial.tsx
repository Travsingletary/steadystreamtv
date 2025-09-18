import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Clock, ArrowLeft } from "lucide-react";
import { nowPaymentsService } from "@/services/nowPaymentsService";

const PaymentPartial = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');
  const paidAmount = searchParams.get('paid_amount');
  const requiredAmount = searchParams.get('required_amount');
  const currency = searchParams.get('currency');

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (paymentId) {
        try {
          const details = await nowPaymentsService.getPaymentStatus(paymentId);
          setPaymentDetails(details);
        } catch (error) {
          console.error('Failed to fetch payment details:', error);
        }
      }
      setLoading(false);
    };

    fetchPaymentDetails();
  }, [paymentId]);

  const remainingAmount = paymentDetails
    ? (paymentDetails.pay_amount - (paymentDetails.actually_paid || 0)).toFixed(8)
    : requiredAmount && paidAmount
    ? (parseFloat(requiredAmount) - parseFloat(paidAmount)).toFixed(8)
    : '0';

  const handleCompletePayment = () => {
    // Redirect back to complete the payment
    if (paymentId) {
      window.location.href = `https://nowpayments.io/payment/?paymentId=${paymentId}`;
    } else {
      navigate('/onboarding?step=subscription');
    }
  };

  const handleNewPayment = () => {
    navigate('/onboarding?step=subscription');
  };

  const handleContactSupport = () => {
    window.open(`mailto:support@steadystream.tv?subject=Partial Payment - Order ${orderId}`, '_blank');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 text-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-20 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-dark-200 rounded-xl border border-gray-800 p-8 text-center">
        <div className="inline-flex items-center justify-center bg-yellow-500/20 rounded-full p-4 mb-6">
          <AlertCircle className="h-8 w-8 text-yellow-500" />
        </div>

        <h1 className="text-2xl font-bold mb-4">Partial Payment Received</h1>

        <p className="text-gray-400 mb-6">
          We received your payment, but the amount was less than required to complete your subscription.
        </p>

        <div className="bg-dark-100 border border-gray-700 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Amount Paid:</span>
            <span className="text-green-400 font-semibold">
              {paidAmount || paymentDetails?.actually_paid || '0'} {currency?.toUpperCase() || paymentDetails?.pay_currency?.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Required Amount:</span>
            <span className="text-gray-300 font-semibold">
              {requiredAmount || paymentDetails?.pay_amount || '0'} {currency?.toUpperCase() || paymentDetails?.pay_currency?.toUpperCase()}
            </span>
          </div>

          <div className="border-t border-gray-600 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Remaining:</span>
              <span className="text-yellow-400 font-bold">
                {remainingAmount} {currency?.toUpperCase() || paymentDetails?.pay_currency?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {orderId && (
          <div className="bg-dark-100 border border-gray-700 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">Order ID:</p>
            <p className="font-mono text-sm">{orderId}</p>
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-blue-400 font-semibold mb-2">What happens next?</h3>
          <ul className="text-sm text-gray-400 text-left space-y-1">
            <li>• Send the remaining amount to complete your subscription</li>
            <li>• Or start a new payment with the full amount</li>
            <li>• Your partial payment will be credited if you contact support</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleCompletePayment}
            className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Complete Payment ({remainingAmount} {currency?.toUpperCase() || 'crypto'})
          </Button>

          <Button
            onClick={handleNewPayment}
            variant="outline"
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Start New Payment
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
            Partial payments are held for 24 hours. Contact support to process refunds or apply credits.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPartial;