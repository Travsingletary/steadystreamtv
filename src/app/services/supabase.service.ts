import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AppConfig } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier?: string;
  created_at: string;
  updated_at: string;
}

export interface IPTVAccount {
  id: string;
  user_id: string;
  username: string;
  password: string;
  status: 'active' | 'suspended' | 'expired';
  expires_at: string;
  megaott_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MegaOTTSubscription {
  id: string;
  user_id: string;
  subscription_plan: string;
  status: 'active' | 'cancelled' | 'expired';
  megaott_user_id: string;
  expires_at: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseAutomation {
  id: string;
  user_id: string;
  payment_id: string;
  subscription_plan: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  megaott_response?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AppDownload {
  id: string;
  user_id: string;
  app_id: string;
  download_url: string;
  device_info?: any;
  downloaded_at: string;
  platform: string;
  app_version: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      AppConfig.SUPABASE_URL,
      AppConfig.SUPABASE_ANON_KEY
    );

    // Listen to auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  // Auth Methods
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    return { user, error };
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { data, error };
  }

  async updatePassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  }

  // User Profile Methods
  async getUserProfile(userId: string): Promise<{ data: UserProfile | null, error: any }> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  async createUserProfile(profile: Partial<UserProfile>) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();

    return { data, error };
  }

  // IPTV Account Methods
  async getUserIPTVAccounts(userId: string): Promise<{ data: IPTVAccount[] | null, error: any }> {
    const { data, error } = await this.supabase
      .from('iptv_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createIPTVAccount(account: Partial<IPTVAccount>) {
    const { data, error } = await this.supabase
      .from('iptv_accounts')
      .insert(account)
      .select()
      .single();

    return { data, error };
  }

  async updateIPTVAccount(accountId: string, updates: Partial<IPTVAccount>) {
    const { data, error } = await this.supabase
      .from('iptv_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    return { data, error };
  }

  // MegaOTT Subscription Methods
  async getUserMegaOTTSubscriptions(userId: string): Promise<{ data: MegaOTTSubscription[] | null, error: any }> {
    const { data, error } = await this.supabase
      .from('megaott_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createMegaOTTSubscription(subscription: Partial<MegaOTTSubscription>) {
    const { data, error } = await this.supabase
      .from('megaott_subscriptions')
      .insert(subscription)
      .select()
      .single();

    return { data, error };
  }

  async updateMegaOTTSubscription(subscriptionId: string, updates: Partial<MegaOTTSubscription>) {
    const { data, error } = await this.supabase
      .from('megaott_subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select()
      .single();

    return { data, error };
  }

  // Purchase Automation Methods
  async createPurchaseAutomation(automation: Partial<PurchaseAutomation>) {
    const { data, error } = await this.supabase
      .from('purchase_automations')
      .insert(automation)
      .select()
      .single();

    return { data, error };
  }

  async updatePurchaseAutomation(automationId: string, updates: Partial<PurchaseAutomation>) {
    const { data, error } = await this.supabase
      .from('purchase_automations')
      .update(updates)
      .eq('id', automationId)
      .select()
      .single();

    return { data, error };
  }

  async getPurchaseAutomationByPaymentId(paymentId: string): Promise<{ data: PurchaseAutomation | null, error: any }> {
    const { data, error } = await this.supabase
      .from('purchase_automations')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    return { data, error };
  }

  // Real-time Subscriptions
  subscribeToUserIPTVAccounts(userId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('iptv_accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'iptv_accounts',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToUserMegaOTTSubscriptions(userId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('megaott_subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'megaott_subscriptions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  // Utility Methods
  async callEdgeFunction(functionName: string, payload: any) {
    const { data, error } = await this.supabase.functions.invoke(functionName, {
      body: payload
    });

    return { data, error };
  }

  // Storage Methods (for avatars, etc.)
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file);

    return { data, error };
  }

  async getPublicUrl(bucket: string, path: string) {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // App Download Methods
  async recordAppDownload(download: Omit<AppDownload, 'id' | 'downloaded_at'>) {
    const downloadRecord = {
      ...download,
      downloaded_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('app_downloads')
      .insert(downloadRecord)
      .select()
      .single();

    return { data, error };
  }

  async getUserAppDownloads(userId: string) {
    const { data, error } = await this.supabase
      .from('app_downloads')
      .select('*')
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false });

    return { data, error };
  }

  async getAppDownloadStats(appId: string) {
    const { data, error } = await this.supabase
      .from('app_downloads')
      .select('id, platform, app_version, downloaded_at')
      .eq('app_id', appId);

    return { data, error };
  }
}