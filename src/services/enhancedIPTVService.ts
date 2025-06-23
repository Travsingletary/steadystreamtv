
import { supabase } from '@/integrations/supabase/client';
import { IPTVFormData } from '@/types/iptv';

export class EnhancedIPTVService {
  static async createStripeCheckout(formData: IPTVFormData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          planType: formData.planType,
          customerEmail: formData.email,
          customerName: formData.name,
          successUrl: `${window.location.origin}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`,
          metadata: {
            customer_country: formData.country,
            customer_phone: formData.phone,
            plan_type: formData.planType,
            user_id: user?.id
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, url: data.url };
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }
  }

  static async checkPurchaseStatus(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('purchase_automations')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();

      if (error) {
        return { status: 'not_found' };
      }

      return {
        status: data.automation_status,
        error: data.error_message,
        emailSent: data.email_sent
      };
    } catch (error) {
      console.error('Error checking purchase status:', error);
      return { status: 'error' };
    }
  }

  static async getUserCredentials(userId: string) {
    try {
      const { data, error } = await supabase
        .from('iptv_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      return {
        username: data.username,
        password: data.password,
        server_url: data.server_url,
        playlist_url: data.playlist_url,
        activation_code: data.activation_code,
        max_connections: data.package_id || 1,
        expires_at: data.expires_at,
        plan_type: data.plan_type
      };
    } catch (error) {
      console.error('Error fetching user credentials:', error);
      return null;
    }
  }
}
