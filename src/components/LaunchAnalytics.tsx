
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  event_type: string;
  properties?: Record<string, any>;
  user_id?: string;
}

export const LaunchAnalytics = {
  // Track user registration
  trackRegistration: async (userData: { email: string; plan: string; device: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const event: AnalyticsEvent = {
        event_type: 'user_registration',
        properties: {
          plan: userData.plan,
          device: userData.device,
          timestamp: new Date().toISOString(),
          source: 'web'
        },
        user_id: user?.id
      };

      console.log('[ANALYTICS] Registration tracked:', event);
      
      // In production, send to analytics service
      // await supabase.functions.invoke('track-analytics', { body: event });
      
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  },

  // Track subscription creation
  trackSubscription: async (planId: string, amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const event: AnalyticsEvent = {
        event_type: 'subscription_created',
        properties: {
          plan_id: planId,
          amount: amount,
          currency: 'usd',
          timestamp: new Date().toISOString()
        },
        user_id: user?.id
      };

      console.log('[ANALYTICS] Subscription tracked:', event);
      
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  },

  // Track app connections
  trackAppConnection: async (deviceType: string, connectionMethod: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const event: AnalyticsEvent = {
        event_type: 'app_connected',
        properties: {
          device_type: deviceType,
          connection_method: connectionMethod,
          timestamp: new Date().toISOString()
        },
        user_id: user?.id
      };

      console.log('[ANALYTICS] App connection tracked:', event);
      
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  },

  // Track playlist generation
  trackPlaylistGeneration: async (planType: string, channelCount: number) => {
    try {
      const event: AnalyticsEvent = {
        event_type: 'playlist_generated',
        properties: {
          plan_type: planType,
          channel_count: channelCount,
          timestamp: new Date().toISOString()
        }
      };

      console.log('[ANALYTICS] Playlist generation tracked:', event);
      
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  },

  // Track page views for conversion analysis
  trackPageView: (page: string) => {
    try {
      const event = {
        event_type: 'page_view',
        properties: {
          page: page,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer
        }
      };

      console.log('[ANALYTICS] Page view tracked:', event);
      
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }
};

// Analytics Hook for automatic page tracking
export const useAnalytics = (pageName: string) => {
  useEffect(() => {
    LaunchAnalytics.trackPageView(pageName);
  }, [pageName]);
};
