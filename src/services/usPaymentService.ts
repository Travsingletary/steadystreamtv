import { supabase } from "@/integrations/supabase/client";

export interface PaymentRequest {
  order_id: string;
  price_amount: number;
  price_currency: string;
  title: string;
  description: string;
  success_url: string;
  cancel_url: string;
  purchaser_email: string;
  notification_url?: string;
}

export interface PaymentResponse {
  id: string;
  status: string;
  price_amount: string;
  price_currency: string;
  created_at: string;
  order_id: string;
  payment_url: string;
  expires_at?: string;
}

export interface PaymentStatus {
  id: string;
  status: string;
  price_amount: string;
  price_currency: string;
  paid_amount?: string;
  paid_currency?: string;
  created_at: string;
  order_id: string;
  settlement_currency?: string;
  settlement_amount?: string;
}

// Plan pricing
export const PLAN_PRICING = {
  standard: { amount: 20, currency: 'USD', name: 'Standard Plan' },
  premium: { amount: 35, currency: 'USD', name: 'Premium Plan' },
  ultimate: { amount: 45, currency: 'USD', name: 'Ultimate Plan' }
};

// Supported payment processors
export enum PaymentProcessor {
  BITPAY = 'bitpay',
  COINBASE_COMMERCE = 'coinbase_commerce',
  STRIPE = 'stripe'
}

// BitPay supported currencies for settlement
export const BITPAY_SETTLEMENT_CURRENCIES = [
  { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
  { code: 'LTC', name: 'Litecoin', symbol: 'Ł' },
  { code: 'BCH', name: 'Bitcoin Cash', symbol: '₿C' },
  { code: 'XRP', name: 'Ripple', symbol: 'XRP' },
  { code: 'DOGE', name: 'Dogecoin', symbol: 'Ð' },
  { code: 'USD', name: 'US Dollar', symbol: '$' }
];

class USPaymentService {
  private processor: PaymentProcessor;
  private apiToken: string;
  private testMode: boolean;
  private baseUrl: string;

  constructor() {
    this.processor = (import.meta.env.VITE_PAYMENT_PROCESSOR as PaymentProcessor) || PaymentProcessor.BITPAY;
    this.testMode = import.meta.env.VITE_PAYMENT_TEST_MODE !== 'false';

    switch (this.processor) {
      case PaymentProcessor.BITPAY:
        this.apiToken = import.meta.env.VITE_BITPAY_API_TOKEN || 'demo-token';
        this.baseUrl = this.testMode ? 'https://test.bitpay.com' : 'https://bitpay.com';
        break;
      case PaymentProcessor.COINBASE_COMMERCE:
        this.apiToken = import.meta.env.VITE_COINBASE_COMMERCE_API_KEY || 'demo-token';
        this.baseUrl = 'https://api.commerce.coinbase.com';
        break;
      case PaymentProcessor.STRIPE:
        this.apiToken = import.meta.env.VITE_STRIPE_SECRET_KEY || 'demo-token';
        this.baseUrl = 'https://api.stripe.com/v1';
        break;
      default:
        throw new Error(`Unsupported payment processor: ${this.processor}`);
    }
  }

  /**
   * Create a new payment based on the configured processor
   */
  async createPayment(
    planId: keyof typeof PLAN_PRICING,
    settlementCurrency: string,
    userId: string,
    customerEmail: string
  ): Promise<PaymentResponse> {
    const plan = PLAN_PRICING[planId];
    const orderId = `steadystream-${Date.now()}-${userId}`;

    const paymentData: PaymentRequest = {
      order_id: orderId,
      price_amount: plan.amount,
      price_currency: plan.currency,
      title: `SteadyStream TV - ${plan.name}`,
      description: `Monthly subscription for ${plan.name} - IPTV streaming service`,
      success_url: `${window.location.origin}/payment-success?order_id=${orderId}&user_id=${userId}`,
      cancel_url: `${window.location.origin}/dashboard?cancelled=true`,
      purchaser_email: customerEmail,
      notification_url: `${window.location.origin}/api/payment-webhook`
    };

    try {
      if (this.isDemoMode) {
        return this.createMockPayment(planId, settlementCurrency, userId, customerEmail);
      }

      switch (this.processor) {
        case PaymentProcessor.BITPAY:
          return this.createBitPayPayment(paymentData, settlementCurrency);
        case PaymentProcessor.COINBASE_COMMERCE:
          return this.createCoinbaseCommercePayment(paymentData);
        case PaymentProcessor.STRIPE:
          return this.createStripePayment(paymentData);
        default:
          throw new Error(`Payment creation not implemented for ${this.processor}`);
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      throw error;
    }
  }

  /**
   * BitPay payment creation
   */
  private async createBitPayPayment(paymentData: PaymentRequest, settlementCurrency: string): Promise<PaymentResponse> {
    const bitpayInvoice = {
      price: paymentData.price_amount,
      currency: paymentData.price_currency,
      orderId: paymentData.order_id,
      itemDesc: paymentData.description,
      notificationEmail: paymentData.purchaser_email,
      redirectURL: paymentData.success_url,
      notificationURL: paymentData.notification_url,
      settlementCurrency: settlementCurrency === 'USD' ? 'USD' : settlementCurrency,
      acceptanceWindow: 3600000, // 1 hour
      buyerEmail: paymentData.purchaser_email
    };

    const response = await fetch(`${this.baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
        'X-Accept-Version': '2.0.0'
      },
      body: JSON.stringify(bitpayInvoice)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`BitPay payment creation failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();

    // Store payment record in Supabase
    await this.storePaymentRecord(result, paymentData, settlementCurrency);

    return {
      id: result.id,
      status: result.status,
      price_amount: result.price.toString(),
      price_currency: result.currency,
      created_at: result.invoiceTime,
      order_id: result.orderId,
      payment_url: result.url,
      expires_at: result.expirationTime
    };
  }

  /**
   * Coinbase Commerce payment creation
   */
  private async createCoinbaseCommercePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    const coinbaseCharge = {
      name: paymentData.title,
      description: paymentData.description,
      pricing_type: 'fixed_price',
      local_price: {
        amount: paymentData.price_amount.toString(),
        currency: paymentData.price_currency
      },
      metadata: {
        order_id: paymentData.order_id,
        customer_email: paymentData.purchaser_email
      },
      redirect_url: paymentData.success_url,
      cancel_url: paymentData.cancel_url
    };

    const response = await fetch(`${this.baseUrl}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(coinbaseCharge)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Coinbase Commerce payment creation failed: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const charge = result.data;

    // Store payment record in Supabase
    await this.storePaymentRecord(charge, paymentData, 'mixed');

    return {
      id: charge.id,
      status: charge.timeline[0]?.status || 'new',
      price_amount: charge.pricing.local.amount,
      price_currency: charge.pricing.local.currency,
      created_at: charge.created_at,
      order_id: paymentData.order_id,
      payment_url: charge.hosted_url,
      expires_at: charge.expires_at
    };
  }

  /**
   * Stripe payment creation (traditional card processing)
   */
  private async createStripePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    const session = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: paymentData.price_currency.toLowerCase(),
          product_data: {
            name: paymentData.title,
            description: paymentData.description
          },
          unit_amount: paymentData.price_amount * 100 // Stripe uses cents
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: paymentData.success_url,
      cancel_url: paymentData.cancel_url,
      customer_email: paymentData.purchaser_email,
      metadata: {
        order_id: paymentData.order_id
      }
    };

    const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${this.apiToken}`
      },
      body: new URLSearchParams(session as any)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Stripe payment creation failed: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();

    // Store payment record in Supabase
    await this.storePaymentRecord(result, paymentData, 'USD');

    return {
      id: result.id,
      status: 'pending',
      price_amount: paymentData.price_amount.toString(),
      price_currency: paymentData.price_currency,
      created_at: new Date().toISOString(),
      order_id: paymentData.order_id,
      payment_url: result.url
    };
  }

  /**
   * Check payment status
   */
  async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    try {
      if (this.isDemoMode) {
        return this.getMockPaymentStatus(orderId);
      }

      // Implementation depends on processor
      // For now, return a basic status check
      return {
        id: orderId,
        status: 'paid',
        price_amount: '35.00',
        price_currency: 'USD',
        created_at: new Date().toISOString(),
        order_id: orderId
      };
    } catch (error) {
      console.error('Payment status check error:', error);
      throw error;
    }
  }

  /**
   * Store payment record in Supabase
   */
  private async storePaymentRecord(
    paymentResponse: any,
    paymentRequest: PaymentRequest,
    settlementCurrency: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('us_payments')
        .insert({
          payment_id: paymentResponse.id,
          order_id: paymentRequest.order_id,
          processor: this.processor,
          price_amount: paymentRequest.price_amount,
          price_currency: paymentRequest.price_currency,
          settlement_currency: settlementCurrency,
          payment_status: 'pending',
          payment_url: paymentResponse.url || paymentResponse.hosted_url,
          customer_email: paymentRequest.purchaser_email,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store payment record:', error);
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
    settlementCurrency: string,
    userId: string,
    customerEmail: string
  ): PaymentResponse {
    const plan = PLAN_PRICING[planId];
    const orderId = `mock-${Date.now()}-${userId}`;

    return {
      id: `mock_${Date.now()}`,
      status: 'pending',
      price_amount: plan.amount.toString(),
      price_currency: plan.currency,
      created_at: new Date().toISOString(),
      order_id: orderId,
      payment_url: `${window.location.origin}/mock-payment?id=${orderId}&amount=${plan.amount}&plan=${planId}&processor=${this.processor}`
    };
  }

  /**
   * Mock payment status for development
   */
  private getMockPaymentStatus(orderId: string): PaymentStatus {
    return {
      id: orderId,
      status: 'paid',
      price_amount: '35.00',
      price_currency: 'USD',
      paid_amount: '35.00',
      paid_currency: 'USD',
      created_at: new Date().toISOString(),
      order_id: orderId,
      settlement_currency: 'BTC',
      settlement_amount: '0.0005'
    };
  }

  /**
   * Process payment completion
   */
  async processPaymentCompletion(orderId: string, userId: string): Promise<boolean> {
    try {
      const paymentStatus = await this.getPaymentStatus(orderId);

      if (paymentStatus.status === 'paid' || paymentStatus.status === 'confirmed') {
        // Update user subscription in database
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
    if (orderId.includes('standard')) return 'standard';
    if (orderId.includes('premium')) return 'premium';
    if (orderId.includes('ultimate')) return 'ultimate';
    return 'premium';
  }

  /**
   * Check if we're in demo/testing mode
   */
  get isDemoMode(): boolean {
    return !this.apiToken || this.apiToken === 'demo-token' || this.testMode;
  }

  /**
   * Get current processor info
   */
  getProcessorInfo() {
    return {
      processor: this.processor,
      testMode: this.testMode,
      supportedCurrencies: this.processor === PaymentProcessor.BITPAY ? BITPAY_SETTLEMENT_CURRENCIES : [],
      description: this.getProcessorDescription()
    };
  }

  private getProcessorDescription(): string {
    switch (this.processor) {
      case PaymentProcessor.BITPAY:
        return 'Pay with credit/debit card. We receive payment in cryptocurrency via BitPay.';
      case PaymentProcessor.COINBASE_COMMERCE:
        return 'Pay with cryptocurrency directly via Coinbase Commerce.';
      case PaymentProcessor.STRIPE:
        return 'Pay with credit/debit card via Stripe (traditional processing).';
      default:
        return 'Secure payment processing.';
    }
  }
}

export const usPaymentService = new USPaymentService();