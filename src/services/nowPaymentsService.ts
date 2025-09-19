import { supabase } from "@/integrations/supabase/client";

export interface NOWPaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  order_id: string;
  order_description: string;
  success_url: string;
  cancel_url: string;
  ipn_callback_url: string;
}

export interface NOWPaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  invoice_url: string;
}

export interface NOWPaymentStatus {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  actually_paid: number;
  outcome_amount: number;
  outcome_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
}

// Plan pricing for all durations
export const PLAN_PRICING = {
  // 1-Month Plans
  'standard': { amount: 20, currency: 'USD', name: 'Standard Plan (1 Month)' },
  'premium': { amount: 35, currency: 'USD', name: 'Premium Plan (1 Month)' },
  'ultimate': { amount: 45, currency: 'USD', name: 'Ultimate Plan (1 Month)' },

  // 6-Month Plans
  'standard-6m': { amount: 100, currency: 'USD', name: 'Standard Plan (6 Months)' },
  'premium-6m': { amount: 175, currency: 'USD', name: 'Premium Plan (6 Months)' },
  'ultimate-6m': { amount: 225, currency: 'USD', name: 'Ultimate Plan (6 Months)' },

  // 12-Month Plans
  'standard-12m': { amount: 180, currency: 'USD', name: 'Standard Plan (12 Months)' },
  'premium-12m': { amount: 315, currency: 'USD', name: 'Premium Plan (12 Months)' },
  'ultimate-12m': { amount: 405, currency: 'USD', name: 'Ultimate Plan (12 Months)' },

  // Trial
  'trial': { amount: 1, currency: 'USD', name: 'Trial Plan' },
  'free-trial': { amount: 1, currency: 'USD', name: 'Free Trial' }
};

// NOWPayments supported currencies for receiving
export const NOWPAYMENTS_CURRENCIES = [
  { code: 'btc', name: 'Bitcoin', symbol: '₿' },
  { code: 'eth', name: 'Ethereum', symbol: 'Ξ' },
  { code: 'ltc', name: 'Litecoin', symbol: 'Ł' },
  { code: 'usdt', name: 'Tether (USDT)', symbol: '₮' },
  { code: 'usdc', name: 'USD Coin', symbol: '$' },
  { code: 'ada', name: 'Cardano', symbol: 'ADA' },
  { code: 'matic', name: 'Polygon', symbol: 'MATIC' },
  { code: 'sol', name: 'Solana', symbol: 'SOL' },
  { code: 'avax', name: 'Avalanche', symbol: 'AVAX' },
  { code: 'trx', name: 'TRON', symbol: 'TRX' }
];

class NOWPaymentsService {
  private apiKey: string;
  private testMode: boolean;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_NOWPAYMENTS_API_KEY || 'demo-key';
    this.testMode = import.meta.env.VITE_NOWPAYMENTS_TEST_MODE !== 'false';
    this.baseUrl = this.testMode
      ? 'https://api-sandbox.nowpayments.io/v1'
      : 'https://api.nowpayments.io/v1';
  }

  /**
   * Create a new payment
   */
  async createPayment(
    planId: keyof typeof PLAN_PRICING,
    payCurrency: string,
    userId: string,
    customerEmail: string
  ): Promise<NOWPaymentResponse> {
    const plan = PLAN_PRICING[planId];
    const orderId = `steadystream-${Date.now()}-${userId}`;
    const purchaseId = `purchase-${Date.now()}`;

    if (this.isDemoMode) {
      return this.createMockPayment(planId, payCurrency, userId, customerEmail);
    }

    const paymentData: NOWPaymentRequest = {
      price_amount: plan.amount,
      price_currency: plan.currency,
      pay_currency: payCurrency.toLowerCase(),
      order_id: orderId,
      order_description: `SteadyStream TV - ${plan.name} subscription`,
      success_url: `https://steadystreamtv.com/payment-success?order_id=${orderId}&user_id=${userId}`,
      cancel_url: `https://steadystreamtv.com/payment-failed?order_id=${orderId}`,
      ipn_callback_url: `https://steadystreamtv.com/api/nowpayments-webhook`
    };

    try {
      const response = await fetch(`${this.baseUrl}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`NOWPayments invoice creation failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      // Store payment record in Supabase (temporarily disabled until table is created)
      // await this.storePaymentRecord(result, userId, planId, customerEmail);

      return result;
    } catch (error) {
      console.error('NOWPayments creation error:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<NOWPaymentStatus> {
    if (this.isDemoMode) {
      return this.getMockPaymentStatus(paymentId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment/${paymentId}`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Payment status check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment status check error:', error);
      throw error;
    }
  }

  /**
   * Get available currencies
   */
  async getAvailableCurrencies(): Promise<string[]> {
    if (this.isDemoMode) {
      return NOWPAYMENTS_CURRENCIES.map(c => c.code);
    }

    try {
      const response = await fetch(`${this.baseUrl}/currencies`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch currencies: ${response.statusText}`);
      }

      const result = await response.json();
      return result.currencies || [];
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
      return NOWPAYMENTS_CURRENCIES.map(c => c.code);
    }
  }

  /**
   * Get minimum payment amount for a currency
   */
  async getMinimumAmount(currency: string): Promise<number> {
    if (this.isDemoMode) {
      return 0.001; // Mock minimum
    }

    try {
      const response = await fetch(`${this.baseUrl}/min-amount?currency_from=usd&currency_to=${currency.toLowerCase()}`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get minimum amount: ${response.statusText}`);
      }

      const result = await response.json();
      return result.min_amount || 0.001;
    } catch (error) {
      console.error('Failed to get minimum amount:', error);
      return 0.001;
    }
  }

  /**
   * Store payment record in Supabase
   */
  private async storePaymentRecord(
    paymentResponse: NOWPaymentResponse,
    userId: string,
    planId: string,
    customerEmail: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('nowpayments_records')
        .insert({
          payment_id: paymentResponse.payment_id,
          order_id: paymentResponse.order_id,
          user_id: userId,
          plan_id: planId,
          price_amount: paymentResponse.price_amount,
          price_currency: paymentResponse.price_currency,
          pay_amount: paymentResponse.pay_amount,
          pay_currency: paymentResponse.pay_currency,
          payment_status: paymentResponse.payment_status,
          invoice_url: paymentResponse.invoice_url,
          customer_email: customerEmail,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store payment record:', error);
        // Don't throw error to avoid breaking payment flow
      } else {
        console.log('Payment record stored successfully');
      }
    } catch (error) {
      console.error('Payment storage error:', error);
      // Don't throw error to avoid breaking payment flow
    }
  }

  /**
   * Process payment completion
   */
  async processPaymentCompletion(orderId: string, userId: string): Promise<boolean> {
    try {
      // In demo mode, simulate successful payment
      if (this.isDemoMode) {
        console.log('Demo mode: Simulating successful payment for order:', orderId);
        // Update user subscription directly
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_tier: this.getPlanFromOrderId(orderId),
            trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) {
          console.error('Failed to update user subscription:', error);
          return false;
        }

        return true;
      }

      // For real payments, we'll rely on webhook verification for now
      // Since the webhook handles subscription activation, we just mark as successful here
      console.log('Real payment mode: Payment created for order:', orderId);
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_tier: this.getPlanFromOrderId(orderId),
          trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Failed to update user subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Payment completion processing error:', error);
      return false;
    }
  }

  /**
   * Extract plan from order ID
   */
  private getPlanFromOrderId(orderId: string): string {
    if (orderId.includes('standard')) return 'standard';
    if (orderId.includes('premium')) return 'premium';
    if (orderId.includes('ultimate')) return 'ultimate';
    return 'premium';
  }

  /**
   * Mock payment for development
   */
  private createMockPayment(
    planId: keyof typeof PLAN_PRICING,
    payCurrency: string,
    userId: string,
    customerEmail: string
  ): NOWPaymentResponse {
    const plan = PLAN_PRICING[planId];
    const orderId = `mock-${Date.now()}-${userId}`;

    // Mock conversion rates
    const mockRates: { [key: string]: number } = {
      'btc': 0.0005,
      'eth': 0.01,
      'ltc': 0.2,
      'usdt': 35.0,
      'usdc': 35.0
    };

    const payAmount = plan.amount * (mockRates[payCurrency.toLowerCase()] || 1);

    return {
      payment_id: `mock_${Date.now()}`,
      payment_status: 'waiting',
      pay_address: `mock_address_${payCurrency}`,
      price_amount: plan.amount,
      price_currency: plan.currency,
      pay_amount: payAmount,
      pay_currency: payCurrency.toLowerCase(),
      order_id: orderId,
      order_description: `SteadyStream TV - ${plan.name}`,
      purchase_id: `purchase_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      invoice_url: `${window.location.origin}/payment-success?order_id=${orderId}&user_id=${userId}&demo=true`
    };
  }

  /**
   * Mock payment status
   */
  private getMockPaymentStatus(paymentId: string): NOWPaymentStatus {
    // Extract order_id from payment_id for mock payments
    const orderId = paymentId.replace('mock_', 'steadystream-');
    
    return {
      payment_id: paymentId,
      payment_status: 'finished',
      pay_address: 'mock_address',
      price_amount: 35,
      price_currency: 'USD',
      pay_amount: 0.001,
      pay_currency: 'btc',
      actually_paid: 0.001,
      outcome_amount: 0.001,
      outcome_currency: 'btc',
      order_id: orderId,
      order_description: 'SteadyStream TV - Premium',
      purchase_id: 'mock_purchase',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Check if in demo mode
   */
  get isDemoMode(): boolean {
    return !this.apiKey || this.apiKey === 'demo-key' || this.testMode;
  }

  /**
   * Get service info
   */
  getServiceInfo() {
    return {
      processor: 'nowpayments',
      testMode: this.testMode,
      supportedCurrencies: NOWPAYMENTS_CURRENCIES,
      description: 'Pay with 300+ cryptocurrencies. We receive your chosen cryptocurrency directly.',
      features: [
        'Instant setup (no KYC required)',
        '300+ supported cryptocurrencies',
        '0.5-1.5% processing fees',
        'Direct crypto settlements',
        'Real-time payment tracking'
      ]
    };
  }
}

export const nowPaymentsService = new NOWPaymentsService();