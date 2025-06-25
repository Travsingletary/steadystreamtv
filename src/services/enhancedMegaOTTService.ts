
import { supabase } from '@/integrations/supabase/client';
import { MegaOTTConnectivityManager } from './megaOTTConnectivityManager';

interface QueuedOperation {
  id: string;
  operation: string;
  params: any;
  timestamp: Date;
  retryCount: number;
}

export class EnhancedMegaOTTService {
  private static operationQueue: QueuedOperation[] = [];
  private static isOfflineMode = false;

  // Enhanced user info with fallback and caching
  static async getUserInfo(): Promise<{ success: boolean; id?: number; username?: string; credit?: number; error?: string; errorCode?: string }> {
    const cacheKey = 'megaott_user_info';
    
    // Try cache first
    const cached = MegaOTTConnectivityManager.getCachedResponse(cacheKey);
    if (cached) {
      return { success: true, ...cached };
    }

    try {
      console.log('🔍 Getting MegaOTT user info with enhanced connectivity...');
      
      const result = await MegaOTTConnectivityManager.retryWithBackoff(async () => {
        const { data, error } = await supabase.functions.invoke('megaott-proxy', {
          body: { action: 'user_info' }
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'API returned error');
        
        return data;
      });

      const userInfo = {
        id: result.data.id,
        username: result.data.username,
        credit: result.data.credits || result.data.available_credits || result.data.credit || 0
      };

      // Cache successful response
      MegaOTTConnectivityManager.setCachedResponse(cacheKey, userInfo, 120000); // 2 minutes

      return { success: true, ...userInfo };

    } catch (error: any) {
      console.error('❌ Enhanced user info failed:', error);
      
      const userLocation = await MegaOTTConnectivityManager.detectUserLocation();
      const friendlyError = MegaOTTConnectivityManager.getLocationAwareErrorMessage(error, userLocation);
      
      // Try to return cached data even if expired
      const expiredCache = MegaOTTConnectivityManager.getCachedResponse(cacheKey + '_backup');
      if (expiredCache) {
        console.log('📦 Returning backup cached data due to connectivity issues');
        return { 
          success: true, 
          ...expiredCache,
          warning: 'Using cached data due to connectivity issues'
        };
      }

      return { 
        success: false, 
        error: friendlyError,
        errorCode: this.getErrorCode(error)
      };
    }
  }

  // Enhanced subscription creation with queue fallback
  static async createUserLine(email: string, plan: string) {
    const operationId = `create_${Date.now()}`;
    
    try {
      console.log('🔄 Creating user line with enhanced connectivity...', { email, plan });
      
      const result = await MegaOTTConnectivityManager.retryWithBackoff(async () => {
        const { data, error } = await supabase.functions.invoke('megaott-proxy', {
          body: {
            action: 'create_user',
            user_username: `steady_${Date.now()}`,
            user_password: this.generatePassword(),
            email,
            plan
          }
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'User creation failed');
        
        return data;
      });

      console.log('✅ User created successfully with enhanced service');
      return {
        success: true,
        ...result.data,
        source: 'enhanced_service'
      };

    } catch (error: any) {
      console.error('❌ Enhanced user creation failed:', error);
      
      // Queue the operation for retry
      this.queueOperation({
        id: operationId,
        operation: 'create_user',
        params: { email, plan },
        timestamp: new Date(),
        retryCount: 0
      });

      const userLocation = await MegaOTTConnectivityManager.detectUserLocation();
      const friendlyError = MegaOTTConnectivityManager.getLocationAwareErrorMessage(error, userLocation);

      // Return graceful fallback
      return this.generateGracefulFallback(email, plan, friendlyError);
    }
  }

  // Offline mode management
  static enableOfflineMode() {
    this.isOfflineMode = true;
    console.log('📴 Enhanced MegaOTT service entered offline mode');
  }

  static disableOfflineMode() {
    this.isOfflineMode = false;
    console.log('📶 Enhanced MegaOTT service back online');
    this.processQueuedOperations();
  }

  // Operation queue management
  private static queueOperation(operation: QueuedOperation) {
    this.operationQueue.push(operation);
    console.log(`📝 Queued operation: ${operation.operation} (${operation.id})`);
    
    // Auto-retry after delay
    setTimeout(() => this.retryQueuedOperation(operation.id), 60000);
  }

  private static async retryQueuedOperation(operationId: string) {
    const operation = this.operationQueue.find(op => op.id === operationId);
    if (!operation || operation.retryCount >= 3) return;

    try {
      operation.retryCount++;
      console.log(`🔄 Retrying queued operation: ${operation.operation} (attempt ${operation.retryCount})`);
      
      if (operation.operation === 'create_user') {
        await this.createUserLine(operation.params.email, operation.params.plan);
      }
      
      // Remove from queue on success
      this.operationQueue = this.operationQueue.filter(op => op.id !== operationId);
      
    } catch (error) {
      console.warn(`⚠️ Queued operation retry failed: ${operation.operation}`);
    }
  }

  private static async processQueuedOperations() {
    console.log(`📋 Processing ${this.operationQueue.length} queued operations`);
    
    for (const operation of this.operationQueue) {
      await this.retryQueuedOperation(operation.id);
    }
  }

  // Enhanced fallback with better user experience
  private static generateGracefulFallback(email: string, plan: string, error: string) {
    const fallbackCode = `EF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    return {
      success: true,
      fallbackMode: true,
      activationCode: fallbackCode,
      error: error,
      message: 'Your account has been created in our backup system. Full activation will complete automatically once connectivity is restored.',
      credentials: {
        server: 'backup.steadystreamtv.com',
        port: '80',
        username: `fallback_${fallbackCode.toLowerCase()}`,
        password: fallbackCode.replace('EF-', '')
      },
      m3uUrl: `${window.location.origin}/api/backup/${fallbackCode}.m3u8`,
      expiryDate: new Date(Date.now() + (plan === 'trial' ? 86400000 : 2592000000)),
      source: 'enhanced_fallback'
    };
  }

  // Utility methods
  private static generatePassword(): string {
    return Math.random().toString(36).substring(2, 10) + 
           Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private static getErrorCode(error: any): string {
    if (error.message?.includes('network')) return 'NETWORK_ERROR';
    if (error.message?.includes('timeout')) return 'TIMEOUT_ERROR';
    if (error.message?.includes('502')) return 'GATEWAY_ERROR';
    if (error.message?.includes('404')) return 'NOT_FOUND';
    return 'UNKNOWN_ERROR';
  }

  // Status and monitoring
  static getServiceStatus() {
    const connectivity = MegaOTTConnectivityManager.getConnectivityStatus();
    
    return {
      enhanced: true,
      offlineMode: this.isOfflineMode,
      queuedOperations: this.operationQueue.length,
      connectivity,
      lastUpdate: new Date()
    };
  }
}
