import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { PaymentService, SubscriptionPlan, PaymentMethodOption } from '../../services/payment.service';
import { PayclyService, PayclyPaymentRequest } from '../../services/paycly.service';
import { Subject, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatRadioModule
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {
  subscriptionPlans: SubscriptionPlan[] = [];
  selectedPlan: SubscriptionPlan | null = null;
  selectedPaymentMethod: 'crypto' | 'card' | null = null;
  paymentMethods: PaymentMethodOption[] = [];
  selectedCurrency = 'USD';
  supportedCurrencies: string[] = [];
  customerEmail = '';
  isProcessing = false;
  paymentUrl = '';
  error = '';
  currentStep: 'plan' | 'method' | 'details' | 'processing' = 'plan';

  private destroy$ = new Subject<void>();

  constructor(
    private paymentService: PaymentService,
    private payclyService: PayclyService
  ) {}

  ngOnInit(): void {
    this.subscriptionPlans = this.paymentService.getSubscriptionPlans();
    this.paymentMethods = this.paymentService.getPaymentMethods();
    this.supportedCurrencies = this.paymentService.getSupportedFiatCurrencies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectPlan(plan: SubscriptionPlan): void {
    this.selectedPlan = plan;
    this.error = '';
    this.currentStep = 'method';
  }

  selectPaymentMethod(method: 'crypto' | 'card'): void {
    this.selectedPaymentMethod = method;
    this.error = '';
    this.currentStep = method === 'card' ? 'details' : 'processing';
  }

  goBack(): void {
    if (this.currentStep === 'method') {
      this.currentStep = 'plan';
      this.selectedPlan = null;
    } else if (this.currentStep === 'details') {
      this.currentStep = 'method';
      this.selectedPaymentMethod = null;
    } else if (this.currentStep === 'processing') {
      this.currentStep = this.selectedPaymentMethod === 'card' ? 'details' : 'method';
    }
  }

  async processPayment(): Promise<void> {
    if (!this.selectedPlan || !this.selectedPaymentMethod) {
      this.error = 'Please select a subscription plan and payment method';
      return;
    }

    if (this.selectedPaymentMethod === 'card' && !this.customerEmail) {
      this.error = 'Please provide your email address for card payments';
      return;
    }

    this.isProcessing = true;
    this.error = '';
    this.currentStep = 'processing';

    try {
      const paymentResponse = await this.paymentService.processFiatSubscriptionPayment(
        this.selectedPlan.id,
        this.selectedPaymentMethod,
        this.selectedCurrency,
        this.customerEmail
      );

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
    if (!this.selectedPlan || !this.selectedPaymentMethod) return 0;
    const pricing = this.paymentService.calculatePricingWithFees(this.selectedPlan.price, this.selectedPaymentMethod);
    return pricing.processingFee;
  }

  getTotalPrice(): number {
    if (!this.selectedPlan || !this.selectedPaymentMethod) return 0;
    const pricing = this.paymentService.calculatePricingWithFees(this.selectedPlan.price, this.selectedPaymentMethod);
    return pricing.totalPrice;
  }

  getDisplayPrice(): number {
    if (!this.selectedPlan) return 0;
    return this.paymentService.convertPriceForDisplay(this.selectedPlan.price, this.selectedCurrency);
  }

  getDisplayProcessingFee(): number {
    if (!this.selectedPlan || !this.selectedPaymentMethod) return 0;
    const pricing = this.paymentService.calculatePricingWithFees(this.selectedPlan.price, this.selectedPaymentMethod);
    return this.paymentService.convertPriceForDisplay(pricing.processingFee, this.selectedCurrency);
  }

  getDisplayTotalPrice(): number {
    if (!this.selectedPlan || !this.selectedPaymentMethod) return 0;
    const pricing = this.paymentService.calculatePricingWithFees(this.selectedPlan.price, this.selectedPaymentMethod);
    return this.paymentService.convertPriceForDisplay(pricing.totalPrice, this.selectedCurrency);
  }

  getPaymentMethodDescription(method: PaymentMethodOption): string {
    return method.description;
  }

  getPaymentMethodIcon(methodId: 'crypto' | 'card'): string {
    const method = this.paymentService.getPaymentMethodById(methodId);
    return method?.icon || '💳';
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  canProceedToPayment(): boolean {
    if (this.selectedPaymentMethod === 'card') {
      return this.isValidEmail(this.customerEmail);
    }
    return this.selectedPaymentMethod === 'crypto';
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 'plan': return 'Choose Your Plan';
      case 'method': return 'Select Payment Method';
      case 'details': return 'Payment Details';
      case 'processing': return 'Processing Payment';
      default: return 'Payment';
    }
  }

  getConversionNote(): string {
    if (this.selectedPaymentMethod === 'card') {
      return 'Your card payment will be securely converted to cryptocurrency for enhanced privacy. You will receive crypto while your personal banking information remains private.';
    }
    return '';
  }

  getProcessingFeePercentage(): string {
    return this.selectedPaymentMethod === 'crypto' ? '0.5' : '3.5';
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