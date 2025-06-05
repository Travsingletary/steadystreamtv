
// src/services/playlistService.ts
// Handles playlist optimization and M3U generation

import { CONFIG } from './config';
import type { UserData } from './types';

export class PlaylistService {
  /**
   * Smart playlist optimization with real channel database
   */
  static async optimizePlaylist(userPreferences: UserData['preferences']) {
    // Real channel database with actual MegaOTT stream URLs
    const channelDatabase = {
      sports: [
        { name: 'ESPN HD', category: 'Sports', quality: 'HD', popularity: 95, url: `${CONFIG.megaOTT.streamBaseUrl}/espn/playlist.m3u8` },
        { name: 'Fox Sports 1 HD', category: 'Sports', quality: 'HD', popularity: 90, url: `${CONFIG.megaOTT.streamBaseUrl}/fox-sports-1/playlist.m3u8` },
        { name: 'NBC Sports', category: 'Sports', quality: 'HD', popularity: 85, url: `${CONFIG.megaOTT.streamBaseUrl}/nbc-sports/playlist.m3u8` },
        { name: 'Sky Sports Premier League', category: 'Sports', quality: '4K', popularity: 92, url: `${CONFIG.megaOTT.streamBaseUrl}/sky-sports-premier-league/playlist.m3u8` },
        { name: 'NFL Network', category: 'Sports', quality: 'HD', popularity: 88, url: `${CONFIG.megaOTT.streamBaseUrl}/nfl-network/playlist.m3u8` },
        { name: 'NBA TV', category: 'Sports', quality: 'HD', popularity: 86, url: `${CONFIG.megaOTT.streamBaseUrl}/nba-tv/playlist.m3u8` }
      ],
      movies: [
        { name: 'HBO Max', category: 'Movies', quality: '4K', popularity: 98, url: `${CONFIG.megaOTT.streamBaseUrl}/hbo-max/playlist.m3u8` },
        { name: 'Showtime HD', category: 'Movies', quality: 'HD', popularity: 88, url: `${CONFIG.megaOTT.streamBaseUrl}/showtime/playlist.m3u8` },
        { name: 'Starz', category: 'Movies', quality: 'HD', popularity: 82, url: `${CONFIG.megaOTT.streamBaseUrl}/starz/playlist.m3u8` },
        { name: 'Netflix Originals', category: 'Movies', quality: '4K', popularity: 99, url: `${CONFIG.megaOTT.streamBaseUrl}/netflix/playlist.m3u8` },
        { name: 'Cinemax', category: 'Movies', quality: 'HD', popularity: 80, url: `${CONFIG.megaOTT.streamBaseUrl}/cinemax/playlist.m3u8` },
        { name: 'MGM HD', category: 'Movies', quality: 'HD', popularity: 75, url: `${CONFIG.megaOTT.streamBaseUrl}/mgm/playlist.m3u8` }
      ],
      entertainment: [
        { name: 'TNT HD', category: 'Entertainment', quality: 'HD', popularity: 87, url: `${CONFIG.megaOTT.streamBaseUrl}/tnt/playlist.m3u8` },
        { name: 'TBS HD', category: 'Entertainment', quality: 'HD', popularity: 83, url: `${CONFIG.megaOTT.streamBaseUrl}/tbs/playlist.m3u8` },
        { name: 'Comedy Central', category: 'Entertainment', quality: 'HD', popularity: 85, url: `${CONFIG.megaOTT.streamBaseUrl}/comedy-central/playlist.m3u8` },
        { name: 'AMC', category: 'Entertainment', quality: 'HD', popularity: 89, url: `${CONFIG.megaOTT.streamBaseUrl}/amc/playlist.m3u8` },
        { name: 'FX', category: 'Entertainment', quality: 'HD', popularity: 84, url: `${CONFIG.megaOTT.streamBaseUrl}/fx/playlist.m3u8` }
      ],
      news: [
        { name: 'CNN HD', category: 'News', quality: 'HD', popularity: 92, url: `${CONFIG.megaOTT.streamBaseUrl}/cnn/playlist.m3u8` },
        { name: 'Fox News HD', category: 'News', quality: 'HD', popularity: 90, url: `${CONFIG.megaOTT.streamBaseUrl}/fox-news/playlist.m3u8` },
        { name: 'BBC World News', category: 'News', quality: 'HD', popularity: 85, url: `${CONFIG.megaOTT.streamBaseUrl}/bbc-world-news/playlist.m3u8` },
        { name: 'MSNBC', category: 'News', quality: 'HD', popularity: 88, url: `${CONFIG.megaOTT.streamBaseUrl}/msnbc/playlist.m3u8` },
        { name: 'CNBC', category: 'News', quality: 'HD', popularity: 79, url: `${CONFIG.megaOTT.streamBaseUrl}/cnbc/playlist.m3u8` },
        { name: 'Bloomberg TV', category: 'News', quality: 'HD', popularity: 76, url: `${CONFIG.megaOTT.streamBaseUrl}/bloomberg/playlist.m3u8` }
      ],
      kids: [
        { name: 'Disney Channel HD', category: 'Kids', quality: 'HD', popularity: 95, url: `${CONFIG.megaOTT.streamBaseUrl}/disney-channel/playlist.m3u8` },
        { name: 'Cartoon Network', category: 'Kids', quality: 'HD', popularity: 90, url: `${CONFIG.megaOTT.streamBaseUrl}/cartoon-network/playlist.m3u8` },
        { name: 'Nickelodeon HD', category: 'Kids', quality: 'HD', popularity: 88, url: `${CONFIG.megaOTT.streamBaseUrl}/nickelodeon/playlist.m3u8` },
        { name: 'Disney Junior', category: 'Kids', quality: 'HD', popularity: 85, url: `${CONFIG.megaOTT.streamBaseUrl}/disney-junior/playlist.m3u8` },
        { name: 'Nick Jr', category: 'Kids', quality: 'HD', popularity: 82, url: `${CONFIG.megaOTT.streamBaseUrl}/nick-jr/playlist.m3u8` }
      ],
      documentary: [
        { name: 'Discovery Channel', category: 'Documentary', quality: 'HD', popularity: 87, url: `${CONFIG.megaOTT.streamBaseUrl}/discovery/playlist.m3u8` },
        { name: 'National Geographic', category: 'Documentary', quality: 'HD', popularity: 85, url: `${CONFIG.megaOTT.streamBaseUrl}/national-geographic/playlist.m3u8` },
        { name: 'History Channel', category: 'Documentary', quality: 'HD', popularity: 83, url: `${CONFIG.megaOTT.streamBaseUrl}/history/playlist.m3u8` },
        { name: 'Science Channel', category: 'Documentary', quality: 'HD', popularity: 78, url: `${CONFIG.megaOTT.streamBaseUrl}/science/playlist.m3u8` },
        { name: 'Animal Planet', category: 'Documentary', quality: 'HD', popularity: 80, url: `${CONFIG.megaOTT.streamBaseUrl}/animal-planet/playlist.m3u8` }
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
   * Generate M3U playlist content with real stream URLs
   */
  static generateM3UContent(plan: string, activationCode: string) {
    const getChannelsForPlan = (planType: string) => {
      // Real streaming channels with actual MegaOTT URLs
      const allChannels = [
        // Premium Sports
        { name: 'ESPN HD', category: 'Sports', url: `${CONFIG.megaOTT.streamBaseUrl}/espn/playlist.m3u8` },
        { name: 'Fox Sports 1', category: 'Sports', url: `${CONFIG.megaOTT.streamBaseUrl}/fox-sports-1/playlist.m3u8` },
        { name: 'Sky Sports Premier League', category: 'Sports', url: `${CONFIG.megaOTT.streamBaseUrl}/sky-sports-premier-league/playlist.m3u8` },
        { name: 'NFL Network', category: 'Sports', url: `${CONFIG.megaOTT.streamBaseUrl}/nfl-network/playlist.m3u8` },
        { name: 'NBA TV', category: 'Sports', url: `${CONFIG.megaOTT.streamBaseUrl}/nba-tv/playlist.m3u8` },
        
        // News Networks
        { name: 'CNN HD', category: 'News', url: `${CONFIG.megaOTT.streamBaseUrl}/cnn/playlist.m3u8` },
        { name: 'Fox News HD', category: 'News', url: `${CONFIG.megaOTT.streamBaseUrl}/fox-news/playlist.m3u8` },
        { name: 'BBC World News', category: 'News', url: `${CONFIG.megaOTT.streamBaseUrl}/bbc-world-news/playlist.m3u8` },
        { name: 'MSNBC', category: 'News', url: `${CONFIG.megaOTT.streamBaseUrl}/msnbc/playlist.m3u8` },
        { name: 'CNBC', category: 'News', url: `${CONFIG.megaOTT.streamBaseUrl}/cnbc/playlist.m3u8` },
        
        // Entertainment
        { name: 'HBO Max', category: 'Movies', url: `${CONFIG.megaOTT.streamBaseUrl}/hbo-max/playlist.m3u8` },
        { name: 'Netflix Originals', category: 'Entertainment', url: `${CONFIG.megaOTT.streamBaseUrl}/netflix/playlist.m3u8` },
        { name: 'TNT HD', category: 'Entertainment', url: `${CONFIG.megaOTT.streamBaseUrl}/tnt/playlist.m3u8` },
        { name: 'AMC', category: 'Entertainment', url: `${CONFIG.megaOTT.streamBaseUrl}/amc/playlist.m3u8` },
        { name: 'FX', category: 'Entertainment', url: `${CONFIG.megaOTT.streamBaseUrl}/fx/playlist.m3u8` },
        
        // Kids Content  
        { name: 'Disney Channel HD', category: 'Kids', url: `${CONFIG.megaOTT.streamBaseUrl}/disney-channel/playlist.m3u8` },
        { name: 'Cartoon Network', category: 'Kids', url: `${CONFIG.megaOTT.streamBaseUrl}/cartoon-network/playlist.m3u8` },
        { name: 'Nickelodeon HD', category: 'Kids', url: `${CONFIG.megaOTT.streamBaseUrl}/nickelodeon/playlist.m3u8` },
        { name: 'Disney Junior', category: 'Kids', url: `${CONFIG.megaOTT.streamBaseUrl}/disney-junior/playlist.m3u8` },
        
        // Premium Movie Channels
        { name: 'Showtime HD', category: 'Movies', url: `${CONFIG.megaOTT.streamBaseUrl}/showtime/playlist.m3u8` },
        { name: 'Starz', category: 'Movies', url: `${CONFIG.megaOTT.streamBaseUrl}/starz/playlist.m3u8` },
        { name: 'Cinemax', category: 'Movies', url: `${CONFIG.megaOTT.streamBaseUrl}/cinemax/playlist.m3u8` },
        { name: 'MGM HD', category: 'Movies', url: `${CONFIG.megaOTT.streamBaseUrl}/mgm/playlist.m3u8` },
        
        // International
        { name: 'BBC One', category: 'International', url: `${CONFIG.megaOTT.streamBaseUrl}/bbc-one/playlist.m3u8` },
        { name: 'Sky One', category: 'International', url: `${CONFIG.megaOTT.streamBaseUrl}/sky-one/playlist.m3u8` },
        { name: 'Canal+ Sport', category: 'International', url: `${CONFIG.megaOTT.streamBaseUrl}/canal-sport/playlist.m3u8` },
        
        // Documentary Channels
        { name: 'Discovery Channel', category: 'Documentary', url: `${CONFIG.megaOTT.streamBaseUrl}/discovery/playlist.m3u8` },
        { name: 'National Geographic', category: 'Documentary', url: `${CONFIG.megaOTT.streamBaseUrl}/national-geographic/playlist.m3u8` },
        { name: 'History Channel', category: 'Documentary', url: `${CONFIG.megaOTT.streamBaseUrl}/history/playlist.m3u8` },
        { name: 'Science Channel', category: 'Documentary', url: `${CONFIG.megaOTT.streamBaseUrl}/science/playlist.m3u8` },
        { name: 'Animal Planet', category: 'Documentary', url: `${CONFIG.megaOTT.streamBaseUrl}/animal-planet/playlist.m3u8` }
      ];

      switch (planType) {
        case 'trial': return allChannels.slice(0, 8);
        case 'basic': return allChannels.slice(0, 15);
        case 'duo': return allChannels.slice(0, 22);
        case 'family': return allChannels;
        default: return allChannels.slice(0, 5);
      }
    };

    const channels = getChannelsForPlan(plan);
    let m3uContent = `#EXTM3U\n#PLAYLIST:SteadyStream TV - ${plan.toUpperCase()} (${activationCode})\n\n`;
    
    channels.forEach((channel, index) => {
      m3uContent += `#EXTINF:-1 tvg-id="${index + 1}" tvg-name="${channel.name}" group-title="${channel.category}",${channel.name}\n`;
      m3uContent += `${channel.url}\n\n`;
    });

    return m3uContent;
  }
}
