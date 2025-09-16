import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { PaymentService, SubscriptionPlan, PaymentResponse } from '../../services/payment.service';
import { PayclyService, PayclyPaymentRequest } from '../../services/paycly.service';
import { Subject, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {
  subscriptionPlans: SubscriptionPlan[] = [];
  selectedPlan: SubscriptionPlan | null = null;
  selectedPaymentMethod: 'crypto' | 'card' | null = null;
  isProcessing = false;
  paymentUrl = '';
  error = '';

  private destroy$ = new Subject<void>();

  constructor(
    private paymentService: PaymentService,
    private payclyService: PayclyService
  ) {}

  ngOnInit(): void {
    this.subscriptionPlans = this.paymentService.getSubscriptionPlans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectPlan(plan: SubscriptionPlan): void {
    this.selectedPlan = plan;
    this.error = '';
  }

  selectPaymentMethod(method: 'crypto' | 'card'): void {
    this.selectedPaymentMethod = method;
    this.error = '';
  }

  async processPayment(): Promise<void> {
    if (!this.selectedPlan) {
      this.error = 'Please select a subscription plan';
      return;
    }

    this.isProcessing = true;
    this.error = '';

    try {
      const paymentResponse: PaymentResponse = await this.paymentService.processSubscriptionPayment(this.selectedPlan.id);

      if (paymentResponse.payment_url) {
        // Open payment URL in new window/tab
        window.open(paymentResponse.payment_url, '_blank');

        // Start monitoring payment status
        this.monitorPaymentStatus(paymentResponse.payment_id);
      } else {
        this.error = 'Failed to create payment. Please try again.';
      }
    } catch (error: any) {
      console.error('Payment processing failed:', error);
      this.error = error.message || 'Payment processing failed. Please try again.';
    } finally {
      this.isProcessing = false;
    }
  }

  private monitorPaymentStatus(paymentId: string): void {
    const checkInterval = setInterval(() => {
      void (async () => {
        try {
          const isConfirmed = await this.paymentService.confirmPayment(paymentId);

          if (isConfirmed) {
            clearInterval(checkInterval);
            this.onPaymentSuccess();
          }
        } catch (error) {
          console.error('Payment status check failed:', error);
          // Continue checking - might be temporary network issue
        }
      })();
    }, 10000); // Check every 10 seconds

    // Stop checking after 30 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30 * 60 * 1000);
  }

  private onPaymentSuccess(): void {
    this.selectedPlan = null;
    this.paymentUrl = '';

    // Show success message or redirect to dashboard
    alert('Payment successful! Your subscription is now active.');

    // Optionally redirect to dashboard
    // this.router.navigate(['/dashboard']);
  }

  getPlanBadgeClass(plan: SubscriptionPlan): string {
    switch (plan.id) {
      case 'premium_yearly':
        return 'badge-popular';
      case 'premium_monthly':
        return 'badge-premium';
      default:
        return 'badge-basic';
    }
  }

  calculateMonthlySavings(plan: SubscriptionPlan): number {
    if (plan.duration === 365) {
      const monthlyEquivalent = (plan.price / 12);
      const premiumMonthly = this.subscriptionPlans.find(p => p.id === 'premium_monthly');
      if (premiumMonthly) {
        return premiumMonthly.price - monthlyEquivalent;
      }
    }
    return 0;
  }

  getProcessingFee(): number {
    if (!this.selectedPlan) return 0;
    return this.selectedPlan.price * 0.035; // 3.5% for card payments
  }

  getCryptoFee(): number {
    if (!this.selectedPlan) return 0;
    return this.selectedPlan.price * 0.005; // 0.5% for crypto payments
  }

  getTotalAmount(): number {
    if (!this.selectedPlan) return 0;
    const baseFee = this.selectedPaymentMethod === 'crypto' ? this.getCryptoFee() : this.getProcessingFee();
    return this.selectedPlan.price + baseFee;
  }

  async processCryptoPayment(): Promise<void> {
    await this.processPayment();
  }

  async processCardPayment(): Promise<void> {
    if (!this.selectedPlan) {
      this.error = 'Please select a subscription plan';
      return;
    }

    this.isProcessing = true;
    this.error = '';

    try {
      const paymentRequest: PayclyPaymentRequest = {
        amount: this.getTotalAmount(),
        currency: this.selectedPlan.currency,
        description: `${this.selectedPlan.name} Subscription`,
        customer_email: '',
        customer_name: '',
        subscription_plan: this.selectedPlan.id,
        subscription_duration: `${this.selectedPlan.duration} days`,
        callback_url: `${window.location.origin}/api/webhooks/paycly`,
        redirect_url: `${window.location.origin}/subscription`
      };

      const response = await firstValueFrom(this.payclyService.createCardPayment(paymentRequest));

      if (response && response.checkout_url) {
        window.open(response.checkout_url, '_blank');
      } else {
        this.error = 'Failed to create card payment. Please try again.';
      }
    } catch (error: any) {
      console.error('Card payment processing failed:', error);
      this.error = error.message || 'Card payment processing failed. Please try again.';
    } finally {
      this.isProcessing = false;
    }
  }
}