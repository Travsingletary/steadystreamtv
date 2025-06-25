
import { supabase } from '@/integrations/supabase/client';

export class PlaylistAnalyticsService {
  // Track viewing analytics for viewing patterns
  static async trackViewingAnalytics(
    userId: string,
    channelInfo: {
      id: string;
      name: string;
      group: string;
    },
    duration: number
  ) {
    try {
      const { error } = await supabase
        .from('viewing_analytics')
        .insert({
          user_id: userId,
          channel_id: channelInfo.id,
          channel_name: channelInfo.name,
          category: channelInfo.group,
          duration_seconds: duration
        });

      if (error) {
        console.error('Analytics tracking error:', error);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Get user viewing analytics
  static async getUserAnalytics(userId: string, days: number = 30) {
    try {
      const { data, error } = await supabase
        .from('viewing_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('watched_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('watched_at', { ascending: false });

      if (error) throw error;

      // Process analytics data
      const totalWatchTime = data?.reduce((sum, record) => sum + (record.duration_seconds || 0), 0) || 0;
      const categoryStats = data?.reduce((acc, record) => {
        const category = record.category || 'Unknown';
        acc[category] = (acc[category] || 0) + (record.duration_seconds || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        success: true,
        analytics: {
          totalWatchTime,
          totalSessions: data?.length || 0,
          categoryStats,
          recentActivity: data?.slice(0, 10) || []
        }
      };
    } catch (error) {
      console.error('❌ Analytics retrieval failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Analyze viewing patterns and optimize channel order
  static async optimizeForUser(userId: string) {
    try {
      // Get viewing analytics for the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: analytics, error } = await supabase
        .from('viewing_analytics')
        .select('channel_name, category, duration_seconds')
        .eq('user_id', userId)
        .gte('watched_at', thirtyDaysAgo);

      if (error) throw error;

      // Calculate category preferences
      const categoryScores: Record<string, number> = {};
      const channelScores: Record<string, number> = {};

      analytics?.forEach(item => {
        const category = item.category || 'Unknown';
        const channel = item.channel_name || 'Unknown';
        const duration = item.duration_seconds || 0;

        categoryScores[category] = (categoryScores[category] || 0) + duration;
        channelScores[channel] = (channelScores[channel] || 0) + duration;
      });

      // Get most watched channels
      const topChannels = Object.entries(channelScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([channel]) => channel);

      return {
        preferredCategories: Object.keys(categoryScores).sort((a, b) => 
          categoryScores[b] - categoryScores[a]
        ),
        topChannels,
        categoryScores,
        channelScores
      };
    } catch (error) {
      console.error('Error optimizing for user:', error);
      return {
        preferredCategories: [],
        topChannels: [],
        categoryScores: {},
        channelScores: {}
      };
    }
  }

  // Generate content recommendations based on viewing patterns
  static async generateRecommendations(userId: string) {
    const viewingPatterns = await this.optimizeForUser(userId);
    
    // Time-based content suggestions
    const timeBasedSuggestions = this.getTimeBasedSuggestions();
    
    const recommendations = {
      categories: viewingPatterns.preferredCategories.slice(0, 5),
      timeBasedSuggestions,
      topChannels: viewingPatterns.topChannels.slice(0, 10),
      insights: {
        mostWatchedCategory: viewingPatterns.preferredCategories[0] || 'Entertainment',
        viewingHabits: this.analyzeViewingHabits(viewingPatterns)
      }
    };

    return recommendations;
  }

  // Time-based content suggestions
  static getTimeBasedSuggestions() {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return ['News', 'Morning Shows', 'Kids'];
    } else if (hour >= 12 && hour < 18) {
      return ['Sports', 'Lifestyle', 'Documentary'];
    } else if (hour >= 18 && hour < 23) {
      return ['Movies', 'Series', 'Entertainment'];
    } else {
      return ['Movies', 'International', 'Music'];
    }
  }

  // Analyze viewing habits
  private static analyzeViewingHabits(patterns: any) {
    const habits = [];
    
    if (patterns.preferredCategories.includes('News')) {
      habits.push('News enthusiast');
    }
    
    if (patterns.preferredCategories.includes('Sports')) {
      habits.push('Sports fan');
    }
    
    if (patterns.preferredCategories.includes('Movies')) {
      habits.push('Movie lover');
    }
    
    if (patterns.preferredCategories.includes('Kids')) {
      habits.push('Family viewing');
    }
    
    return habits.length > 0 ? habits : ['Diverse viewer'];
  }

  // Track playlist access
  static async trackPlaylistAccess(userId: string, token: string, success: boolean) {
    try {
      const { error } = await supabase
        .from('playlist_access_logs')
        .insert({
          user_id: userId,
          playlist_url: `${window.location.origin}/api/playlist/${token}`,
          success,
          accessed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Playlist access tracking error:', error);
      }
    } catch (error) {
      console.error('Playlist access tracking error:', error);
    }
  }
}
