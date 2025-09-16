import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { SupabaseService, PurchaseAutomation } from './supabase.service';
import { MegaOTTService, CreateSubscriptionResponse, MegaOTTSubscription, CreateUserResponse } from './megaott.service';
import { PaymentService } from './payment.service';

export interface AutomationResult {
  success: boolean;
  iptvCredentials?: {
    username: string;
    password: string;
    m3u_url: string;
    xtream_url: string;
  };
  subscriptionId?: string;
  error?: string;
  automationId?: string;
}

export interface UserRegistrationData {
  email: string;
  fullName?: string;
  subscriptionPlan: string;
  paymentId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutomationService {
  constructor(
    private supabaseService: SupabaseService,
    private megaOTTService: MegaOTTService,
    private paymentService: PaymentService
  ) {}

  /**
   * Complete automated user onboarding flow
   * 1. Create user account in Supabase
   * 2. Create IPTV account via MegaOTT
   * 3. Link everything together
   * 4. Send welcome email with credentials
   */
  async processCompleteOnboarding(userData: UserRegistrationData): Promise<AutomationResult> {
    let automationId: string | undefined;

    try {
      // Step 1: Create automation record for tracking
      const automation = await this.createAutomationRecord(userData);
      automationId = automation.id;

      // Step 2: Create or get user in Supabase
      const user = await this.createOrGetUser(userData);

      // Step 3: Create IPTV account via MegaOTT
      const iptvResult = await this.createIPTVAccount(user.id, userData);

      // Step 4: Create MegaOTT subscription record
      const subscription = await this.createSubscriptionRecord(user.id, userData, iptvResult);

      // Step 5: Create IPTV account record in Supabase
      const iptvAccount = await this.createIPTVAccountRecord(user.id, iptvResult, subscription.id);

      // Step 6: Update automation status to completed
      await this.updateAutomationStatus(automationId, 'completed', {
        megaott_response: iptvResult,
        iptv_account_id: iptvAccount.id,
        subscription_id: subscription.id
      });

      // Step 7: Send welcome email with credentials
      await this.sendWelcomeEmail(user.email, iptvResult, userData.subscriptionPlan);

      // Step 8: Return success with credentials
      let credentials;
      if (iptvResult.dns_link) {
        // If we have a full MegaOTT subscription response
        credentials = this.megaOTTService.getConnectionDetailsFromSubscription(iptvResult as MegaOTTSubscription);
      } else {
        // Fallback for mock mode
        credentials = this.megaOTTService.getConnectionDetails(
          iptvResult.username!,
          iptvResult.password!
        );
      }

      return {
        success: true,
        iptvCredentials: {
          username: iptvResult.username!,
          password: iptvResult.password!,
          m3u_url: credentials.m3u_url,
          xtream_url: credentials.xtream_url
        },
        subscriptionId: subscription.id,
        automationId
      };

    } catch (error) {
      console.error('Automation failed:', error);

      // Update automation status to failed
      if (automationId) {
        await this.updateAutomationStatus(automationId, 'failed', undefined, (error as any).message);
      }

      return {
        success: false,
        error: (error as any).message,
        automationId
      };
    }
  }

  /**
   * Process payment webhook and trigger automation
   */
  async processPaymentWebhook(paymentId: string, paymentStatus: string): Promise<AutomationResult> {
    try {
      if (paymentStatus !== 'finished') {
        throw new Error(`Payment not completed. Status: ${paymentStatus}`);
      }

      // Get pending subscription data
      const pendingData = localStorage.getItem('pendingSubscription');
      if (!pendingData) {
        throw new Error('No pending subscription found for payment');
      }

      const pending = JSON.parse(pendingData);

      // Get user email from local storage or require it as parameter
      const userEmail = localStorage.getItem('userEmail') || 'user@example.com'; // This should be properly handled

      const userData: UserRegistrationData = {
        email: userEmail,
        subscriptionPlan: pending.planId,
        paymentId
      };

      // Process complete onboarding
      const result = await this.processCompleteOnboarding(userData);

      // Clean up pending data if successful
      if (result.success) {
        localStorage.removeItem('pendingSubscription');
        localStorage.removeItem('userEmail');

        // Activate local subscription
        await this.paymentService.confirmPayment(paymentId);
      }

      return result;

    } catch (error) {
      console.error('Webhook processing failed:', error);
      return {
        success: false,
        error: (error as any).message
      };
    }
  }

  private async createAutomationRecord(userData: UserRegistrationData): Promise<PurchaseAutomation> {
    const { data, error } = await this.supabaseService.createPurchaseAutomation({
      payment_id: userData.paymentId,
      subscription_plan: userData.subscriptionPlan,
      status: 'processing'
    });

    if (error || !data) {
      throw new Error('Failed to create automation record: ' + error?.message);
    }

    return data;
  }

  private async createOrGetUser(userData: UserRegistrationData): Promise<any> {
    // Try to get existing user
    const { user: currentUser } = await this.supabaseService.getCurrentUser();

    if (currentUser) {
      return currentUser;
    }

    // Create new user
    const { data: authData, error: authError } = await this.supabaseService.signUp(
      userData.email,
      this.generateTemporaryPassword(),
      {
        full_name: userData.fullName || '',
        subscription_tier: userData.subscriptionPlan
      }
    );

    if (authError || !authData.user) {
      throw new Error('Failed to create user account: ' + authError?.message);
    }

    // Create user profile
    const { data: profile, error: profileError } = await this.supabaseService.createUserProfile({
      id: authData.user.id,
      email: userData.email,
      full_name: userData.fullName || '',
      subscription_tier: userData.subscriptionPlan
    });

    if (profileError) {
      console.warn('Failed to create user profile:', profileError);
    }

    return authData.user;
  }

  private async createIPTVAccount(userId: string, userData: UserRegistrationData): Promise<CreateSubscriptionResponse & { success: boolean; error?: string }> {
    const result = await this.megaOTTService.createAutomatedSubscription(
      userData.email,
      userData.subscriptionPlan
    );

    return result;
  }

  private async createSubscriptionRecord(userId: string, userData: UserRegistrationData, iptvResult: any): Promise<any> {
    const expiryDate = new Date();
    const planMapping = this.megaOTTService.mapSubscriptionToPlan(userData.subscriptionPlan);
    expiryDate.setDate(expiryDate.getDate() + planMapping.duration);

    const { data, error } = await this.supabaseService.createMegaOTTSubscription({
      user_id: userId,
      subscription_plan: userData.subscriptionPlan,
      status: 'active',
      megaott_user_id: iptvResult.id?.toString() || iptvResult.user_id || 'mock_id',
      expires_at: iptvResult.expiring_at || expiryDate.toISOString(),
      auto_renew: false
    });

    if (error || !data) {
      throw new Error('Failed to create subscription record: ' + error?.message);
    }

    return data;
  }

  private async createIPTVAccountRecord(userId: string, iptvResult: any, subscriptionId: string): Promise<any> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Default 30 days

    const { data, error } = await this.supabaseService.createIPTVAccount({
      user_id: userId,
      username: iptvResult.username!,
      password: iptvResult.password!,
      status: 'active',
      expires_at: iptvResult.expiring_at || expiryDate.toISOString(),
      megaott_subscription_id: subscriptionId
    });

    if (error || !data) {
      throw new Error('Failed to create IPTV account record: ' + error?.message);
    }

    return data;
  }

  private async updateAutomationStatus(
    automationId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    response?: any,
    errorMessage?: string
  ): Promise<void> {
    const { error } = await this.supabaseService.updatePurchaseAutomation(automationId, {
      status,
      megaott_response: response,
      error_message: errorMessage
    });

    if (error) {
      console.warn('Failed to update automation status:', error);
    }
  }

  private async sendWelcomeEmail(email: string, iptvResult: CreateSubscriptionResponse & { success: boolean; error?: string }, plan: string): Promise<void> {
    try {
      const credentials = this.megaOTTService.getConnectionDetails(
        iptvResult.username!,
        iptvResult.password!
      );

      // Call Supabase Edge Function to send email
      const { data, error } = await this.supabaseService.callEdgeFunction('send-welcome-email', {
        email,
        username: iptvResult.username,
        password: iptvResult.password,
        plan,
        credentials
      });

      if (error) {
        console.warn('Failed to send welcome email:', error);
      }
    } catch (error) {
      console.warn('Welcome email sending failed:', error);
    }
  }

  private generateTemporaryPassword(): string {
    return Math.random().toString(36).slice(-12) + 'A1!';
  }

  /**
   * Get automation status by payment ID
   */
  async getAutomationStatus(paymentId: string): Promise<PurchaseAutomation | null> {
    const { data, error } = await this.supabaseService.getPurchaseAutomationByPaymentId(paymentId);

    if (error) {
      console.error('Failed to get automation status:', error);
      return null;
    }

    return data;
  }

  /**
   * Retry failed automation
   */
  async retryAutomation(automationId: string): Promise<AutomationResult> {
    try {
      const { data: automation, error } = await this.supabaseService.updatePurchaseAutomation(automationId, {
        status: 'processing',
        error_message: undefined
      });

      if (error || !automation) {
        throw new Error('Failed to reset automation status');
      }

      // Get payment details and retry
      const userData: UserRegistrationData = {
        email: 'retry@example.com', // This should be retrieved from the automation record
        subscriptionPlan: automation.subscription_plan,
        paymentId: automation.payment_id
      };

      return await this.processCompleteOnboarding(userData);

    } catch (error) {
      return {
        success: false,
        error: (error as any).message
      };
    }
  }
}