
export class PlaylistOptimizer {
  static generateOptimizedM3U(userPreferences: any, deviceType: string, baseUrl: string) {
    // Get channels based on user preferences
    const channels = this.getOptimizedChannels(userPreferences, deviceType);
    
    let m3uContent = '#EXTM3U\n';
    m3uContent += `#EXTINF:-1 group-title="SteadyStream TV",Welcome to SteadyStream TV\n`;
    m3uContent += `${baseUrl}\n`;
    
    // Add optimized channels
    channels.forEach(channel => {
      const optimizedUrl = this.optimizeStreamUrl(channel.streamUrl, deviceType);
      m3uContent += `#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo}" group-title="${channel.category}",${channel.name}\n`;
      m3uContent += `${optimizedUrl}\n`;
    });
    
    return {
      m3uContent,
      channelCount: channels.length,
      deviceOptimized: true,
      recommendations: this.getDeviceRecommendations(deviceType)
    };
  }
  
  static getOptimizedChannels(preferences: any, deviceType: string) {
    // Premium channel list optimized for each device type
    const allChannels = [
      { id: 'espn1', name: 'ESPN', category: 'Sports', quality: 'HD', streamUrl: 'http://stream.steadystream.tv/espn', logo: 'https://cdn.steadystream.tv/logos/espn.png' },
      { id: 'cnn1', name: 'CNN', category: 'News', quality: 'HD', streamUrl: 'http://stream.steadystream.tv/cnn', logo: 'https://cdn.steadystream.tv/logos/cnn.png' },
      { id: 'hbo1', name: 'HBO', category: 'Movies', quality: '4K', streamUrl: 'http://stream.steadystream.tv/hbo', logo: 'https://cdn.steadystream.tv/logos/hbo.png' },
      { id: 'fox1', name: 'FOX Sports', category: 'Sports', quality: 'HD', streamUrl: 'http://stream.steadystream.tv/fox', logo: 'https://cdn.steadystream.tv/logos/fox.png' },
      { id: 'disc1', name: 'Discovery', category: 'Entertainment', quality: 'HD', streamUrl: 'http://stream.steadystream.tv/discovery', logo: 'https://cdn.steadystream.tv/logos/discovery.png' },
      { id: 'nfl1', name: 'NFL Network', category: 'Sports', quality: '4K', streamUrl: 'http://stream.steadystream.tv/nfl', logo: 'https://cdn.steadystream.tv/logos/nfl.png' },
      { id: 'netflix1', name: 'Netflix Originals', category: 'Movies', quality: '4K', streamUrl: 'http://stream.steadystream.tv/netflix', logo: 'https://cdn.steadystream.tv/logos/netflix.png' },
      { id: 'disney1', name: 'Disney Channel', category: 'Kids', quality: 'HD', streamUrl: 'http://stream.steadystream.tv/disney', logo: 'https://cdn.steadystream.tv/logos/disney.png' }
    ];
    
    // Filter by user preferences
    let filteredChannels = allChannels;
    if (preferences?.categories && preferences.categories.length > 0) {
      filteredChannels = allChannels.filter(channel => 
        preferences.categories.includes(channel.category)
      );
    }
    
    // Sort by device capability
    return filteredChannels.sort((a, b) => {
      const qualityPriority = { '4K': 4, 'HD': 3, 'SD': 2 };
      const deviceMaxQuality = this.getDeviceMaxQuality(deviceType);
      
      const aScore = Math.min(qualityPriority[a.quality] || 2, qualityPriority[deviceMaxQuality]);
      const bScore = Math.min(qualityPriority[b.quality] || 2, qualityPriority[deviceMaxQuality]);
      
      return bScore - aScore;
    });
  }
  
  static optimizeStreamUrl(baseUrl: string, deviceType: string) {
    const params = new URLSearchParams();
    
    // Device-specific optimizations
    switch (deviceType) {
      case 'firestick':
        params.append('buffer', '3');
        params.append('quality', 'auto');
        params.append('decoder', 'hardware');
        break;
      case 'android':
        params.append('buffer', '5');
        params.append('quality', 'best');
        params.append('cache', 'enabled');
        break;
      case 'ios':
        params.append('buffer', '2');
        params.append('hls', '1');
        params.append('quality', 'adaptive');
        break;
      case 'smart-tv':
        params.append('buffer', '4');
        params.append('quality', '4k');
        params.append('decoder', 'hardware');
        break;
      default:
        params.append('buffer', '3');
        params.append('quality', 'auto');
    }
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  static getDeviceMaxQuality(deviceType: string) {
    const deviceCapabilities = {
      'firestick': 'HD',
      'android': '4K', 
      'ios': '4K',
      'smart-tv': '4K',
      'web': 'HD'
    };
    return deviceCapabilities[deviceType] || 'HD';
  }
  
  static getDeviceRecommendations(deviceType: string) {
    const recommendations = {
      'firestick': [
        'Download TiviMate from aftv.news/1592817',
        'Use 5GHz WiFi for best performance',
        'Enable hardware acceleration in settings',
        'Clear cache if experiencing buffering'
      ],
      'android': [
        'TiviMate Premium recommended for best features',
        'Enable background refresh for smooth channel switching',
        'Use external storage for recordings if available',
        'Configure gesture controls for easier navigation'
      ],
      'ios': [
        'GSE SMART IPTV works great on iOS devices',
        'Enable cellular backup for uninterrupted streaming',
        'Use AirPlay to cast to your TV',
        'Configure notifications for your favorite shows'
      ],
      'smart-tv': [
        'Smart IPTV app available in most TV app stores',
        'Use ethernet connection for most stable experience',
        'Enable auto-refresh to keep channels updated',
        'Set resolution to match your TV capabilities'
      ],
      'web': [
        'Use Chrome or Safari for best compatibility',
        'Enable hardware acceleration in browser settings',
        'Close other tabs to free up memory',
        'Use fullscreen mode for better experience'
      ]
    };
    
    return recommendations[deviceType] || recommendations['android'];
  }
  
  static createDownloadableM3U(m3uContent: string): string {
    const blob = new Blob([m3uContent], { type: 'application/x-mpegURL' });
    return URL.createObjectURL(blob);
  }
}
