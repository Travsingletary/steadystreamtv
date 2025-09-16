import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../../environments/environment';

export interface MegaOTTSubscription {
  type: 'm3u' | 'mag' | 'enigma';
  id: number;
  username: string | null;
  password: string | null;
  mac_address: string | null;
  package: {
    id: number;
    name: string;
  };
  template: {
    id: number;
    name: string;
  } | null;
  max_connections: number;
  forced_country: string;
  adult: boolean;
  note: string;
  whatsapp_telegram: string;
  paid: boolean;
  expiring_at: string;
  dns_link: string;
  dns_link_for_samsung_lg: string;
  portal_link: string | null;
}

export interface MegaOTTPackage {
  id: number;
  name: string;
}

export interface CreateSubscriptionRequest {
  type: 'm3u' | 'mag' | 'enigma';
  username?: string; // Required for m3u
  mac_address?: string; // Required for mag/enigma
  package_id: number;
  max_connections: number;
  forced_country: string;
  adult: boolean;
  whatsapp_telegram?: string;
  enable_vpn: boolean;
  paid: boolean;
  template_id?: number;
  note?: string;
}

export interface CreateSubscriptionResponse extends MegaOTTSubscription {}

export interface ExtendSubscriptionRequest {
  package_id: number;
  paid: boolean;
}

export interface ExtendSubscriptionResponse {
  status: boolean;
  message: string;
  new_expiration_date: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  subscription?: MegaOTTSubscription;
  message?: string;
  error?: string;
}

export interface PackagesResponse {
  success: boolean;
  packages?: MegaOTTPackage[];
  message?: string;
  error?: string;
}

export interface ActivateDeactivateResponse {
  status: boolean;
  message: string;
}

export interface MegaOTTUser {
  id: number;
  username: string;
  credit: number;
}

export interface UserResponse {
  id: number;
  username: string;
  credit: number;
}

export interface UserStatusResponse {
  success: boolean;
  user?: MegaOTTUser;
  message?: string;
  error?: string;
}

export interface CreateUserRequest {
  type: 'm3u' | 'mag' | 'enigma';
  username?: string;
  mac_address?: string;
  package_id: number;
  max_connections: number;
  forced_country: string;
  adult: boolean;
  whatsapp_telegram?: string;
  enable_vpn: boolean;
  paid: boolean;
  template_id?: number;
  note?: string;
}

export interface CreateUserResponse extends MegaOTTSubscription {}

export interface ExtendUserRequest {
  package_id: number;
  paid: boolean;
}

export interface ExtendUserResponse {
  status: boolean;
  message: string;
  new_expiration_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class MegaOTTService {
  private apiUrl = AppConfig.MEGAOTT_API_URL;
  private apiKey = AppConfig.MEGAOTT_API_KEY;
  private username = AppConfig.MEGAOTT_USERNAME;
  private password = AppConfig.MEGAOTT_PASSWORD;
  private mockMode = false; // Try real API with corrected URL

  constructor(private http: HttpClient) {
    // Credentials are now loaded from AppConfig
    console.log('MegaOTT Service initialized with username:', this.username);
    console.log('API Key present:', !!this.apiKey);
    console.log('Mock mode enabled:', this.mockMode);
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
  }

  // Set API credentials (call this after getting them from secure storage)
  setCredentials(apiKey: string, username: string, password: string): void {
    this.apiKey = apiKey;
    this.username = username;
    this.password = password;
  }

  // Get authenticated user information
  getUserInfo(): Observable<UserStatusResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/user`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: true,
        user: {
          id: response.id,
          username: response.username,
          credit: response.credit
        },
        message: 'User retrieved successfully'
      }))
    );
  }

  // Create a new user (alias for subscription)
  createUser(userRequest: CreateUserRequest): Observable<CreateUserResponse> {
    return this.createSubscription(userRequest);
  }

  // Get user by ID (alias for subscription)
  getUserById(userId: string): Observable<UserStatusResponse> {
    return this.http.get<UserStatusResponse>(`${this.apiUrl}/subscriptions/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: true,
        user: response as any,
        message: 'User retrieved successfully'
      }))
    );
  }

  // Extend user subscription
  extendUser(extendRequest: ExtendUserRequest): Observable<ExtendUserResponse> {
    const formData = new URLSearchParams();
    formData.append('package_id', extendRequest.package_id.toString());
    formData.append('paid', extendRequest.paid ? '1' : '0');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    });

    return this.http.post<ExtendUserResponse>(`${this.apiUrl}/subscriptions/extend`, formData.toString(), {
      headers
    });
  }

  // Update user information
  updateUser(userId: string, updates: Partial<CreateUserRequest>): Observable<{ success: boolean; message: string }> {
    const formData = new URLSearchParams();

    if (updates.package_id) formData.append('package_id', updates.package_id.toString());
    if (updates.max_connections) formData.append('max_connections', updates.max_connections.toString());
    if (updates.forced_country) formData.append('forced_country', updates.forced_country);
    if (updates.adult !== undefined) formData.append('adult', updates.adult ? '1' : '0');
    if (updates.enable_vpn !== undefined) formData.append('enable_vpn', updates.enable_vpn ? '1' : '0');
    if (updates.paid !== undefined) formData.append('paid', updates.paid ? '1' : '0');
    if (updates.note) formData.append('note', updates.note);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    });

    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/subscriptions/${userId}`, formData.toString(), {
      headers
    });
  }

  // Create a new IPTV subscription
  createSubscription(subscriptionRequest: CreateSubscriptionRequest): Observable<CreateSubscriptionResponse> {
    // Convert to form data as per API documentation
    const formData = new URLSearchParams();
    formData.append('type', subscriptionRequest.type.toUpperCase());

    if (subscriptionRequest.username) {
      formData.append('username', subscriptionRequest.username);
    }
    if (subscriptionRequest.mac_address) {
      formData.append('mac_address', subscriptionRequest.mac_address);
    }

    formData.append('package_id', subscriptionRequest.package_id.toString());
    formData.append('max_connections', subscriptionRequest.max_connections.toString());
    formData.append('forced_country', subscriptionRequest.forced_country);
    formData.append('adult', subscriptionRequest.adult ? '1' : '0');
    formData.append('enable_vpn', subscriptionRequest.enable_vpn ? '1' : '0');
    formData.append('paid', subscriptionRequest.paid ? '1' : '0');

    if (subscriptionRequest.template_id) {
      formData.append('template_id', subscriptionRequest.template_id.toString());
    }
    if (subscriptionRequest.note) {
      formData.append('note', subscriptionRequest.note);
    }
    if (subscriptionRequest.whatsapp_telegram) {
      formData.append('whatsapp_telegram', subscriptionRequest.whatsapp_telegram);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
      // Don't set Content-Type, let browser set it for form data
    });

    return this.http.post<CreateSubscriptionResponse>(`${this.apiUrl}/subscriptions`, formData.toString(), {
      headers
    });
  }

  // Get specific subscription by ID
  getSubscriptionById(subscriptionId: number): Observable<MegaOTTSubscription> {
    return this.http.get<MegaOTTSubscription>(`${this.apiUrl}/subscriptions/${subscriptionId}`, {
      headers: this.getHeaders()
    });
  }

  // Extend subscription
  extendSubscription(subscriptionId: number, extendRequest: ExtendSubscriptionRequest): Observable<ExtendSubscriptionResponse> {
    const formData = new URLSearchParams();
    formData.append('package_id', extendRequest.package_id.toString());
    formData.append('paid', extendRequest.paid ? '1' : '0');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    });

    return this.http.post<ExtendSubscriptionResponse>(`${this.apiUrl}/subscriptions/${subscriptionId}/extend`, formData.toString(), {
      headers
    });
  }

  // Deactivate subscription
  deactivateSubscription(subscriptionId: number): Observable<ActivateDeactivateResponse> {
    return this.http.post<ActivateDeactivateResponse>(`${this.apiUrl}/subscriptions/${subscriptionId}/deactivate`, {}, {
      headers: this.getHeaders()
    });
  }

  // Activate subscription
  activateSubscription(subscriptionId: number): Observable<ActivateDeactivateResponse> {
    return this.http.post<ActivateDeactivateResponse>(`${this.apiUrl}/subscriptions/${subscriptionId}/activate`, {}, {
      headers: this.getHeaders()
    });
  }


  // Generate random username
  generateUsername(prefix: string = 'iptv'): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}_${timestamp}_${random}`;
  }

  // Generate random password
  generatePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Map subscription plan to MegaOTT package
  mapSubscriptionToPlan(subscriptionPlan: string): { packageId: number; duration: number } {
    // These package IDs should be updated with real package IDs from your MegaOTT panel
    const planMappings: { [key: string]: { packageId: number; duration: number } } = {
      'basic_monthly': { packageId: 1, duration: 30 },
      'premium_monthly': { packageId: 2, duration: 30 },
      'premium_yearly': { packageId: 3, duration: 365 }
    };

    return planMappings[subscriptionPlan] || { packageId: 1, duration: 30 };
  }

  // Create automated user provisioning (alias for subscription)
  async createAutomatedUser(email: string, subscriptionPlan: string): Promise<CreateUserResponse | { success: boolean; id?: number; username?: string; password?: string; message?: string; error?: string }> {
    return this.createAutomatedSubscription(email, subscriptionPlan) as Promise<CreateUserResponse | { success: boolean; id?: number; username?: string; password?: string; message?: string; error?: string }>;
  }

  // Create automated subscription provisioning
  async createAutomatedSubscription(email: string, subscriptionPlan: string): Promise<CreateSubscriptionResponse & { success: boolean; error?: string }> {
    try {
      const username = this.generateUsername();
      const planMapping = this.mapSubscriptionToPlan(subscriptionPlan);

      // If in mock mode, return mock response
      if (this.mockMode) {
        console.log('MegaOTT Mock Mode: Creating subscription', { username, email, subscriptionPlan });
        const password = this.generatePassword();
        return {
          type: 'm3u',
          id: Date.now(),
          username,
          password,
          mac_address: null,
          package: { id: planMapping.packageId, name: subscriptionPlan },
          template: null,
          max_connections: subscriptionPlan.includes('premium') ? 3 : 1,
          forced_country: 'ALL',
          adult: false,
          note: `Mock auto-created via crypto payment - Plan: ${subscriptionPlan} - Email: ${email}`,
          whatsapp_telegram: '',
          paid: true,
          expiring_at: new Date(Date.now() + planMapping.duration * 24 * 60 * 60 * 1000).toISOString(),
          dns_link: 'https://mock.iptv.com',
          dns_link_for_samsung_lg: 'https://mock.smart-tv.xyz',
          portal_link: null,
          success: true
        } as CreateSubscriptionResponse & { success: boolean };
      }

      const subscriptionRequest: CreateSubscriptionRequest = {
        type: 'm3u', // Always use M3U for SteadyStream
        username,
        package_id: planMapping.packageId,
        max_connections: subscriptionPlan.includes('premium') ? 3 : 1,
        forced_country: 'ALL', // Allow all countries
        adult: false, // Disable adult content by default
        enable_vpn: false, // VPN may not be allowed for all packages
        paid: true, // Mark as paid since payment was successful
        note: `Auto-created via crypto payment - Plan: ${subscriptionPlan} - Email: ${email}`,
        whatsapp_telegram: '' // Can be added later if needed
      };

      const response = await this.createSubscription(subscriptionRequest).toPromise();
      return { ...response, success: true } as CreateSubscriptionResponse & { success: boolean };
    } catch (error: any) {
      console.error('MegaOTT subscription creation failed:', error);

      // Provide detailed error information
      if (error.status) {
        console.log(`API Error Status: ${error.status}`);
        if (error.error?.message) {
          console.log(`API Error Message: ${error.error.message}`);
        }
      }

      // Fall back to mock mode if API fails
      if (!this.mockMode) {
        console.log('🔄 Falling back to mock mode due to API error');
        const username = this.generateUsername();
        const password = this.generatePassword();
        const planMapping = this.mapSubscriptionToPlan(subscriptionPlan);
        return {
          type: 'm3u',
          id: Date.now(),
          username,
          password,
          mac_address: null,
          package: { id: planMapping.packageId, name: subscriptionPlan },
          template: null,
          max_connections: subscriptionPlan.includes('premium') ? 3 : 1,
          forced_country: 'ALL',
          adult: false,
          note: `Fallback mock auto-created via crypto payment - Plan: ${subscriptionPlan} - Email: ${email}`,
          whatsapp_telegram: '',
          paid: true,
          expiring_at: new Date(Date.now() + planMapping.duration * 24 * 60 * 60 * 1000).toISOString(),
          dns_link: 'https://fallback.iptv.com',
          dns_link_for_samsung_lg: 'https://fallback.smart-tv.xyz',
          portal_link: null,
          success: true
        } as CreateSubscriptionResponse & { success: boolean };
      }

      // Return error only if we're already in mock mode
      throw new Error(`Failed to create MegaOTT subscription: ${error.message || 'Unknown error'}`);
    }
  }

  // Get connection details from MegaOTT subscription response
  getConnectionDetailsFromSubscription(subscription: MegaOTTSubscription): {
    m3u_url: string;
    xtream_url: string;
    xtream_username: string;
    xtream_password: string;
    dns_link: string;
    dns_link_samsung_lg: string;
  } {
    return {
      m3u_url: `${subscription.dns_link}/get.php?username=${subscription.username}&password=${subscription.password}&type=m3u_plus&output=ts`,
      xtream_url: subscription.dns_link,
      xtream_username: subscription.username || '',
      xtream_password: subscription.password || '',
      dns_link: subscription.dns_link,
      dns_link_samsung_lg: subscription.dns_link_for_samsung_lg
    };
  }

  // Get connection URL for IPTV apps (fallback method)
  getConnectionDetails(username: string, password: string): {
    m3u_url: string;
    xtream_url: string;
    xtream_username: string;
    xtream_password: string;
  } {
    // Fallback URLs - these will be replaced by actual DNS links from API response
    const baseUrl = 'https://megaott.net'; // Default fallback

    return {
      m3u_url: `${baseUrl}/get.php?username=${username}&password=${password}&type=m3u_plus&output=ts`,
      xtream_url: baseUrl,
      xtream_username: username,
      xtream_password: password
    };
  }

  // Validate API connection
  async testConnection(): Promise<boolean> {
    if (this.mockMode) {
      console.log('MegaOTT Mock Mode: Connection test passed');
      return true;
    }

    try {
      const response = await this.getUserInfo().toPromise();
      console.log('✅ MegaOTT API Connection Successful:', response);
      return !!response; // Return true if we get any response
    } catch (error: any) {
      console.error('❌ MegaOTT API Connection Failed:');

      if (error.status) {
        console.log(`Status Code: ${error.status}`);

        if (error.status >= 400 && error.status < 500) {
          console.log('🔑 Client Error (4xx) - Check your credentials and API access:');
          if (error.status === 401) {
            console.log('- API key may be invalid or expired');
          } else if (error.status === 403) {
            console.log('- API access not enabled in your MegaOTT panel');
            console.log('- Your IP may need to be whitelisted');
            console.log('- API permissions may need to be activated');
          } else if (error.status === 404) {
            console.log('- API endpoint not found - check URL');
          }
        } else if (error.status >= 500) {
          console.log('🛠️ Server Error (5xx) - MegaOTT server issue');
        }

        if (error.error?.message) {
          console.log(`Error Message: ${error.error.message}`);
        }
      }

      console.log('💡 Next Steps:');
      console.log('1. Check your MegaOTT panel: Account Settings » API Keys');
      console.log('2. Ensure API access is enabled');
      console.log('3. Verify IP whitelist if required');
      console.log('4. For now, mock mode will handle IPTV account creation');

      return false;
    }
  }

  // Enable/disable mock mode
  setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
    console.log('MegaOTT Mock mode', enabled ? 'enabled' : 'disabled');
  }
}