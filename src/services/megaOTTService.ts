
// =====================================
// AUTOMATED MEGAOTT INTEGRATION SERVICE
// =====================================
import type { UnifiedUserData, IPTVCredentials } from '@/types/automation';

export class MegaOTTService {
  private apiKey = '411|LglDT244VcSuG75GXMAmsqm7IiCG8E3GTvFd23QR89d97e12';
  private baseUrl = 'https://megaott.net/api/v1';

  async createIPTVAccount(userData: UnifiedUserData): Promise<IPTVCredentials> {
    try {
      // Generate credentials
      const username = `SST_${Date.now().toString(36)}`;
      const password = Math.random().toString(36).substring(2, 12);
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Get plan configuration
      const planConfig = this.getPlanConfig(userData.plan);
      
      // Create account via MegaOTT API
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          username,
          password,
          email: userData.email,
          full_name: userData.name,
          ...planConfig,
          auto_renew: true,
          trial_period: userData.plan === 'trial' ? 24 : 0
        })
      });

      if (!response.ok) {
        throw new Error(`MegaOTT API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Generate playlist URL
      const playlistUrl = `http://megaott.net:8080/get.php?username=${username}&password=${password}&type=m3u_plus&output=ts`;
      
      return {
        username,
        password,
        serverUrl: 'http://megaott.net:8080',
        activationCode,
        playlistUrl,
        expiresAt: new Date(Date.now() + (planConfig.duration * 24 * 60 * 60 * 1000)).toISOString()
      };

    } catch (error) {
      console.error('MegaOTT account creation failed:', error);
      // Return demo credentials as fallback
      return this.generateDemoCredentials(userData);
    }
  }

  private getPlanConfig(plan: string) {
    const configs = {
      trial: { duration: 1, max_connections: 1, package_id: 'trial_package' },
      solo: { duration: 30, max_connections: 1, package_id: 'solo_package' },
      duo: { duration: 30, max_connections: 2, package_id: 'duo_package' },
      family: { duration: 30, max_connections: 3, package_id: 'family_package' }
    };
    return configs[plan] || configs.trial;
  }

  private generateDemoCredentials(userData: UnifiedUserData): IPTVCredentials {
    const username = `DEMO_${Date.now().toString(36)}`;
    const password = Math.random().toString(36).substring(2, 12);
    const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return {
      username,
      password,
      serverUrl: 'http://demo.steadystreamtv.com:8080',
      activationCode,
      playlistUrl: `${window.location.origin}/api/demo-playlist/${username}`,
      expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()
    };
  }

  async optimizePlaylist(credentials: IPTVCredentials, userPreferences?: any): Promise<string> {
    try {
      // Fetch and optimize playlist based on user preferences
      const response = await fetch(credentials.playlistUrl);
      const m3uContent = await response.text();
      
      // Parse and optimize playlist
      const optimizedPlaylist = this.processPlaylist(m3uContent, userPreferences);
      
      // Store optimized playlist
      const optimizedUrl = await this.storeOptimizedPlaylist(optimizedPlaylist, credentials.username);
      
      return optimizedUrl;
    } catch (error) {
      console.error('Playlist optimization failed:', error);
      return credentials.playlistUrl; // Return original if optimization fails
    }
  }

  private processPlaylist(m3uContent: string, preferences?: any): string {
    const lines = m3uContent.split('\n');
    const optimizedLines: string[] = ['#EXTM3U'];
    
    // Add EPG URL if available
    optimizedLines.push('#EXT-X-SESSION-DATA:DATA-ID="com.steadystream.epg",VALUE="http://megaott.net:8080/xmltv.php"');
    
    let currentChannel: any = null;
    
    for (const line of lines) {
      if (line.startsWith('#EXTINF:')) {
        currentChannel = this.parseChannelInfo(line);
      } else if (line.startsWith('http') && currentChannel) {
        // Apply optimization logic
        if (this.shouldIncludeChannel(currentChannel, preferences)) {
          optimizedLines.push(this.formatChannelInfo(currentChannel));
          optimizedLines.push(line);
        }
        currentChannel = null;
      }
    }
    
    return optimizedLines.join('\n');
  }

  private parseChannelInfo(extinf: string): any {
    const match = extinf.match(/#EXTINF:-?1\s*(?:tvg-id="([^"]*)")?\s*(?:tvg-name="([^"]*)")?\s*(?:tvg-logo="([^"]*)")?\s*(?:group-title="([^"]*)")?,(.+)/);
    
    if (!match) return null;
    
    return {
      id: match[1] || '',
      name: match[2] || match[5] || '',
      logo: match[3] || '',
      group: match[4] || 'General',
      displayName: match[5] || ''
    };
  }

  private shouldIncludeChannel(channel: any, preferences?: any): boolean {
    if (!preferences) return true;
    
    // Filter out adult content if parental controls enabled
    if (preferences.parentalControls && channel.group?.toLowerCase().includes('adult')) {
      return false;
    }
    
    // Prioritize user's favorite genres
    if (preferences.favoriteGenres?.length > 0) {
      const isPreferred = preferences.favoriteGenres.some((genre: string) => 
        channel.group?.toLowerCase().includes(genre.toLowerCase())
      );
      if (isPreferred) return true;
    }
    
    // Filter low-quality streams if HD preferred
    if (preferences.qualityPreference === 'hd' && !channel.name.includes('HD')) {
      return false;
    }
    
    return true;
  }

  private formatChannelInfo(channel: any): string {
    return `#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo}" group-title="${channel.group}",${channel.displayName}`;
  }

  private async storeOptimizedPlaylist(content: string, username: string): Promise<string> {
    // In a real implementation, you'd store this in your CDN or file storage
    // For now, return a generated URL
    return `${window.location.origin}/api/optimized-playlist/${username}.m3u8`;
  }
}
