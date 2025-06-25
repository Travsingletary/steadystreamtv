
import { supabase } from '@/integrations/supabase/client';

interface MegaOTTConfig {
  baseUrl: string;
  apiKey: string;
  panelUrl: string;
}

interface TokenPurchaseRequest {
  quantity: number;
  duration: number; // in days
  packageType: 'basic' | 'premium' | 'vip';
}

interface UserSubscription {
  userId: string;
  email: string;
  plan: string;
  deviceLimit: number;
}

export class MegaOTTIntegrationService {
  private config: MegaOTTConfig;
  
  constructor() {
    this.config = {
      baseUrl: 'https://megaott.net/api/v1',
      apiKey: '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d',
      panelUrl: 'https://gangstageeks.com/tivimate/rs6/steady/'
    };
  }

  // Step 1: Purchase tokens in bulk from MegaOTT
  async purchaseTokensBulk(request: TokenPurchaseRequest) {
    try {
      const response = await fetch(`${this.config.baseUrl}/reseller/tokens/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          quantity: request.quantity,
          duration_days: request.duration,
          package_type: request.packageType,
          auto_generate: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to purchase tokens');
      }

      const data = await response.json();
      
      // Store purchased tokens in Supabase
      await this.storePurchasedTokens(data.tokens);
      
      return data;
    } catch (error) {
      console.error('Token purchase error:', error);
      throw error;
    }
  }

  // Step 2: Store tokens in your database
  private async storePurchasedTokens(tokens: any[]) {
    const tokenRecords = tokens.map(token => ({
      token_code: token.code,
      duration_days: token.duration,
      package_type: token.package,
      status: 'available',
      purchased_at: new Date().toISOString(),
      megaott_token_id: token.id
    }));

    const { error } = await supabase
      .from('megaott_tokens')
      .insert(tokenRecords);

    if (error) throw error;
  }

  // Step 3: Assign token to new customer
  async assignTokenToCustomer(subscription: UserSubscription) {
    try {
      // Get an available token based on the plan
      const packageType = this.mapPlanToPackage(subscription.plan);
      
      const { data: availableToken, error: tokenError } = await supabase
        .from('megaott_tokens')
        .select('*')
        .eq('status', 'available')
        .eq('package_type', packageType)
        .limit(1)
        .single();

      if (tokenError || !availableToken) {
        // Auto-purchase more tokens if none available
        await this.purchaseTokensBulk({
          quantity: 10,
          duration: 30,
          packageType: packageType
        });
        
        // Retry getting token
        return this.assignTokenToCustomer(subscription);
      }

      // Activate token for customer
      const activationResult = await this.activateTokenForUser(
        availableToken.token_code,
        subscription
      );

      // Update token status
      await supabase
        .from('megaott_tokens')
        .update({ 
          status: 'assigned',
          assigned_to: subscription.userId,
          assigned_at: new Date().toISOString()
        })
        .eq('token_code', availableToken.token_code);

      // Create subscription record
      await this.createSubscriptionRecord(subscription, activationResult);

      return activationResult;
    } catch (error) {
      console.error('Token assignment error:', error);
      throw error;
    }
  }

  // Step 4: Activate token with MegaOTT
  private async activateTokenForUser(tokenCode: string, subscription: UserSubscription) {
    const response = await fetch(`${this.config.baseUrl}/user/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        token: tokenCode,
        user_id: subscription.userId,
        email: subscription.email,
        device_limit: subscription.deviceLimit,
        notes: `SteadyStream Customer - ${subscription.plan}`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to activate token');
    }

    const data = await response.json();
    
    return {
      playlistUrl: data.playlist_url,
      username: data.username,
      password: data.password,
      expiresAt: data.expires_at,
      serverUrl: data.server_url
    };
  }

  // Step 5: Create subscription record
  private async createSubscriptionRecord(subscription: UserSubscription, activationData: any) {
    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_profile_id: subscription.userId,
        plan_type: subscription.plan,
        billing_status: 'active',
        start_date: new Date().toISOString(),
        end_date: activationData.expiresAt,
        auto_renew: false
      });

    if (error) throw error;
  }

  // Helper: Map subscription plan to MegaOTT package
  private mapPlanToPackage(plan: string): 'basic' | 'premium' | 'vip' {
    switch (plan) {
      case 'solo':
      case 'trial':
        return 'basic';
      case 'duo':
        return 'premium';
      case 'family':
        return 'vip';
      default:
        return 'basic';
    }
  }

  // Step 6: Generate optimized playlist
  async generateOptimizedPlaylist(userId: string) {
    try {
      // Get user's subscription data
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_profile_id', userId)
        .single();

      if (!subscription) throw new Error('No subscription found');

      // Get original playlist from MegaOTT (use our existing service)
      const originalPlaylist = await this.fetchOriginalPlaylist(userId);
      
      // Get user preferences
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Optimize playlist based on preferences
      const optimizedPlaylist = await this.optimizePlaylist(
        originalPlaylist,
        preferences || {}
      );

      // Store optimized playlist
      const playlistToken = this.generatePlaylistToken();
      
      await supabase
        .from('optimized_playlists')
        .insert({
          user_id: userId,
          token: playlistToken,
          content: optimizedPlaylist,
          original_url: `${window.location.origin}/api/playlist/${userId}`,
          created_at: new Date().toISOString()
        });

      return {
        playlistUrl: `${window.location.origin}/api/playlist/${playlistToken}`,
        token: playlistToken
      };
    } catch (error) {
      console.error('Playlist generation error:', error);
      throw error;
    }
  }

  // Fetch original playlist using our existing system
  private async fetchOriginalPlaylist(userId: string) {
    // Use our existing playlist generation function
    const { data, error } = await supabase.rpc('generate_m3u_playlist', {
      input_token: btoa(JSON.stringify({ userId }))
    });

    if (error) throw error;

    return this.parseM3U(data);
  }

  // Parse M3U playlist
  private parseM3U(content: string) {
    const lines = content.split('\n');
    const channels = [];
    let currentChannel: any = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        // Parse channel info
        const matches = line.match(/tvg-id="([^"]*)".*tvg-name="([^"]*)".*tvg-logo="([^"]*)".*group-title="([^"]*)"/);
        if (matches) {
          currentChannel = {
            id: matches[1],
            name: matches[2],
            logo: matches[3],
            group: matches[4]
          };
        }
      } else if (line && !line.startsWith('#')) {
        // This is the stream URL
        currentChannel.url = line;
        channels.push(currentChannel);
        currentChannel = {};
      }
    }

    return channels;
  }

  // Optimize playlist based on user preferences
  private async optimizePlaylist(channels: any[], preferences: any) {
    let optimized = [...channels];

    // Sort by user's favorite categories
    if (preferences.favorite_categories) {
      optimized.sort((a, b) => {
        const aIndex = preferences.favorite_categories.indexOf(a.group);
        const bIndex = preferences.favorite_categories.indexOf(b.group);
        
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });
    }

    // Filter out blocked categories
    if (preferences.blocked_categories) {
      optimized = optimized.filter(channel => 
        !preferences.blocked_categories.includes(channel.group)
      );
    }

    // Add quality preferences
    optimized = optimized.map(channel => ({
      ...channel,
      preferredQuality: preferences.preferred_quality || 'auto'
    }));

    // Generate optimized M3U
    return this.generateM3U(optimized);
  }

  // Generate M3U format
  private generateM3U(channels: any[]) {
    let m3u = '#EXTM3U\n';
    
    channels.forEach(channel => {
      m3u += `#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo}" group-title="${channel.group}",${channel.name}\n`;
      m3u += `${channel.url}\n`;
    });
    
    return m3u;
  }

  // Generate unique playlist token
  private generatePlaylistToken() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  // Monitor token inventory
  async monitorTokenInventory() {
    const { data: stats } = await supabase
      .from('megaott_tokens')
      .select('package_type, status')
      .eq('status', 'available');

    const inventory = {
      basic: 0,
      premium: 0,
      vip: 0
    };

    stats?.forEach(token => {
      inventory[token.package_type]++;
    });

    // Auto-replenish if low
    for (const [type, count] of Object.entries(inventory)) {
      if (count < 5) {
        await this.purchaseTokensBulk({
          quantity: 20,
          duration: 30,
          packageType: type as any
        });
      }
    }

    return inventory;
  }
}
