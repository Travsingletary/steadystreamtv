import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../../environments/environment';
import { PaymentService, GuardarianWebhookData } from './payment.service';
import { SupabaseService } from './supabase.service';
import { AutomationService } from './automation.service';

export interface NOWPaymentsWebhookPayload {
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
  outcome_amount: number;
  outcome_currency: string;
  created_at: string;
  updated_at: string;
}

export interface GuardarianWebhookPayload {
  id: string;
  type: string;
  data: {
    id: string;
    status: string;
    conversion_status: string;
    from_amount: number;
    from_currency: string;
    to_amount: number;
    to_currency: string;
    customer_email: string;
    external_partner_link_id?: string;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  private ipnSecret = AppConfig.NOWPAYMENTS_IPN_SECRET;
  private webhookUrl = 'https://ojueihcytxwcioqtvwez.supabase.co/functions/v1';

  constructor(
    private http: HttpClient,
    private paymentService: PaymentService,
    private supabaseService: SupabaseService,
    private automationService: AutomationService
  ) {}

  /**
   * Verify webhook signature (for backend implementation)
   * This would typically be implemented on your backend server
   */
  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    // This is a placeholder - actual implementation would be on the backend
    // The signature verification uses HMAC-SHA512 with your IPN secret
    //
    // Example backend implementation (Node.js):
    // const crypto = require('crypto');
    // const hmac = crypto.createHmac('sha512', ipnSecret);
    // hmac.update(payload);
    // const computedSignature = hmac.digest('hex');
    // return computedSignature === signature;

    console.warn('Webhook signature verification should be implemented on the backend');
    return true; // For demo purposes
  }

  // Handle Guardarian webhook for fiat-to-crypto conversions
  async handleGuardarianWebhook(webhook: GuardarianWebhookPayload): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Processing Guardarian webhook:', webhook);

      // Log webhook to Supabase for tracking
      await this.logWebhook('guardarian', webhook);

      const { data } = webhook;

      // Check if conversion is completed
      if (data.status === 'completed' && data.conversion_status === 'completed') {
        // Create GuardarianWebhookData for payment service
        const guardarianData: GuardarianWebhookData = {
          payment_id: data.external_partner_link_id || data.id,
          payment_status: 'finished',
          conversion_status: data.conversion_status,
          fiat_amount: data.from_amount,
          fiat_currency: data.from_currency,
          crypto_amount: data.to_amount,
          crypto_currency: data.to_currency,
          customer_email: data.customer_email,
          created_at: data.created_at,
          completed_at: data.updated_at
        };

        // Process through payment service
        const result = await this.paymentService.processGuardarianWebhook(guardarianData).toPromise();

        if (result?.success) {
          // Trigger automation for user provisioning
          const automationResult = await this.automationService.processPaymentWebhook(
            guardarianData.payment_id,
            'finished'
          );

          if (automationResult.success) {
            await this.activateSubscriptionFromFiatPayment(guardarianData, automationResult);
          }

          return {
            success: true,
            message: 'Fiat-to-crypto conversion completed and subscription activated'
          };
        } else {
          return {
            success: false,
            message: 'Conversion completed but subscription activation failed'
          };
        }
      } else if (data.status === 'failed' || data.status === 'cancelled') {
        // Handle failed conversions
        await this.handleFailedFiatPayment(data.id, data.status);

        return {
          success: true,
          message: `Fiat conversion ${data.status} - handled appropriately`
        };
      }

      return {
        success: true,
        message: `Conversion status ${data.status} - no action required`
      };
    } catch (error) {
      console.error('Guardarian webhook processing failed:', error);
      return {
        success: false,
        message: `Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process incoming NOWPayments webhook payload
   * This method should be called when your backend receives a webhook from NOWPayments
   */
  processNOWPaymentsWebhook(webhookData: NOWPaymentsWebhookPayload): Observable<any> {
    console.log('Processing webhook:', webhookData);

    // Validate payment status
    if (webhookData.payment_status === 'finished') {
      // Payment is completed successfully
      this.handleSuccessfulPayment(webhookData);
    } else if (webhookData.payment_status === 'failed') {
      // Payment failed
      this.handleFailedPayment(webhookData);
    } else if (webhookData.payment_status === 'partially_paid') {
      // Payment is partially paid (user sent less than required)
      this.handlePartialPayment(webhookData);
    }

    // Return response to NOWPayments
    return new Observable(observer => {
      observer.next({ status: 'OK' });
      observer.complete();
    });
  }

  private handleSuccessfulPayment(webhookData: NOWPaymentsWebhookPayload): void {
    console.log('Payment successful:', webhookData.payment_id);

    // Activate subscription
    this.activateSubscriptionFromWebhook(webhookData);

    // Optionally send confirmation email
    this.sendPaymentConfirmation(webhookData);

    // Log the successful payment
    this.logPaymentEvent('success', webhookData);
  }

  private handleFailedPayment(webhookData: NOWPaymentsWebhookPayload): void {
    console.log('Payment failed:', webhookData.payment_id);

    // Clean up pending subscription data
    this.cleanupFailedPayment(webhookData);

    // Optionally notify user of failed payment
    this.notifyPaymentFailure(webhookData);

    // Log the failed payment
    this.logPaymentEvent('failed', webhookData);
  }

  private handlePartialPayment(webhookData: NOWPaymentsWebhookPayload): void {
    console.log('Partial payment received:', webhookData.payment_id);

    // You might want to:
    // 1. Wait for additional payments
    // 2. Refund the partial amount
    // 3. Contact the user

    this.logPaymentEvent('partial', webhookData);
  }

  private activateSubscriptionFromWebhook(webhookData: NOWPaymentsWebhookPayload): void {
    // Find the pending subscription by order_id
    const pendingData = localStorage.getItem('pendingSubscription');
    if (pendingData) {
      const pending = JSON.parse(pendingData);
      if (pending.orderId === webhookData.order_id) {
        // Activate the subscription using the payment service
        this.paymentService.confirmPayment(webhookData.payment_id);
      }
    }
  }

  private cleanupFailedPayment(webhookData: NOWPaymentsWebhookPayload): void {
    const pendingData = localStorage.getItem('pendingSubscription');
    if (pendingData) {
      const pending = JSON.parse(pendingData);
      if (pending.orderId === webhookData.order_id) {
        localStorage.removeItem('pendingSubscription');
      }
    }
  }

  private sendPaymentConfirmation(webhookData: NOWPaymentsWebhookPayload): void {
    // This would typically trigger an email service
    console.log('Sending payment confirmation for:', webhookData.order_id);

    // You could implement:
    // 1. Email service integration
    // 2. SMS notifications
    // 3. In-app notifications
  }

  private notifyPaymentFailure(webhookData: NOWPaymentsWebhookPayload): void {
    // Notify user of payment failure
    console.log('Notifying payment failure for:', webhookData.order_id);

    // You could implement:
    // 1. Email notification
    // 2. In-app notification
    // 3. Dashboard alert
  }

  private logPaymentEvent(eventType: string, webhookData: NOWPaymentsWebhookPayload): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      paymentId: webhookData.payment_id,
      orderId: webhookData.order_id,
      amount: webhookData.price_amount,
      currency: webhookData.price_currency,
      status: webhookData.payment_status
    };

    // Store log entry (in a real app, this would go to a logging service)
    console.log('Payment event logged:', logEntry);

    // You could implement:
    // 1. Database logging
    // 2. Analytics tracking
    // 3. Audit trail storage
  }

  // Activate subscription from fiat payment webhook data
  private async activateSubscriptionFromFiatPayment(guardarianData: GuardarianWebhookData, automationResult?: any): Promise<void> {
    try {
      // Get pending subscription data
      const pendingData = localStorage.getItem('pendingSubscription');
      if (!pendingData) {
        console.warn('No pending subscription found for fiat payment:', guardarianData.payment_id);
        return;
      }

      const pending = JSON.parse(pendingData);

      // Create subscription record in Supabase
      const subscription = {
        id: automationResult?.subscriptionId || `sub_${Date.now()}`,
        user_id: pending.userId || 'anonymous',
        plan_id: pending.planId,
        payment_id: guardarianData.payment_id,
        payment_method: 'card',
        fiat_currency: guardarianData.fiat_currency,
        fiat_amount: guardarianData.fiat_amount,
        crypto_currency: guardarianData.crypto_currency,
        crypto_amount: guardarianData.crypto_amount,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: this.calculateEndDate(pending.planId),
        iptv_credentials: automationResult?.iptvCredentials,
        created_at: new Date().toISOString()
      };

      // Create subscription record in Supabase (using direct client access)
      const { error } = await this.supabaseService['supabase']
        .from('subscriptions')
        .insert(subscription);

      if (error) {
        console.error('Failed to insert subscription:', error);
        throw error;
      }

      // Clean up pending data
      localStorage.removeItem('pendingSubscription');

      console.log('Fiat subscription activated:', subscription.id);
    } catch (error) {
      console.error('Failed to activate fiat subscription:', error);
    }
  }

  // Handle failed fiat payments
  private async handleFailedFiatPayment(conversionId: string, status: string): Promise<void> {
    try {
      // Update conversion status in Supabase (using direct client access)
      const { error } = await this.supabaseService['supabase']
        .from('fiat_conversions')
        .update({
          status: status,
          failed_at: new Date().toISOString()
        })
        .eq('conversion_id', conversionId);

      if (error) {
        console.error('Failed to update fiat conversion:', error);
      }

      console.log(`Fiat conversion ${conversionId} marked as ${status}`);
    } catch (error) {
      console.error('Failed to handle fiat payment failure:', error);
    }
  }

  // Log webhook to Supabase for tracking
  private async logWebhook(provider: string, data: any): Promise<void> {
    try {
      const webhookLog = {
        provider,
        webhook_data: data,
        processed_at: new Date().toISOString(),
        status: 'received'
      };

      // Log webhook to Supabase (using direct client access)
      const { error } = await this.supabaseService['supabase']
        .from('webhook_logs')
        .insert(webhookLog);

      if (error) {
        console.error('Failed to insert webhook log:', error);
      }
    } catch (error) {
      console.error('Failed to log webhook:', error);
      // Don't throw - webhook logging is not critical
    }
  }

  // Calculate subscription end date based on plan
  private calculateEndDate(planId: string): string {
    const plans = this.paymentService.getSubscriptionPlans();
    const plan = plans.find(p => p.id === planId);

    if (!plan) {
      // Default to 30 days if plan not found
      return new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString();
    }

    return new Date(Date.now() + (plan.duration * 24 * 60 * 60 * 1000)).toISOString();
  }

  // Send test webhook (for development/testing)
  sendTestWebhook(type: 'nowpayments' | 'guardarian'): Observable<any> {
    const testData = type === 'nowpayments' ? {
      payment_id: 'test_payment_123',
      payment_status: 'finished',
      pay_address: 'test_address',
      price_amount: 19.99,
      price_currency: 'USD',
      pay_amount: 0.001,
      pay_currency: 'BTC',
      order_id: 'test_order_123',
      order_description: 'Test Payment',
      purchase_id: 'test_purchase_123',
      outcome_amount: 0.001,
      outcome_currency: 'BTC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } : {
      id: 'test_conversion_123',
      type: 'transaction.completed',
      data: {
        id: 'test_conversion_123',
        status: 'completed',
        conversion_status: 'completed',
        from_amount: 19.99,
        from_currency: 'USD',
        to_amount: 0.001,
        to_currency: 'BTC',
        customer_email: 'test@example.com',
        external_partner_link_id: 'test_payment_123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };

    return this.http.post(`${this.webhookUrl}/${type}-webhook`, testData, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Get webhook logs for debugging
  async getWebhookLogs(provider?: string, limit: number = 50): Promise<any[]> {
    try {
      const query = this.supabaseService['supabase']
        .from('webhook_logs')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(limit);

      if (provider) {
        query.eq('provider', provider);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get webhook logs:', error);
      return [];
    }
  }

  /**
   * Get webhook endpoint URL for NOWPayments configuration
   * This URL should point to your backend webhook handler
   */
  getWebhookEndpointUrl(): string {
    // This would be your actual webhook endpoint URL
    // Example: https://yourdomain.com/api/webhooks/nowpayments
    return `${AppConfig.BACKEND_URL}/webhooks/nowpayments`;
  }

  /**
   * Get Guardarian webhook endpoint URL
   */
  getGuardarianWebhookEndpointUrl(): string {
    return `${AppConfig.BACKEND_URL}/webhooks/guardarian`;
  }

  /**
   * Setup instructions for webhook configuration
   */
  getWebhookSetupInstructions(): string[] {
    return [
      '1. Log into your NOWPayments merchant dashboard',
      '2. Navigate to Settings > IPN Settings',
      '3. Set IPN Callback URL to: ' + this.getWebhookEndpointUrl(),
      '4. Set IPN Secret Key (use the same value as NOWPAYMENTS_IPN_SECRET)',
      '5. Select "Send IPN for all payments" if desired',
      '6. Test the webhook using NOWPayments testing tools',
      '7. Implement signature verification on your backend',
      '8. Handle different payment statuses appropriately'
    ];
  }

  /**
   * Example backend webhook handler (for reference)
   * This should be implemented in your backend server
   */
  getBackendWebhookHandlerExample(): string {
    return `
// Example Express.js webhook handler
app.post('/api/webhooks/nowpayments', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-nowpayments-sig'];
  const payload = req.body.toString('utf8');

  // Verify signature
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');

  if (computedSignature !== signature) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  const webhookData = JSON.parse(payload);

  switch (webhookData.payment_status) {
    case 'finished':
      // Activate subscription
      activateUserSubscription(webhookData);
      break;
    case 'failed':
      // Handle failed payment
      handleFailedPayment(webhookData);
      break;
    case 'partially_paid':
      // Handle partial payment
      handlePartialPayment(webhookData);
      break;
  }

  res.status(200).send('OK');
});
    `;
  }
}