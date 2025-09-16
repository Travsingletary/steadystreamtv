import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AppConfig } from '../../environments/environment';
import { SupabaseService } from './supabase.service';
import { AutomationService } from './automation.service';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: number; // in days
  features: string[];
}

export interface PaymentRequest {
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description: string;
  success_url?: string;
  cancel_url?: string;
}

export interface PaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  payment_url: string;
}

export interface PaymentStatus {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  planId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  paymentId?: string;
  iptvCredentials?: {
    username: string;
    password: string;
    m3u_url: string;
    xtream_url: string;
    epg_url?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = AppConfig.NOWPAYMENTS_API_URL;
  private apiKey = AppConfig.NOWPAYMENTS_API_KEY;

  private userSubscriptionSubject = new BehaviorSubject<UserSubscription | null>(null);
  public userSubscription$ = this.userSubscriptionSubject.asObservable();

  private subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'basic_monthly',
      name: 'Basic Monthly',
      price: 9.99,
      currency: 'USD',
      duration: 30,
      features: ['1000+ Live Channels', 'HD Quality', 'Basic Support']
    },
    {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      price: 19.99,
      currency: 'USD',
      duration: 30,
      features: ['5000+ Live Channels', '4K Quality', 'Premium Support', 'VOD Library']
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      price: 199.99,
      currency: 'USD',
      duration: 365,
      features: ['5000+ Live Channels', '4K Quality', 'Premium Support', 'VOD Library', '2 Months Free']
    }
  ];

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService,
    private automationService: AutomationService
  ) {
    this.loadUserSubscription();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  getSubscriptionPlans(): SubscriptionPlan[] {
    return this.subscriptionPlans;
  }

  getAvailableCurrencies(): Observable<any> {
    return this.http.get(`${this.apiUrl}/currencies`, {
      headers: this.getHeaders()
    });
  }

  createPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/payment`, paymentData, {
      headers: this.getHeaders()
    });
  }

  getPaymentStatus(paymentId: string): Observable<PaymentStatus> {
    return this.http.get<PaymentStatus>(`${this.apiUrl}/payment/${paymentId}`, {
      headers: this.getHeaders()
    });
  }

  generateOrderId(): string {
    return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async processSubscriptionPayment(planId: string): Promise<PaymentResponse> {
    const plan = this.subscriptionPlans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const orderId = this.generateOrderId();
    const paymentRequest: PaymentRequest = {
      price_amount: plan.price,
      price_currency: plan.currency,
      order_id: orderId,
      order_description: `${plan.name} Subscription - IPTV Service`,
      success_url: `${window.location.origin}/payment/success`,
      cancel_url: `${window.location.origin}/payment/cancel`
    };

    try {
      const response = await this.createPayment(paymentRequest).toPromise();

      // Store pending subscription data
      const pendingSubscription = {
        orderId,
        planId,
        paymentId: response?.payment_id,
        createdAt: new Date()
      };
      localStorage.setItem('pendingSubscription', JSON.stringify(pendingSubscription));

      return response!;
    } catch (error) {
      console.error('Payment creation failed:', error);
      throw error;
    }
  }

  async confirmPayment(paymentId: string): Promise<boolean> {
    try {
      const status = await this.getPaymentStatus(paymentId).toPromise();

      if (status?.payment_status === 'finished') {
        // Trigger automated user provisioning
        const automationResult = await this.automationService.processPaymentWebhook(
          paymentId,
          status.payment_status
        );

        if (automationResult.success) {
          await this.activateSubscription(paymentId, automationResult);
          return true;
        } else {
          console.error('Automation failed:', automationResult.error);
          // Still activate local subscription even if automation fails
          await this.activateSubscription(paymentId);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      return false;
    }
  }

  private async activateSubscription(paymentId: string, automationResult?: any): Promise<void> {
    const pendingData = localStorage.getItem('pendingSubscription');
    if (!pendingData) return;

    const pending = JSON.parse(pendingData);
    const plan = this.subscriptionPlans.find(p => p.id === pending.planId);
    if (!plan) return;

    const subscription: UserSubscription = {
      id: automationResult?.subscriptionId || 'sub_' + Date.now(),
      planId: plan.id,
      planName: plan.name,
      startDate: new Date(),
      endDate: new Date(Date.now() + (plan.duration * 24 * 60 * 60 * 1000)),
      isActive: true,
      paymentId,
      iptvCredentials: automationResult?.iptvCredentials
    };

    localStorage.setItem('userSubscription', JSON.stringify(subscription));
    localStorage.removeItem('pendingSubscription');

    this.userSubscriptionSubject.next(subscription);

    // Show success notification with IPTV credentials
    if (automationResult?.success && automationResult?.iptvCredentials) {
      this.showIPTVCredentials(automationResult.iptvCredentials);
    }
  }

  private showIPTVCredentials(credentials: any): void {
    const message = `
🎉 IPTV Account Created Successfully!

📺 Your IPTV Credentials:
Username: ${credentials.username}
Password: ${credentials.password}

🔗 Connection URLs:
M3U: ${credentials.m3u_url}
Xtream: ${credentials.xtream_url}

Save these credentials safely!
    `;

    // In a real app, this would be a proper modal/notification
    alert(message);
  }

  private loadUserSubscription(): void {
    const stored = localStorage.getItem('userSubscription');
    if (stored) {
      const subscription: UserSubscription = JSON.parse(stored);

      // Check if subscription is still active
      if (new Date() <= new Date(subscription.endDate)) {
        subscription.isActive = true;
        this.userSubscriptionSubject.next(subscription);
      } else {
        subscription.isActive = false;
        this.userSubscriptionSubject.next(subscription);
      }
    }
  }

  getUserSubscription(): UserSubscription | null {
    return this.userSubscriptionSubject.value;
  }

  isSubscriptionActive(): boolean {
    const subscription = this.getUserSubscription();
    return subscription?.isActive && new Date() <= new Date(subscription.endDate) || false;
  }

  cancelSubscription(): void {
    const subscription = this.getUserSubscription();
    if (subscription) {
      subscription.isActive = false;
      localStorage.setItem('userSubscription', JSON.stringify(subscription));
      this.userSubscriptionSubject.next(subscription);
    }
  }

  clearSubscription(): void {
    localStorage.removeItem('userSubscription');
    localStorage.removeItem('pendingSubscription');
    this.userSubscriptionSubject.next(null);
  }
}