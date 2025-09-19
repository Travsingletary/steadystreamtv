import { supabase } from "@/integrations/supabase/client";

export interface CardToCryptoPaymentRequest {
  order_id: string;
  price_amount: number;
  price_currency: string;
  receive_currency: string;
  title: string;
  description: string;
  callback_url: string;
  success_url: string;
  cancel_url: string;
  token?: string;
  purchaser_email: string;
}

export interface CardToCryptoPaymentResponse {
  id: number;
  status: string;
  price_amount: string;
  price_currency: string;
  receive_amount: string;
  receive_currency: string;
  created_at: string;
  order_id: string;
  payment_url: string;
  token?: string;
}

export interface PaymentStatus {
  id: number;
  status: string;
  price_amount: string;
  price_currency: string;
  receive_amount: string;
  receive_currency: string;
  paid_amount: string;
  paid_currency: string;
  created_at: string;
  order_id: string;
}

// Plan pricing
export const PLAN_PRICING = {
  standard: { amount: 20, currency: 'USD', name: 'Standard Plan' },
  premium: { amount: 35, currency: 'USD', name: 'Premium Plan' },
  ultimate: { amount: 45, currency: 'USD', name: 'Ultimate Plan' }
};

// Supported receive currencies (what we receive in crypto)
export const RECEIVE_CURRENCIES = [
  { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
  { code: 'LTC', name: 'Litecoin', symbol: 'Ł' },
  { code: 'USDT', name: 'Tether (USDT)', symbol: '₮' },
  { code: 'USDC', name: 'USD Coin', symbol: '$' }
];

class CardToCryptoService {
  private baseUrl = 'https://api.coingate.com/v2';
  private apiToken: string;
  private testMode: boolean;

  constructor() {
    // In production, get from environment variables
    this.apiToken = import.meta.env.VITE_COINGATE_API_TOKEN || 'demo-token';
    this.testMode = import.meta.env.VITE_COINGATE_TEST_MODE !== 'false';
  }

  /**
   * Create a new card-to-crypto payment
   * Customer pays with card, we receive crypto
   */
  async createPayment(
    planId: keyof typeof PLAN_PRICING,
    receiveCurrency: string,
    userId: string,
    customerEmail: string
  ): Promise<CardToCryptoPaymentResponse> {
    const plan = PLAN_PRICING[planId];
    const orderId = `steadystream-${Date.now()}-${userId}`;

    const paymentData: CardToCryptoPaymentRequest = {
      order_id: orderId,
      price_amount: plan.amount,
      price_currency: plan.currency,
      receive_currency: receiveCurrency,
      title: `SteadyStream TV - ${plan.name}`,
      description: `Monthly subscription for ${plan.name} - IPTV streaming service`,
      callback_url: `${window.location.origin}/api/coingate-callback`,
      success_url: `${window.location.origin}/payment-success?order_id=${orderId}&user_id=${userId}`,
      cancel_url: `${window.location.origin}/dashboard?cancelled=true`,
      purchaser_email: customerEmail
    };

    try {
      // If in demo mode, return mock response
      if (this.isDemoMode) {
        return this.createMockPayment(planId, receiveCurrency, userId, customerEmail);
      }

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiToken}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Payment creation failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      // Store payment record in Supabase
      await this.storePaymentRecord(result, userId, planId, customerEmail);

      return result;
    } catch (error) {
      console.error('Card-to-crypto payment creation error:', error);
      throw error;
    }
  }

  /**
   * Check payment status
   */
  async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    try {
      if (this.isDemoMode) {
        return this.getMockPaymentStatus(orderId);
      }

      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          'Authorization': `Token ${this.apiToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment status check error:', error);
      throw error;
    }
  }

  /**
   * Store payment record in Supabase
   */
  private async storePaymentRecord(
    paymentResponse: CardToCryptoPaymentResponse,
    userId: string,
    planId: string,
    customerEmail: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('card_crypto_payments')
        .insert({
          payment_id: paymentResponse.id.toString(),
          user_id: userId,
          plan_id: planId,
          order_id: paymentResponse.order_id,
          price_amount: parseFloat(paymentResponse.price_amount),
          price_currency: paymentResponse.price_currency,
          receive_amount: parseFloat(paymentResponse.receive_amount),
          receive_currency: paymentResponse.receive_currency,
          payment_status: paymentResponse.status,
          payment_url: paymentResponse.payment_url,
          customer_email: customerEmail,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store payment record:', error);
        // Don't throw here as payment creation succeeded
      }
    } catch (error) {
      console.error('Payment storage error:', error);
    }
  }

  /**
   * Mock payment for development/testing
   */
  private createMockPayment(
    planId: keyof typeof PLAN_PRICING,
    receiveCurrency: string,
    userId: string,
    customerEmail: string
  ): CardToCryptoPaymentResponse {
    const plan = PLAN_PRICING[planId];
    const orderId = `mock-${Date.now()}-${userId}`;

    // Mock conversion rates
    const mockRates: { [key: string]: number } = {
      'BTC': 0.00003,
      'ETH': 0.0006,
      'LTC': 0.02,
      'USDT': 1.0,
      'USDC': 1.0
    };

    const receiveAmount = plan.amount * (mockRates[receiveCurrency] || 1);

    return {
      id: Date.now(),
      status: 'new',
      price_amount: plan.amount.toString(),
      price_currency: plan.currency,
      receive_amount: receiveAmount.toFixed(8),
      receive_currency: receiveCurrency,
      created_at: new Date().toISOString(),
      order_id: orderId,
      payment_url: `${window.location.origin}/payment-success?order_id=${orderId}&user_id=${userId}&demo=true`
    };
  }

  /**
   * Mock payment status for development
   */
  private getMockPaymentStatus(orderId: string): PaymentStatus {
    return {
      id: Date.now(),
      status: 'paid', // Mock as paid for testing
      price_amount: '35.00',
      price_currency: 'USD',
      receive_amount: '0.0006',
      receive_currency: 'ETH',
      paid_amount: '35.00',
      paid_currency: 'USD',
      created_at: new Date().toISOString(),
      order_id: orderId
    };
  }

  /**
   * Process payment completion
   */
  async processPaymentCompletion(orderId: string, userId: string): Promise<boolean> {
    try {
      const paymentStatus = await this.getPaymentStatus(orderId);

      if (paymentStatus.status === 'paid') {
        // Update user subscription in database
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_tier: this.getPlanFromOrderId(orderId),
            trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) {
          console.error('Failed to update user subscription:', error);
          return false;
        }

        // Update payment status in our records
        await supabase
          .from('card_crypto_payments')
          .update({
            payment_status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('order_id', orderId);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Payment completion processing error:', error);
      return false;
    }
  }

  /**
   * Extract plan ID from order ID
   */
  private getPlanFromOrderId(orderId: string): string {
    // This is a simple implementation - in production you'd store this mapping
    if (orderId.includes('standard')) return 'standard';
    if (orderId.includes('premium')) return 'premium';
    if (orderId.includes('ultimate')) return 'ultimate';
    return 'premium'; // default
  }

  /**
   * Check if we're in demo/testing mode
   */
  get isDemoMode(): boolean {
    return !this.apiToken || this.apiToken === 'demo-token' || this.testMode;
  }

  /**
   * Get supported payment methods info
   */
  getPaymentMethodsInfo() {
    return {
      cards: ['Visa', 'Mastercard', 'American Express'],
      cryptos: RECEIVE_CURRENCIES,
      description: 'Pay with your credit/debit card. We receive payment in cryptocurrency for enhanced privacy and lower fees.'
    };
  }
}

export const cardToCryptoService = new CardToCryptoService();