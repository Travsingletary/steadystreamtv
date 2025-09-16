import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AppConfig } from '../../environments/environment';

export interface PayclyPaymentRequest {
  amount: number;
  currency: string;
  customer_email: string;
  customer_name: string;
  description: string;
  subscription_plan: string;
  subscription_duration: string;
  callback_url: string;
  redirect_url: string;
}

export interface PayclyPaymentResponse {
  success: boolean;
  payment_id: string;
  checkout_url: string;
  status: string;
  message?: string;
}

export interface PayclyWebhookData {
  payment_id: string;
  status: string;
  amount: number;
  currency: string;
  customer_email: string;
  transaction_id: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayclyService {
  private apiUrl = AppConfig.PAYCLY_API_URL;
  private merchantId = AppConfig.PAYCLY_MERCHANT_ID;
  private apiKey = AppConfig.PAYCLY_API_KEY;
  private secretKey = AppConfig.PAYCLY_SECRET_KEY;

  constructor(private http: HttpClient) {}

  /**
   * Create a card payment with PAYCLY
   */
  createCardPayment(paymentData: PayclyPaymentRequest): Observable<PayclyPaymentResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Merchant-ID': this.merchantId
    });

    const payload = {
      ...paymentData,
      merchant_id: this.merchantId,
      payment_method: 'card',
      timestamp: new Date().toISOString()
    };

    return this.http.post<PayclyPaymentResponse>(
      `${this.apiUrl}/payments/create`,
      payload,
      { headers }
    );
  }

  /**
   * Check payment status
   */
  checkPaymentStatus(paymentId: string): Observable<PayclyPaymentResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Merchant-ID': this.merchantId
    });

    return this.http.get<PayclyPaymentResponse>(
      `${this.apiUrl}/payments/${paymentId}/status`,
      { headers }
    );
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // PAYCLY uses HMAC-SHA256 for webhook verification
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook notification
   */
  processWebhook(webhookData: PayclyWebhookData): Observable<any> {
    // This would typically be handled by your backend
    // Here we're just returning the webhook data for processing
    return from(Promise.resolve(webhookData));
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods(): string[] {
    return [
      'Visa',
      'Mastercard',
      'American Express',
      'Discover',
      'PayPal',
      'Apple Pay',
      'Google Pay'
    ];
  }

  /**
   * Calculate total fee including PAYCLY processing
   */
  calculateFeeAmount(amount: number): {
    subtotal: number;
    processingFee: number;
    total: number;
    feePercentage: number
  } {
    const feePercentage = 0.035; // 3.5% for PAYCLY (estimated)
    const processingFee = amount * feePercentage;

    return {
      subtotal: amount,
      processingFee: Math.round(processingFee * 100) / 100,
      total: Math.round((amount + processingFee) * 100) / 100,
      feePercentage: feePercentage * 100
    };
  }

  /**
   * Get payment method icon
   */
  getPaymentMethodIcon(method: string): string {
    const icons: { [key: string]: string } = {
      'Visa': '💳',
      'Mastercard': '💳',
      'American Express': '💳',
      'Discover': '💳',
      'PayPal': '🅿️',
      'Apple Pay': '🍎',
      'Google Pay': '🎯'
    };
    return icons[method] || '💳';
  }
}