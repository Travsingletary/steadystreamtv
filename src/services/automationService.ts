// src/services/automationService.ts
// This version works immediately without database setup

export interface UserData {
  name: string;
  email: string;
  password: string;
  plan: 'trial' | 'basic' | 'duo' | 'family';
  deviceType: string;
  preferences: {
    favoriteGenres: string[];
    parentalControls: boolean;
    autoOptimization: boolean;
    videoQuality: string;
  };
}

export interface RegistrationResult {
  success: boolean;
  user?: any;
  assets?: {
    activationCode: string;
    playlistToken: string;
    playlistUrl: string;
    qrCodeUrl: string;
  };
  playlistOptimization?: {
    channels: any[];
    totalOptimized: number;
    recommendation: string;
  };
  subscription?: {
    success: boolean;
    plan: string;
  };
  userData?: UserData;
  error?: string;
}

// Configuration
const CONFIG = {
  supabase: {
    url: 'https://ojuethcytwcioqtvwez.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWV0aGN5dHdjaW9xdHZ3ZXoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNzEwODc1NywiZXhwIjoyMDMyNjg0NzU3fQ.NRQhx23mPLBzZojnK_vzUPR_FcpPXgzk88iZAcpvxoo'
  },
  megaOTT: {
    baseUrl: 'https://megaott.net/api/v1/user',
    apiKey: '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d'
  },
  app: {
    downloadCode: '1592817',
    downloadUrl: 'aftv.news/1592817'
  }
};

export class SimpleAutomationService {
  /**
   * Register user with Supabase Auth only (no additional tables required)
   */
  static async registerUser(userData: UserData) {
    try {
      const response = await fetch(`${CONFIG.supabase.url}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${CONFIG.supabase.anonKey}`
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          data: {
            full_name: userData.name,
            plan: userData.plan,
            device_type: userData.deviceType,
            // Store preferences in user metadata
            preferences: JSON.stringify(userData.preferences)
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Generate user assets (activation code, playlist URL, QR code)
   */
  static async generateUserAssets(userId: string, plan: string = 'trial') {
    const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const playlistData = {
      userId,
      activationCode,
      plan,
      timestamp: Date.now(),
      expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };

    const playlistToken = btoa(JSON.stringify(playlistData));
    const playlistUrl = `${window.location.origin}/api/playlist/${playlistToken}.m3u8`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(playlistUrl)}`;

    return {
      activationCode,
      playlistToken,
      playlistUrl,
      qrCodeUrl
    };
  }

  /**
   * Smart playlist optimization
   */
  static async optimizePlaylist(userPreferences: UserData['preferences']) {
    const channelDatabase = {
      sports: [
        { name: 'ESPN HD', category: 'Sports', quality: 'HD', popularity: 95 },
        { name: 'Fox Sports 1 HD', category: 'Sports', quality: 'HD', popularity: 90 },
        { name: 'NBC Sports', category: 'Sports', quality: 'HD', popularity: 85 }
      ],
      movies: [
        { name: 'HBO Max', category: 'Movies', quality: '4K', popularity: 98 },
        { name: 'Showtime HD', category: 'Movies', quality: 'HD', popularity: 88 },
        { name: 'Starz', category: 'Movies', quality: 'HD', popularity: 82 }
      ],
      entertainment: [
        { name: 'Netflix Originals', category: 'Entertainment', quality: '4K', popularity: 99 },
        { name: 'TNT HD', category: 'Entertainment', quality: 'HD', popularity: 87 },
        { name: 'TBS HD', category: 'Entertainment', quality: 'HD', popularity: 83 }
      ],
      news: [
        { name: 'CNN HD', category: 'News', quality: 'HD', popularity: 92 },
        { name: 'Fox News HD', category: 'News', quality: 'HD', popularity: 90 },
        { name: 'BBC World News', category: 'News', quality: 'HD', popularity: 85 }
      ],
      kids: [
        { name: 'Disney Channel HD', category: 'Kids', quality: 'HD', popularity: 95 },
        { name: 'Cartoon Network', category: 'Kids', quality: 'HD', popularity: 90 },
        { name: 'Nickelodeon HD', category: 'Kids', quality: 'HD', popularity: 88 }
      ]
    };

    let optimizedChannels = [];
    
    if (userPreferences.favoriteGenres?.length > 0) {
      userPreferences.favoriteGenres.forEach(genre => {
        if (channelDatabase[genre]) {
          optimizedChannels.push(...channelDatabase[genre]);
        }
      });
    } else {
      // Default: add top channel from each category
      Object.values(channelDatabase).forEach(category => {
        optimizedChannels.push(category[0]);
      });
    }

    // Sort by quality preference and popularity
    optimizedChannels.sort((a, b) => {
      if (userPreferences.videoQuality === '4K') {
        if (a.quality === '4K' && b.quality !== '4K') return -1;
        if (a.quality !== '4K' && b.quality === '4K') return 1;
      }
      return b.popularity - a.popularity;
    });

    // Remove duplicates and limit
    const uniqueChannels = optimizedChannels
      .filter((channel, index, self) => 
        index === self.findIndex(c => c.name === channel.name)
      )
      .slice(0, 50);

    return {
      channels: uniqueChannels,
      totalOptimized: uniqueChannels.length,
      recommendation: `Playlist optimized with ${uniqueChannels.length} channels based on your preferences`
    };
  }

  /**
   * Simulate MegaOTT subscription creation
   */
  static async createMegaOTTSubscription(userId: string, plan: string) {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would make the actual API call
      console.log('MegaOTT subscription created:', { userId, plan });
      
      return {
        success: true,
        plan,
        message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated`,
        subscriptionId: `sub_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.warn('MegaOTT integration simulated:', error);
      return {
        success: true,
        plan,
        message: 'Subscription activated (demo mode)'
      };
    }
  }

  /**
   * Complete automation flow (simplified - no database required)
   */
  static async executeCompleteAutomation(userData: UserData): Promise<RegistrationResult> {
    try {
      // Step 1: Register user with Supabase Auth
      const authResult = await this.registerUser(userData);
      const userId = authResult.user?.id;

      if (!userId) {
        throw new Error('User creation failed');
      }

      // Step 2: Generate user assets
      const assets = await this.generateUserAssets(userId, userData.plan);

      // Step 3: Optimize playlist
      const playlistOptimization = await this.optimizePlaylist(userData.preferences);

      // Step 4: Create subscription
      const subscription = await this.createMegaOTTSubscription(userId, userData.plan);

      // Success! User is registered and ready to stream
      return {
        success: true,
        user: authResult.user,
        assets,
        playlistOptimization,
        subscription,
        userData
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate M3U playlist content based on plan
   */
  static generateM3UContent(plan: string, activationCode: string) {
    const getChannelsForPlan = (planType: string) => {
      const allChannels = [
        { name: 'ESPN HD', category: 'Sports', url: 'http://stream1.example.com/espn.m3u8' },
        { name: 'CNN HD', category: 'News', url: 'http://stream1.example.com/cnn.m3u8' },
        { name: 'HBO Max', category: 'Movies', url: 'http://stream1.example.com/hbo.m3u8' },
        { name: 'Disney Channel', category: 'Kids', url: 'http://stream1.example.com/disney.m3u8' },
        { name: 'TNT HD', category: 'Entertainment', url: 'http://stream1.example.com/tnt.m3u8' }
      ];

      switch (planType) {
        case 'trial': return allChannels.slice(0, 5);
        case 'basic': return allChannels.slice(0, 25);
        case 'duo': return allChannels.slice(0, 50);
        case 'family': return allChannels;
        default: return allChannels.slice(0, 3);
      }
    };

    const channels = getChannelsForPlan(plan);
    let m3uContent = '#EXTM3U\n';
    
    channels.forEach((channel, index) => {
      m3uContent += `#EXTINF:-1 tvg-id="${index + 1}" tvg-name="${channel.name}" group-title="${channel.category}",${channel.name}\n`;
      m3uContent += `${channel.url}\n`;
    });

    return m3uContent;
  }
}

// Export configuration
export { CONFIG };

// Keep backward compatibility with existing imports
export const AutomationService = SimpleAutomationService;
