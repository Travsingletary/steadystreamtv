
import { useState, useEffect } from 'react';
import { PlaylistAnalyticsService } from '@/services/playlistAnalyticsService';

export interface ViewingAnalytics {
  totalWatchTime: number;
  totalSessions: number;
  categoryStats: Record<string, number>;
  recentActivity: Array<{
    channel_name: string;
    category: string;
    duration_seconds: number;
    watched_at: string;
  }>;
}

export interface UserRecommendations {
  categories: string[];
  timeBasedSuggestions: string[];
  topChannels: string[];
  insights: {
    mostWatchedCategory: string;
    viewingHabits: string[];
  };
}

export function usePlaylistAnalytics(userId: string | null) {
  const [analytics, setAnalytics] = useState<ViewingAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<UserRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user analytics
  const fetchAnalytics = async (days: number = 30) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await PlaylistAnalyticsService.getUserAnalytics(userId, days);
      
      if (result.success) {
        setAnalytics(result.analytics);
      } else {
        setError(result.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    if (!userId) return;

    try {
      const recs = await PlaylistAnalyticsService.generateRecommendations(userId);
      setRecommendations(recs);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  // Track viewing session
  const trackViewing = async (channelInfo: {
    id: string;
    name: string;
    group: string;
  }, duration: number) => {
    if (!userId) return;

    try {
      await PlaylistAnalyticsService.trackViewingAnalytics(userId, channelInfo, duration);
      // Refresh analytics after tracking
      await fetchAnalytics();
    } catch (err) {
      console.error('Failed to track viewing:', err);
    }
  };

  // Track playlist access
  const trackPlaylistAccess = async (token: string, success: boolean) => {
    if (!userId) return;

    try {
      await PlaylistAnalyticsService.trackPlaylistAccess(userId, token, success);
    } catch (err) {
      console.error('Failed to track playlist access:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAnalytics();
      fetchRecommendations();
    }
  }, [userId]);

  return {
    analytics,
    recommendations,
    loading,
    error,
    fetchAnalytics,
    fetchRecommendations,
    trackViewing,
    trackPlaylistAccess,
    refetch: () => {
      fetchAnalytics();
      fetchRecommendations();
    }
  };
}
