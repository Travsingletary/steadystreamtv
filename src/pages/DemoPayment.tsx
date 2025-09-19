import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";

const DemoPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
    email: "",
    cryptoAddress: ""
  });

  // Get payment details from URL
  const orderId = searchParams.get('order_id');
  const userId = searchParams.get('user_id');
  const plan = searchParams.get('plan');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency');

  useEffect(() => {
    if (!orderId || !userId) {
      toast.error("Invalid payment session");
      navigate('/');
    }
  }, [orderId, userId, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) { // 16 digits + 3 spaces
      handleInputChange('cardNumber', formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) { // MM/YY
      handleInputChange('expiryDate', formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      handleInputChange('cvv', value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.holderName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success("Payment processed successfully!");

      // Redirect to success page
      navigate(`/payment-success?order_id=${orderId}&user_id=${userId}&demo=true`);

    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const planNames = {
    standard: "Standard Plan",
    premium: "Premium Plan",
    ultimate: "Ultimate Plan"
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-green-400 mr-2" />
            <h1 className="text-2xl font-bold text-white">Demo Payment</h1>
          </div>
          <p className="text-gray-400">This is a demo payment form for testing purposes</p>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Plan:</span>
              <span className="text-white">{planNames[plan as keyof typeof planNames] || plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white">${amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment Method:</span>
              <span className="text-white">{currency?.toUpperCase()} (Crypto)</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-4">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Total:</span>
                <span className="text-green-400">${amount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center mb-4">
              <CreditCard className="w-5 h-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Payment Information</h3>
            </div>

            {/* Card Number */}
            <div>
              <Label htmlFor="cardNumber" className="text-white">Card Number</Label>
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={handleCardNumberChange}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                required
              />
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate" className="text-white">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={handleExpiryChange}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv" className="text-white">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={handleCvvChange}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  required
                />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <Label htmlFor="holderName" className="text-white">Cardholder Name</Label>
              <Input
                id="holderName"
                type="text"
                placeholder="John Doe"
                value={paymentData.holderName}
                onChange={(e) => handleInputChange('holderName', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={paymentData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
                required
              />
            </div>

            {/* Crypto Address (Optional) */}
            <div>
              <Label htmlFor="cryptoAddress" className="text-white">
                {currency?.toUpperCase()} Wallet Address (Optional)
              </Label>
              <Input
                id="cryptoAddress"
                type="text"
                placeholder="Enter your wallet address for direct payment"
                value={paymentData.cryptoAddress}
                onChange={(e) => handleInputChange('cryptoAddress', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>

            {/* Demo Notice */}
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-yellow-200 text-sm">
                    <strong>Demo Mode:</strong> This is a test payment. No real transaction will be processed.
                    Your payment information is not stored or transmitted.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/onboarding')}
                className="flex-1"
                disabled={isProcessing}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Complete Payment (${amount})
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DemoPayment;