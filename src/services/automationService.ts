
import { supabase } from "@/integrations/supabase/client";

export interface UserData {
  name: string;
  email: string;
  password: string;
  plan: string;
  deviceType?: string;
  preferences?: {
    favoriteGenres?: string[];
    parentalControls?: boolean;
    autoOptimization?: boolean;
    videoQuality?: string;
  };
}

export interface AutomationResult {
  success: boolean;
  user?: any;
  activationCode?: string;
  playlistUrl?: string;
  error?: string;
  message?: string;
}

// Channel database for playlist generation
const channelDatabase = {
  sports: [
    { name: 'ESPN HD', category: 'Sports', quality: 'HD', popularity: 95, streamUrl: 'https://stream.example.com/espn.m3u8', logo: 'espn-logo.png' },
    { name: 'Fox Sports', category: 'Sports', quality: 'HD', popularity: 90, streamUrl: 'https://stream.example.com/foxsports.m3u8', logo: 'foxsports-logo.png' },
    { name: 'NBC Sports', category: 'Sports', quality: 'HD', popularity: 85, streamUrl: 'https://stream.example.com/nbcsports.m3u8', logo: 'nbcsports-logo.png' }
  ],
  movies: [
    { name: 'HBO HD', category: 'Movies', quality: 'HD', popularity: 98, streamUrl: 'https://stream.example.com/hbo.m3u8', logo: 'hbo-logo.png' },
    { name: 'Showtime', category: 'Movies', quality: 'HD', popularity: 92, streamUrl: 'https://stream.example.com/showtime.m3u8', logo: 'showtime-logo.png' },
    { name: 'Starz', category: 'Movies', quality: 'HD', popularity: 88, streamUrl: 'https://stream.example.com/starz.m3u8', logo: 'starz-logo.png' }
  ],
  news: [
    { name: 'CNN HD', category: 'News', quality: 'HD', popularity: 94, streamUrl: 'https://stream.example.com/cnn.m3u8', logo: 'cnn-logo.png' },
    { name: 'Fox News', category: 'News', quality: 'HD', popularity: 91, streamUrl: 'https://stream.example.com/foxnews.m3u8', logo: 'foxnews-logo.png' },
    { name: 'MSNBC', category: 'News', quality: 'HD', popularity: 87, streamUrl: 'https://stream.example.com/msnbc.m3u8', logo: 'msnbc-logo.png' }
  ],
  kids: [
    { name: 'Disney Channel', category: 'Kids', quality: 'HD', popularity: 96, streamUrl: 'https://stream.example.com/disney.m3u8', logo: 'disney-logo.png' },
    { name: 'Cartoon Network', category: 'Kids', quality: 'HD', popularity: 89, streamUrl: 'https://stream.example.com/cartoon.m3u8', logo: 'cartoon-logo.png' },
    { name: 'Nickelodeon', category: 'Kids', quality: 'HD', popularity: 93, streamUrl: 'https://stream.example.com/nick.m3u8', logo: 'nick-logo.png' }
  ]
};

export class AutomationService {
  static async registerUser(userData: UserData): Promise<AutomationResult> {
    try {
      console.log('🚀 Starting user registration automation...');
      
      // Generate activation code
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Sign up user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
            plan: userData.plan,
            activation_code: activationCode
          }
        }
      });

      if (authError) {
        console.error('❌ Authentication error:', authError);
        throw new Error(`Registration failed: ${authError.message}`);
      }

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error('User creation failed - no user ID');
      }

      console.log('✅ User created successfully:', userId);

      // Generate playlist token
      const playlistToken = btoa(JSON.stringify({
        userId,
        activationCode,
        plan: userData.plan,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        preferences: userData.preferences || {}
      }));

      // Generate playlist URL
      const playlistUrl = `${window.location.origin}/api/playlist/${playlistToken}.m3u8`;

      // Create user profile record (fix: remove preferences and id fields)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          full_name: userData.name,
          email: userData.email,
          subscription_plan: userData.plan,
          activation_code: activationCode
        });

      if (profileError) {
        console.warn('⚠️ Profile creation warning:', profileError);
        // Don't fail the entire process for profile creation issues
      }

      // Create playlist record
      const { error: playlistError } = await supabase
        .from('user_playlists')
        .insert({
          user_id: userId,
          playlist_token: playlistToken,
          activation_code: activationCode,
          is_active: true
        });

      if (playlistError) {
        console.warn('⚠️ Playlist record warning:', playlistError);
        // Don't fail the entire process for playlist record issues
      }

      // MegaOTT integration (non-blocking)
      try {
        await this.createMegaOTTAccount(userId, userData);
      } catch (megaError) {
        console.warn('⚠️ MegaOTT integration pending:', megaError);
        // Don't fail the main process for MegaOTT issues
      }

      console.log('🎉 Automation completed successfully!');

      return {
        success: true,
        user: authData.user,
        activationCode,
        playlistUrl,
        message: 'Account created successfully!'
      };

    } catch (error: any) {
      console.error('💥 Automation error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  private static async createMegaOTTAccount(userId: string, userData: UserData) {
    const MEGAOTT_CONFIG = {
      baseUrl: 'https://megaott.net/api/v1/user',
      apiKey: '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d'
    };

    console.log('🔄 Creating MegaOTT account...');

    const response = await fetch(MEGAOTT_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEGAOTT_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        user_id: userId,
        subscription_plan: userData.plan,
        auto_renew: true,
        trial_period: userData.plan === 'trial' ? 24 : 0,
        max_devices: this.getMaxDevicesForPlan(userData.plan),
        email: userData.email,
        name: userData.name
      })
    });

    if (!response.ok) {
      throw new Error(`MegaOTT API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ MegaOTT account created:', result);
    return result;
  }

  private static getMaxDevicesForPlan(plan: string): number {
    const deviceLimits = {
      trial: 1,
      basic: 1,
      duo: 2,
      family: 3
    };
    return deviceLimits[plan as keyof typeof deviceLimits] || 1;
  }

  static generateOptimizedPlaylist(plan: string, preferences: any = {}): string {
    const { favoriteGenres = ['sports', 'movies', 'news'], videoQuality = 'HD' } = preferences;
    
    let selectedChannels: any[] = [];
    
    // Get channels based on favorite genres
    favoriteGenres.forEach((genre: string) => {
      if (channelDatabase[genre as keyof typeof channelDatabase]) {
        selectedChannels = [...selectedChannels, ...channelDatabase[genre as keyof typeof channelDatabase]];
      }
    });

    // Limit channels based on plan
    const channelLimits = {
      trial: 10,
      basic: 50,
      duo: 100,
      family: 200
    };

    const maxChannels = channelLimits[plan as keyof typeof channelLimits] || 10;
    selectedChannels = selectedChannels
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, maxChannels);

    // Generate M3U playlist
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:3\n\n';

    selectedChannels.forEach((channel, index) => {
      playlist += `#EXTINF:-1 tvg-id="${index + 1}" tvg-name="${channel.name}" tvg-logo="${channel.logo}" group-title="${channel.category}",${channel.name}\n`;
      playlist += `${channel.streamUrl}\n\n`;
    });

    playlist += '#EXT-X-ENDLIST\n';
    return playlist;
  }
}
