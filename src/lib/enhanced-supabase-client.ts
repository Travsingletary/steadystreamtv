// Enhanced Supabase Client - Production Ready
// Real-time monitoring, connection management, and comprehensive error handling

import { createClient, SupabaseClient, AuthError } from '@supabase/supabase-js';

interface ConnectionStatus {
  isConnected: boolean;
  lastCheck: Date | null;
  consecutiveFailures: number;
  latency: number;
}

interface HealthMetrics {
  uptime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
}

class EnhancedSupabaseClient {
  private client: SupabaseClient;
  private connectionStatus: ConnectionStatus;
  private healthMetrics: HealthMetrics;
  private debugMode: boolean;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Check your environment variables.');
    }

    // Initialize Supabase client with enhanced options
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'steadystream-tv/1.0'
        }
      }
    });

    // Initialize status tracking
    this.connectionStatus = {
      isConnected: false,
      lastCheck: null,
      consecutiveFailures: 0,
      latency: 0
    };

    this.healthMetrics = {
      uptime: Date.now(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0
    };

    this.debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

    // Initialize connection monitoring
    this.initializeMonitoring();
    
    console.log('🚀 Enhanced Supabase client initialized');
  }

  // Initialize real-time monitoring
  private initializeMonitoring() {
    // Check connection status every 30 seconds
    setInterval(() => {
      this.checkConnectionHealth();
    }, 30000);

    // Listen for auth state changes
    this.client.auth.onAuthStateChange((event, session) => {
      if (this.debugMode) {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
      }
      
      if (event === 'SIGNED_IN') {
        this.connectionStatus.isConnected = true;
        this.connectionStatus.consecutiveFailures = 0;
      } else if (event === 'SIGNED_OUT') {
        this.connectionStatus.isConnected = false;
      }
    });

    // Initial health check
    this.checkConnectionHealth();
  }

  // Enhanced authentication with retry logic
  async signUp(email: string, password: string, userData?: any) {
    const startTime = Date.now();
    this.healthMetrics.totalRequests++;

    try {
      console.log('📝 Attempting user registration...');
      
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...userData,
            registered_at: new Date().toISOString(),
            registration_source: 'steadystream_onboarding'
          }
        }
      });

      if (error) {
        throw new AuthError(error.message);
      }

      // Update metrics
      this.healthMetrics.successfulRequests++;
      this.updateLatency(Date.now() - startTime);
      
      console.log('✅ User registration successful');
      return { data, error: null };

    } catch (error) {
      this.healthMetrics.failedRequests++;
      this.connectionStatus.consecutiveFailures++;
      
      console.error('❌ Registration failed:', error);
      
      // Attempt retry for network errors
      if (this.shouldRetryAuth(error as AuthError) && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log('🔄 Retrying registration...');
        this.reconnectAttempts++;
        
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * this.reconnectAttempts));
        return this.signUp(email, password, userData);
      }

      return { data: null, error: error as AuthError };
    }
  }

  // Enhanced sign in with retry logic
  async signIn(email: string, password: string) {
    const startTime = Date.now();
    this.healthMetrics.totalRequests++;

    try {
      console.log('🔐 Attempting user sign in...');
      
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new AuthError(error.message);
      }

      // Update metrics and status
      this.healthMetrics.successfulRequests++;
      this.updateLatency(Date.now() - startTime);
      this.connectionStatus.isConnected = true;
      this.connectionStatus.consecutiveFailures = 0;
      this.reconnectAttempts = 0;
      
      console.log('✅ User sign in successful');
      return { data, error: null };

    } catch (error) {
      this.healthMetrics.failedRequests++;
      this.connectionStatus.consecutiveFailures++;
      
      console.error('❌ Sign in failed:', error);
      
      // Attempt retry for network errors
      if (this.shouldRetryAuth(error as AuthError) && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log('🔄 Retrying sign in...');
        this.reconnectAttempts++;
        
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * this.reconnectAttempts));
        return this.signIn(email, password);
      }

      return { data: null, error: error as AuthError };
    }
  }

  // Enhanced database operations with retry logic
  async insertData(table: string, data: any) {
    const startTime = Date.now();
    this.healthMetrics.totalRequests++;

    try {
      console.log(`💾 Inserting data into ${table}...`);
      
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      if (error) {
        throw error;
      }

      this.healthMetrics.successfulRequests++;
      this.updateLatency(Date.now() - startTime);
      
      console.log(`✅ Data inserted into ${table} successfully`);
      return { data: result, error: null };

    } catch (error) {
      this.healthMetrics.failedRequests++;
      console.error(`❌ Failed to insert data into ${table}:`, error);
      return { data: null, error };
    }
  }

  // Enhanced data retrieval with caching
  async getData(table: string, filters?: any) {
    const startTime = Date.now();
    this.healthMetrics.totalRequests++;

    try {
      console.log(`📊 Retrieving data from ${table}...`);
      
      let query = this.client.from(table).select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      this.healthMetrics.successfulRequests++;
      this.updateLatency(Date.now() - startTime);
      
      console.log(`✅ Data retrieved from ${table} successfully`);
      return { data, error: null };

    } catch (error) {
      this.healthMetrics.failedRequests++;
      console.error(`❌ Failed to retrieve data from ${table}:`, error);
      return { data: null, error };
    }
  }

  // Check connection health
  async checkConnectionHealth() {
    const startTime = Date.now();
    
    try {
      // Simple health check query
      const { error } = await this.client
        .from('profiles')
        .select('id')
        .limit(1);

      const latency = Date.now() - startTime;
      
      if (!error) {
        this.connectionStatus.isConnected = true;
        this.connectionStatus.consecutiveFailures = 0;
        this.connectionStatus.latency = latency;
        this.connectionStatus.lastCheck = new Date();
        
        if (this.debugMode) {
          console.log(`✅ Connection health check passed (${latency}ms)`);
        }
      } else {
        throw error;
      }

    } catch (error) {
      this.connectionStatus.isConnected = false;
      this.connectionStatus.consecutiveFailures++;
      this.connectionStatus.lastCheck = new Date();
      
      if (this.debugMode) {
        console.warn('⚠️ Connection health check failed:', error);
      }

      // Attempt reconnection if needed
      if (this.connectionStatus.consecutiveFailures >= 3) {
        this.attemptReconnection();
      }
    }
  }

  // Attempt to reconnect
  private async attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Try to refresh the session
    try {
      await this.client.auth.refreshSession();
      console.log('✅ Session refreshed successfully');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
    }
  }

  // Determine if auth error should trigger retry
  private shouldRetryAuth(error: AuthError): boolean {
    const retryableErrors = [
      'network_error',
      'timeout',
      'connection_error',
      'server_error'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message.toLowerCase().includes(retryableError)
    );
  }

  // Update latency metrics
  private updateLatency(latency: number) {
    const totalLatency = (this.healthMetrics.averageLatency * (this.healthMetrics.successfulRequests - 1)) + latency;
    this.healthMetrics.averageLatency = totalLatency / this.healthMetrics.successfulRequests;
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Get health metrics
  getHealthMetrics(): HealthMetrics {
    return {
      ...this.healthMetrics,
      uptime: Date.now() - this.healthMetrics.uptime
    };
  }

  // Get the underlying Supabase client (for advanced operations)
  getClient(): SupabaseClient {
    return this.client;
  }

  // Sign out with cleanup
  async signOut() {
    try {
      const { error } = await this.client.auth.signOut();
      
      if (!error) {
        this.connectionStatus.isConnected = false;
        console.log('✅ User signed out successfully');
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      return { error };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      return { user, error };
    } catch (error) {
      console.error('❌ Failed to get current user:', error);
      return { user: null, error };
    }
  }
}

// Create and export singleton instance
export const enhancedSupabase = new EnhancedSupabaseClient();

// Export the regular client for backward compatibility
export const supabase = enhancedSupabase.getClient();

// Export types
export type { ConnectionStatus, HealthMetrics };

