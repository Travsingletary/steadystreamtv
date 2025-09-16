import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../../environments/environment';
import { PaymentService } from './payment.service';

export interface WebhookPayload {
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

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  private ipnSecret = AppConfig.NOWPAYMENTS_IPN_SECRET;

  constructor(
    private http: HttpClient,
    private paymentService: PaymentService
  ) {}

  /**
   * Verify webhook signature (for backend implementation)
   * This would typically be implemented on your backend server
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
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

  /**
   * Process incoming webhook payload
   * This method should be called when your backend receives a webhook from NOWPayments
   */
  processWebhook(webhookData: WebhookPayload): Observable<any> {
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

  private handleSuccessfulPayment(webhookData: WebhookPayload): void {
    console.log('Payment successful:', webhookData.payment_id);

    // Activate subscription
    this.activateSubscriptionFromWebhook(webhookData);

    // Optionally send confirmation email
    this.sendPaymentConfirmation(webhookData);

    // Log the successful payment
    this.logPaymentEvent('success', webhookData);
  }

  private handleFailedPayment(webhookData: WebhookPayload): void {
    console.log('Payment failed:', webhookData.payment_id);

    // Clean up pending subscription data
    this.cleanupFailedPayment(webhookData);

    // Optionally notify user of failed payment
    this.notifyPaymentFailure(webhookData);

    // Log the failed payment
    this.logPaymentEvent('failed', webhookData);
  }

  private handlePartialPayment(webhookData: WebhookPayload): void {
    console.log('Partial payment received:', webhookData.payment_id);

    // You might want to:
    // 1. Wait for additional payments
    // 2. Refund the partial amount
    // 3. Contact the user

    this.logPaymentEvent('partial', webhookData);
  }

  private activateSubscriptionFromWebhook(webhookData: WebhookPayload): void {
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

  private cleanupFailedPayment(webhookData: WebhookPayload): void {
    const pendingData = localStorage.getItem('pendingSubscription');
    if (pendingData) {
      const pending = JSON.parse(pendingData);
      if (pending.orderId === webhookData.order_id) {
        localStorage.removeItem('pendingSubscription');
      }
    }
  }

  private sendPaymentConfirmation(webhookData: WebhookPayload): void {
    // This would typically trigger an email service
    console.log('Sending payment confirmation for:', webhookData.order_id);

    // You could implement:
    // 1. Email service integration
    // 2. SMS notifications
    // 3. In-app notifications
  }

  private notifyPaymentFailure(webhookData: WebhookPayload): void {
    // Notify user of payment failure
    console.log('Notifying payment failure for:', webhookData.order_id);

    // You could implement:
    // 1. Email notification
    // 2. In-app notification
    // 3. Dashboard alert
  }

  private logPaymentEvent(eventType: string, webhookData: WebhookPayload): void {
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