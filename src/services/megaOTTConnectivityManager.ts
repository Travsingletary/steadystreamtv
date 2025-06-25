
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
    { url: 'http://xtream-codes.org/player_api.php', region: 'primary' },
    { url: 'http://api.xtream-codes.com/player_api.php', region: 'backup' },
    { url: 'http://panel.xtream-codes.com/player_api.php', region: 'alternate' },
    { url: 'http://xtream.codes/player_api.php', region: 'fallback' }
  ];

  private static endpointHealth: Map<string, EndpointHealth> = new Map();
  private static cache: Map<string, CachedResponse> = new Map();
  private static userLocation: UserLocation | null = null;

  // Detect user location for regional optimization
  static async detectUserLocation(): Promise<UserLocation> {
    if (this.userLocation) return this.userLocation;

    try {
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

  // Test endpoint health with improved testing
  static async testEndpointHealth(endpoint: string): Promise<EndpointHealth> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // Use GET request first for basic connectivity test
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const health: EndpointHealth = {
        url: endpoint,
        region: this.getEndpointRegion(endpoint),
        status: response.status < 500 ? 
          (responseTime < 1500 ? 'online' : 'slow') : 'offline',
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

  // Get best available endpoint based on health
  static async getBestEndpoint(): Promise<string> {
    const location = await this.detectUserLocation();
    
    // Test all endpoints quickly
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

    // Fallback to primary endpoint even if it appears offline
    console.warn('⚠️ No healthy endpoints found, using primary fallback');
    return this.endpoints[0].url;
  }

  // Enhanced caching with TTL
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
    
    this.cleanupCache();
  }

  // Intelligent retry with exponential backoff
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    baseDelay: number = 500
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt === maxRetries) break;

        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
        console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Generate user-friendly error messages
  static getLocationAwareErrorMessage(error: any, userLocation: UserLocation): string {
    const region = userLocation.region || 'unknown';
    
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return `Network connectivity issue detected. System is using local fallback mode.`;
    }
    
    if (error.message?.includes('timeout')) {
      return `Service is responding slowly. Switching to optimized endpoints.`;
    }
    
    if (error.message?.includes('404') || error.message?.includes('502')) {
      return `IPTV service is temporarily unavailable. Local fallback mode is active.`;
    }
    
    return `Temporary service issue detected. System is operating in fallback mode.`;
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
    if (endpoint.includes('xtream-codes.org')) return 'primary';
    if (endpoint.includes('api.xtream-codes')) return 'backup';
    if (endpoint.includes('panel.xtream-codes')) return 'alternate';
    if (endpoint.includes('xtream.codes')) return 'fallback';
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
    const totalCount = this.endpoints.length;
    
    return {
      overall: onlineCount > 0 ? 'connected' : 'disconnected',
      endpoints: healthData,
      onlineCount,
      totalCount,
      cacheSize: this.cache.size,
      userLocation: this.userLocation,
      enhanced: true
    };
  }
}
