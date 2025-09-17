import { supabase } from "@/integrations/supabase/client";

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

export const PRICING_PLANS: PlanConfig[] = [
  {
    id: 'trial',
    name: 'Free Trial',
    price: 0,
    currency: 'usd',
    features: [
      '7-day free trial',
      '1000+ live channels',
      'Basic sports package',
      '1 connection',
      'Standard support'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    currency: 'usd',
    features: [
      '5000+ live channels',
      'All sports packages',
      'VOD library',
      '1 connection',
      'Email support'
    ]
  },
  {
    id: 'duo',
    name: 'Duo',
    price: 15.99,
    currency: 'usd',
    features: [
      '8000+ live channels',
      'All sports packages',
      'Premium VOD library',
      '2 connections',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'family',
    name: 'Family',
    price: 24.99,
    currency: 'usd',
    features: [
      '12000+ live channels',
      'All sports packages',
      'Premium VOD + Movies',
      '4 connections',
      '24/7 support'
    ]
  }
];

export class PaymentService {
  /**
   * Create a checkout session for a plan
   */
  static async createCheckout(planId: string, userId: string, paymentMethod?: string): Promise<{ checkout_url: string; payment_id: string }> {
    const plan = PRICING_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const { data, error } = await supabase.functions.invoke('checkout', {
      body: {
        plan_id: planId,
        user_id: userId,
        amount: plan.price,
        currency: plan.currency,
        payment_method: paymentMethod || 'card'
      }
    });

    if (error) {
      console.error('Checkout error:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    return data;
  }

  /**
   * Get subscription status for a user
   */
  static async getSubscriptionStatus(userId: string): Promise<{
    active: boolean;
    expires_at?: string;
    subscription?: any;
  }> {
    const { data, error } = await supabase.functions.invoke('subscription-status', {
      body: { user_id: userId }
    });

    if (error) {
      console.error('Subscription status error:', error);
      return { active: false };
    }

    return data;
  }

  /**
   * Extend a subscription
   */
  static async extendSubscription(userId: string, packageId: number = 1): Promise<any> {
    const { data, error } = await supabase.functions.invoke('subscription-extend', {
      body: {
        user_id: userId,
        package_id: packageId
      }
    });

    if (error) {
      console.error('Extend subscription error:', error);
      throw new Error(error.message || 'Failed to extend subscription');
    }

    return data;
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(userId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('subscription-cancel', {
      body: {
        user_id: userId
      }
    });

    if (error) {
      console.error('Cancel subscription error:', error);
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    return data;
  }

  /**
   * Poll subscription status until active (for post-payment verification)
   */
  static async waitForSubscriptionActivation(userId: string, maxAttempts: number = 30): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getSubscriptionStatus(userId);
        if (status.active) {
          return true;
        }
        
        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    }
    
    return false;
  }

  /**
   * Get plan configuration by ID
   */
  static getPlan(planId: string): PlanConfig | undefined {
    return PRICING_PLANS.find(p => p.id === planId);
  }

  /**
   * Get all available plans
   */
  static getAllPlans(): PlanConfig[] {
    return PRICING_PLANS;
  }
}