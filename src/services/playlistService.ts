import { supabase } from "@/integrations/supabase/client";

export class PlaylistService {
  /**
   * Generate M3U playlist content using the NEW database function with improved logos
   */
  static async generateM3UFromDatabase(playlistToken: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_m3u_playlist', {
        input_token: playlistToken
      });

      if (error) {
        console.error('Error generating playlist:', error);
        return '#EXTM3U\n#EXTINF:-1,Error Loading Playlist\nhttp://error\n';
      }

      return data || '#EXTM3U\n#EXTINF:-1,Empty Playlist\nhttp://empty\n';
    } catch (error) {
      console.error('Error generating playlist:', error);
      return '#EXTM3U\n#EXTINF:-1,Error Loading Playlist\nhttp://error\n';
    }
  }

  /**
   * Generate M3U playlist content - ALL USERS GET ALL CHANNELS
   */
  static async generateM3UContent(plan: string, activationCode: string): Promise<string> {
    try {
      // Fetch ALL channels from database - no plan filtering
      const { data: channels, error } = await supabase
        .from('channels_catalog')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('sort_order')
        .order('name');

      if (error) {
        console.error('Error fetching channels:', error);
        return '#EXTM3U\n#EXTINF:-1,Error Loading Channels\nhttp://error\n';
      }

      // Build M3U content with ALL channels for everyone
      let m3uContent = '#EXTM3U\n';
      m3uContent += `#PLAYLIST:SteadyStream TV - All Channels (${activationCode})\n`;
      m3uContent += 'url-tvg="https://steadystreamtv.com/epg/guide.xml"\n\n';

      (channels || []).forEach((channel) => {
        const logoUrl = this.getChannelLogoUrl(channel);
        const epgId = channel.epg_id || channel.name.replace(/[^a-zA-Z0-9]/g, '');
        
        m3uContent += `#EXTINF:-1 tvg-id="${epgId}" tvg-name="${channel.name}" tvg-logo="${logoUrl}" group-title="${channel.category}",${channel.name}\n`;
        m3uContent += `${channel.stream_url}\n\n`;
      });

      return m3uContent;
    } catch (error) {
      console.error('Error generating M3U content:', error);
      return '#EXTM3U\n#EXTINF:-1,Error Loading Playlist\nhttp://error\n';
    }
  }

  /**
   * Get logo URL with fallbacks
   */
  private static getChannelLogoUrl(channel: any): string {
    // Priority 1: Use provided logo URL
    if (channel.logo_url && channel.logo_url.trim() !== '') {
      return channel.logo_url;
    }

    // Priority 2: Generate from reliable external sources
    const name = channel.name.toLowerCase();
    
    if (name.includes('cnn')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/200px-CNN.svg.png';
    }
    if (name.includes('fox news')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fox_News_Channel_logo.svg/200px-Fox_News_Channel_logo.svg.png';
    }
    if (name.includes('espn') && !name.includes('espn2')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/200px-ESPN_wordmark.svg.png';
    }
    if (name.includes('espn2')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ESPN2_logo.svg/200px-ESPN2_logo.svg.png';
    }
    if (name.includes('hbo')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/200px-HBO_logo.svg.png';
    }
    if (name.includes('disney')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/2019_Disney_Channel_logo.svg/200px-2019_Disney_Channel_logo.svg.png';
    }

    // Priority 3: Category-based fallbacks
    switch (channel.category) {
      case 'News':
        return 'https://via.placeholder.com/200x200/1e40af/ffffff?text=NEWS';
      case 'Sports':
        return 'https://via.placeholder.com/200x200/059669/ffffff?text=SPORTS';
      case 'Entertainment':
        return 'https://via.placeholder.com/200x200/7c3aed/ffffff?text=ENT';
      case 'Movies':
        return 'https://via.placeholder.com/200x200/dc2626/ffffff?text=MOVIES';
      case 'Kids':
        return 'https://via.placeholder.com/200x200/f59e0b/ffffff?text=KIDS';
      case 'Music':
        return 'https://via.placeholder.com/200x200/ec4899/ffffff?text=MUSIC';
      case 'Documentary':
        return 'https://via.placeholder.com/200x200/16a34a/ffffff?text=DOCS';
      default:
        return 'https://via.placeholder.com/200x200/6b7280/ffffff?text=TV';
    }
  }
}
