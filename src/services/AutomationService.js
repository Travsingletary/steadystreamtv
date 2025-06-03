
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig, megaOttConfig } from '../config/supabase';

class AutomationService {
  constructor() {
    this.supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  }

  // 🎯 MAIN AUTOMATION - User Registration & Playlist Generation
  async registerUser(userData) {
    try {
      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
            plan: userData.plan || 'trial'
          }
        }
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('User creation failed');

      // Step 2: Generate activation code
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Step 3: Create playlist token
      const playlistToken = btoa(JSON.stringify({
        userId,
        activationCode,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      }));

      // Step 4: Generate playlist URL
      const playlistUrl = `${window.location.origin}/api/playlist/${playlistToken}.m3u8`;

      // Step 5: Store user profile
      await this.storeUserProfile(userId, userData, activationCode);

      // Step 6: Store playlist info
      await this.storePlaylistInfo(userId, playlistToken, activationCode);

      // Step 7: Create MegaOTT subscription
      await this.createMegaOTTSubscription(userId, userData.plan);

      // Step 8: Send welcome email
      await this.sendWelcomeEmail(userData.email, userData.name, playlistUrl, activationCode);

      return {
        success: true,
        user: authData.user,
        activationCode,
        playlistUrl,
        message: 'Account created successfully!'
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Store user profile in database
  async storeUserProfile(userId, userData, activationCode) {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .insert([{
          id: userId,
          full_name: userData.name,
          email: userData.email,
          subscription_plan: userData.plan || 'trial',
          activation_code: activationCode,
          onboarding_completed: false,
          trial_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.warn('Profile storage failed - user still created:', error);
    }
  }

  // Store playlist information
  async storePlaylistInfo(userId, playlistToken, activationCode) {
    try {
      const { error } = await this.supabase
        .from('user_playlists')
        .insert([{
          user_id: userId,
          playlist_token: playlistToken,
          activation_code: activationCode,
          is_active: true,
          access_count: 0,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.warn('Playlist storage failed - URL still works:', error);
    }
  }

  // Create MegaOTT subscription
  async createMegaOTTSubscription(userId, plan) {
    try {
      const response = await fetch(megaOttConfig.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${megaOttConfig.apiKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          subscription_plan: plan,
          auto_renew: true,
          trial_period: plan === 'trial' ? 24 : 0
        })
      });

      if (!response.ok) throw new Error('MegaOTT API call failed');
      
      return await response.json();
    } catch (error) {
      console.warn('MegaOTT integration pending:', error);
    }
  }

  // Send automated welcome email
  async sendWelcomeEmail(email, name, playlistUrl, activationCode) {
    try {
      const { error } = await this.supabase.functions.invoke('send-welcome-email', {
        body: {
          to: email,
          name: name,
          playlistUrl: playlistUrl,
          activationCode: activationCode,
          downloadLink: 'aftv.news/1592817'
        }
      });

      if (error) throw error;
    } catch (error) {
      console.warn('Email automation pending deployment:', error);
    }
  }

  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  // Get user playlists
  async getUserPlaylists(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_playlists')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get playlists:', error);
      return [];
    }
  }

  // Update viewing history for AI optimization
  async trackViewing(userId, channelData) {
    try {
      const { error } = await this.supabase
        .from('user_viewing_history')
        .insert([{
          user_id: userId,
          channel_name: channelData.name,
          channel_category: channelData.category,
          watch_duration: channelData.duration || 0,
          watched_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.warn('Viewing tracking failed:', error);
    }
  }

  // AI-powered playlist optimization
  async optimizePlaylist(userId) {
    try {
      // Get viewing history
      const { data: history } = await this.supabase
        .from('user_viewing_history')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(100);

      if (!history) return null;

      // Analyze viewing patterns
      const categoryPreferences = {};
      history.forEach(view => {
        const category = view.channel_category || 'General';
        categoryPreferences[category] = (categoryPreferences[category] || 0) + view.watch_duration;
      });

      // Sort by preference
      const sortedCategories = Object.entries(categoryPreferences)
        .sort(([,a], [,b]) => b - a)
        .map(([category]) => category);

      return {
        preferredCategories: sortedCategories,
        totalWatchTime: Object.values(categoryPreferences).reduce((a, b) => a + b, 0),
        suggestions: this.generatePlaylistSuggestions(sortedCategories)
      };

    } catch (error) {
      console.error('Playlist optimization failed:', error);
      return null;
    }
  }

  // Generate playlist suggestions based on AI analysis
  generatePlaylistSuggestions(preferences) {
    const suggestions = [];
    
    preferences.forEach((category, index) => {
      if (index < 3) { // Top 3 categories
        suggestions.push({
          category,
          priority: 'high',
          reason: `Your #${index + 1} most watched category`
        });
      }
    });

    return suggestions;
  }

  // Authentication helpers
  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    return !error;
  }

  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    return { user: data.user, error };
  }
}

export default new AutomationService();
