
interface EndpointHealth {
  url: string;
  region: string;
  status: 'online' | 'offline' | 'slow';
  responseTime: number;
  lastChecked: Date;
}

interface UserLocation {
  country?: string;
  region?: string;
  timezone?: string;
}

interface CachedResponse {
  data: any;
  timestamp: Date;
  ttl: number;
  endpoint: string;
}

export class MegaOTTConnectivityManager {
  private static endpoints = [
    { url: 'https://megaott.net/player_api.php', region: 'primary' },
    { url: 'https://api.megaott.net/player_api.php', region: 'backup' },
    { url: 'https://megaott.com/player_api.php', region: 'alternate' }
  ];

  private static endpointHealth: Map<string, EndpointHealth> = new Map();
  private static cache: Map<string, CachedResponse> = new Map();
  private static userLocation: UserLocation | null = null;

  // Detect user location for regional optimization
  static async detectUserLocation(): Promise<UserLocation> {
    if (this.userLocation) return this.userLocation;

    try {
      // Use timezone as a fallback location indicator
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const region = this.getRegionFromTimezone(timezone);

      this.userLocation = { timezone, region };
      console.log('📍 User location detected:', this.userLocation);
      
      return this.userLocation;
    } catch (error) {
      console.warn('⚠️ Location detection failed:', error);
      return { region: 'unknown' };
    }
  }

  // Test endpoint health with regional awareness
  static async testEndpointHealth(endpoint: string): Promise<EndpointHealth> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'username=test&password=test&action=get_user_info',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const health: EndpointHealth = {
        url: endpoint,
        region: this.getEndpointRegion(endpoint),
        status: response.ok ? (responseTime < 2000 ? 'online' : 'slow') : 'offline',
        responseTime,
        lastChecked: new Date()
      };

      this.endpointHealth.set(endpoint, health);
      return health;

    } catch (error) {
      const health: EndpointHealth = {
        url: endpoint,
        region: this.getEndpointRegion(endpoint),
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };

      this.endpointHealth.set(endpoint, health);
      return health;
    }
  }

  // Get best available endpoint based on health and location
  static async getBestEndpoint(): Promise<string> {
    const location = await this.detectUserLocation();
    
    // Test all endpoints if we don't have recent health data
    const healthPromises = this.endpoints.map(ep => 
      this.testEndpointHealth(ep.url)
    );
    
    const healthResults = await Promise.allSettled(healthPromises);
    const availableEndpoints = healthResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as any).value)
      .filter(health => health.status !== 'offline')
      .sort((a, b) => {
        // Prioritize by region match, then by response time
        const aRegionMatch = a.region === location.region ? 0 : 1;
        const bRegionMatch = b.region === location.region ? 0 : 1;
        
        if (aRegionMatch !== bRegionMatch) {
          return aRegionMatch - bRegionMatch;
        }
        
        return a.responseTime - b.responseTime;
      });

    if (availableEndpoints.length > 0) {
      const bestEndpoint = availableEndpoints[0].url;
      console.log(`🎯 Selected best endpoint: ${bestEndpoint} (${availableEndpoints[0].responseTime}ms)`);
      return bestEndpoint;
    }

    // Fallback to primary endpoint
    console.warn('⚠️ No healthy endpoints found, using primary fallback');
    return this.endpoints[0].url;
  }

  // Enhanced caching with TTL and endpoint awareness
  static getCachedResponse(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp.getTime();
    if (age > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`💾 Cache hit for ${key} (age: ${Math.round(age / 1000)}s)`);
    return cached.data;
  }

  static setCachedResponse(key: string, data: any, ttl: number = 300000, endpoint: string = 'unknown'): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl,
      endpoint
    });
    
    // Clean up old cache entries
    this.cleanupCache();
  }

  // Intelligent retry with exponential backoff
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt === maxRetries) break;

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Generate user-friendly error messages based on location and issue type
  static getLocationAwareErrorMessage(error: any, userLocation: UserLocation): string {
    const region = userLocation.region || 'unknown';
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return `Network connectivity issue detected in ${region}. This may be due to DNS propagation delays. Please try again in a few minutes.`;
    }
    
    if (error.message?.includes('timeout')) {
      return `Service is responding slowly in your region (${region}). We're automatically switching to a faster server.`;
    }
    
    if (error.message?.includes('404') || error.message?.includes('502')) {
      return `MegaOTT service is temporarily unavailable in your region. Our system is working to restore connectivity.`;
    }
    
    return `Temporary service issue detected. Our intelligent system is finding the best connection for your location.`;
  }

  // Utility methods
  private static getRegionFromTimezone(timezone: string): string {
    if (timezone.startsWith('America/')) return 'americas';
    if (timezone.startsWith('Europe/')) return 'europe';
    if (timezone.startsWith('Asia/')) return 'asia';
    if (timezone.startsWith('Africa/')) return 'africa';
    if (timezone.startsWith('Australia/') || timezone.startsWith('Pacific/')) return 'oceania';
    return 'unknown';
  }

  private static getEndpointRegion(endpoint: string): string {
    if (endpoint.includes('megaott.net')) return 'primary';
    if (endpoint.includes('api.megaott')) return 'backup';
    if (endpoint.includes('megaott.com')) return 'alternate';
    return 'unknown';
  }

  private static cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      const age = now - cached.timestamp.getTime();
      if (age > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get connectivity status report
  static getConnectivityStatus() {
    const healthData = Array.from(this.endpointHealth.values());
    const onlineCount = healthData.filter(h => h.status === 'online').length;
    const totalCount = healthData.length;
    
    return {
      overall: onlineCount > 0 ? 'connected' : 'disconnected',
      endpoints: healthData,
      onlineCount,
      totalCount,
      cacheSize: this.cache.size,
      userLocation: this.userLocation
    };
  }
}
