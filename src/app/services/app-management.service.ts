import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../../environments/environment';

export interface AppInfo {
  id: string;
  name: string;
  version: string;
  versionCode: number;
  downloadUrl: string;
  downloadCode?: string;
  adminPanelUrl?: string;
  fileSize: number;
  releaseDate: string;
  changelog: string[];
  isActive: boolean;
  platform: 'android' | 'ios' | 'web';
  minimumSystemVersion: string;
  packageName: string;
}

export interface AppDownloadRequest {
  userId: string;
  deviceInfo?: {
    model: string;
    os: string;
    version: string;
  };
}

export interface AppDownloadResponse {
  success: boolean;
  downloadUrl: string;
  downloadCode?: string;
  configurationUrl?: string;
  deepLink?: string;
  qrCode?: string;
  instructions: string[];
  error?: string;
}

export interface AppConfiguration {
  m3uUrl: string;
  xtreamUrl: string;
  username: string;
  password: string;
  epgUrl?: string;
  logoUrl?: string;
  userAgent?: string;
  customHeaders?: { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class AppManagementService {
  private apiUrl = AppConfig.BACKEND_URL;
  private currentAppInfo$ = new BehaviorSubject<AppInfo | null>(null);

  // Your rebranded TiviMate app details
  private steadyStreamApp: AppInfo = {
    id: 'steadystream-tivimate',
    name: 'SteadyStream TV',
    version: '1.0.0',
    versionCode: 1,
    downloadUrl: 'https://aftv.news/1592817',
    downloadCode: '1592817',
    adminPanelUrl: 'https://gangstageeks.com/tivimate/rs6/steady/',
    fileSize: 45 * 1024 * 1024, // Estimated 45MB
    releaseDate: new Date().toISOString(),
    changelog: [
      'Custom SteadyStream branding',
      'Optimized for SteadyStream IPTV service',
      'Enhanced user experience',
      'Pre-configured for instant setup'
    ],
    isActive: true,
    platform: 'android',
    minimumSystemVersion: '5.0',
    packageName: 'com.steadystream.tv'
  };

  constructor(private http: HttpClient) {
    this.currentAppInfo$.next(this.steadyStreamApp);
  }

  // Get current app information
  getAppInfo(): Observable<AppInfo> {
    return this.currentAppInfo$.asObservable();
  }

  // Generate download response for authenticated user
  generateDownloadResponse(userId: string, iptvCredentials: any): AppDownloadResponse {
    const deepLink = this.generateDeepLink(iptvCredentials);
    const configUrl = this.generateConfigurationUrl(userId);

    return {
      success: true,
      downloadUrl: this.steadyStreamApp.downloadUrl,
      downloadCode: this.steadyStreamApp.downloadCode,
      configurationUrl: configUrl,
      deepLink: deepLink,
      qrCode: this.generateQRCodeUrl(deepLink),
      instructions: [
        '1. Download the SteadyStream TV app using the link above',
        '2. Enable "Install from Unknown Sources" in your Android settings',
        '3. Install the downloaded APK file',
        '4. Open the app and scan the QR code below for instant setup',
        '5. Or manually enter your M3U URL and credentials',
        '6. Start streaming your favorite content!'
      ]
    };
  }

  // Generate deep link for auto-configuration
  private generateDeepLink(credentials: any): string {
    const params = new URLSearchParams({
      action: 'configure',
      m3u_url: credentials.m3u_url || '',
      xtream_url: credentials.xtream_url || '',
      username: credentials.username || '',
      password: credentials.password || '',
      epg_url: credentials.epg_url || '',
      service: 'steadystream'
    });

    return `steadystream://config?${params.toString()}`;
  }

  // Generate configuration URL for web-based setup
  private generateConfigurationUrl(userId: string): string {
    const configId = btoa(`${userId}-${Date.now()}`);
    return `${window.location.origin}/app-config/${configId}`;
  }

  // Generate QR code URL
  private generateQRCodeUrl(data: string): string {
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&format=png&color=000000&bgcolor=ffffff&margin=10`;
  }

  // Create app configuration object
  generateAppConfiguration(iptvCredentials: any): AppConfiguration {
    return {
      m3uUrl: iptvCredentials.m3u_url || '',
      xtreamUrl: iptvCredentials.xtream_url || '',
      username: iptvCredentials.username || '',
      password: iptvCredentials.password || '',
      epgUrl: iptvCredentials.epg_url || '',
      logoUrl: 'https://your-cdn.com/logos/',
      userAgent: 'SteadyStream TV/1.0.0',
      customHeaders: {
        'X-Service': 'SteadyStream',
        'X-Platform': 'Android'
      }
    };
  }

  // Download tracking (for analytics)
  trackDownload(userId: string, deviceInfo?: any): Observable<any> {
    const downloadData = {
      userId,
      appId: this.steadyStreamApp.id,
      downloadedAt: new Date().toISOString(),
      deviceInfo: deviceInfo || {},
      platform: 'android'
    };

    // In a real implementation, you'd send this to your analytics service
    console.log('📱 App download tracked:', downloadData);

    return new Observable(observer => {
      observer.next({ success: true, tracked: true });
      observer.complete();
    });
  }

  // Check for app updates
  checkForUpdates(currentVersion: string): Observable<{ hasUpdate: boolean; latestVersion?: AppInfo }> {
    return this.getAppInfo().pipe(
      map(appInfo => {
        const hasUpdate = this.isNewerVersion(appInfo.version, currentVersion);
        return {
          hasUpdate,
          latestVersion: hasUpdate ? appInfo : undefined
        };
      })
    );
  }

  // Version comparison utility
  private isNewerVersion(latest: string, current: string): boolean {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  }

  // Get admin panel credentials (for internal use)
  getAdminPanelInfo(): { url: string; username: string; password: string } {
    return {
      url: 'https://gangstageeks.com/tivimate/rs6/steady/',
      username: 'SteadyBoss',
      password: 'Skyhigh123'
    };
  }

  // Generate installation instructions
  getInstallationInstructions(): string[] {
    return [
      '📱 Android Installation Guide:',
      '',
      '1. Download the SteadyStream TV app',
      '   • Use the download link provided',
      '   • Or enter code 1592817 at aftv.news',
      '',
      '2. Enable Unknown Sources:',
      '   • Go to Settings > Security',
      '   • Enable "Unknown Sources" or "Install from Unknown Sources"',
      '   • For newer Android: Settings > Apps > Special Access > Install Unknown Apps',
      '',
      '3. Install the App:',
      '   • Locate the downloaded APK file',
      '   • Tap to install and follow prompts',
      '   • If you see the old icon, clear app cache',
      '',
      '4. Configure IPTV:',
      '   • Open SteadyStream TV app',
      '   • Scan the QR code from your dashboard',
      '   • Or manually enter your M3U URL and credentials',
      '',
      '5. Start Streaming:',
      '   • Browse channels and enjoy!',
      '   • Use EPG for program guide',
      '   • Create favorites and playlists'
    ];
  }

  // Validate app compatibility
  validateDeviceCompatibility(deviceInfo: any): { compatible: boolean; issues: string[] } {
    const issues: string[] = [];

    if (deviceInfo.platform !== 'android') {
      issues.push('This app is only available for Android devices');
    }

    if (deviceInfo.androidVersion && parseFloat(deviceInfo.androidVersion) < 5.0) {
      issues.push('Android 5.0 or higher is required');
    }

    if (deviceInfo.architecture && !['arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'].includes(deviceInfo.architecture)) {
      issues.push('Unsupported device architecture');
    }

    return {
      compatible: issues.length === 0,
      issues
    };
  }
}