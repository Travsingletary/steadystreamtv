
import { supabase } from '@/integrations/supabase/client';

interface DeviceInstructions {
  name: string;
  description: string;
  steps: string[];
  tips?: string[];
  icon?: string;
  features?: string[];
}

export class CrossDeviceSetup {
  static generateActivationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Enhanced to support app type
  static async createPairingCode(userData: any, deviceType: string, appType?: string): Promise<string> {
    const code = this.generateActivationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      const { error } = await supabase
        .from('device_pairings')
        .insert({
          pairing_code: code,
          user_id: userData.user?.id || userData.id,
          subscription_id: userData.subscriptionId || 'pending',
          device_type: deviceType,
          app_type: appType || 'standard',
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (error) {
        throw new Error('Failed to create pairing code');
      }

      return code;
    } catch (error) {
      console.error('Error creating pairing code:', error);
      throw error;
    }
  }

  // New method: Get Fire TV app options
  static getFireTVAppOptions() {
    return {
      tivimate_branded: {
        name: 'SteadyStream TV (TiviMate)',
        shortName: 'TiviMate Version',
        description: 'Proven, reliable IPTV player with SteadyStream branding',
        downloadCode: '1592817',
        downloadUrl: 'aftv.news/1592817',
        icon: '⚡',
        category: 'reliable',
        features: [
          'Familiar TiviMate interface',
          'Rock-solid streaming performance', 
          'Advanced EPG support',
          'Recording & DVR capabilities',
          'Proven stability & reliability',
          'Instant channel switching'
        ],
        steps: [
          'On your Firestick, go to "Find" → "Search"',
          'Search for "Downloader" and install it',
          'Open Downloader and enter code: 1592817',
          'Download and install SteadyStream TV (TiviMate)',
          'Open the app',
          'Select "Add Playlist" or "Link Account"',
          'Choose "M3U Playlist"',
          'Enter the activation code shown on this page',
          'Start streaming immediately!'
        ],
        benefits: [
          '✅ Fastest setup (2-3 minutes)',
          '✅ Most reliable streaming',
          '✅ Familiar interface for IPTV users',
          '✅ Advanced features like recording'
        ],
        tips: [
          'Use your Firestick remote to navigate',
          'The app will remember your login',
          'Recording works on compatible streams'
        ]
      },
      custom_ai: {
        name: 'SteadyStream TV (AI Enhanced)',
        shortName: 'AI Enhanced',
        description: 'Next-gen IPTV app with AI recommendations and smart features',
        downloadCode: 'BETA',
        downloadUrl: 'steadystreamtv.com/ai-app',
        icon: '🤖',
        category: 'innovative',
        features: [
          'AI-powered content recommendations',
          'Smart channel suggestions based on viewing',
          'Personalized home screen',
          'Advanced search and discovery',
          'Modern, intuitive interface',
          'Continuous feature updates'
        ],
        steps: [
          'Visit steadystreamtv.com/ai-app on your phone/computer',
          'Download the SteadyStream AI Enhanced APK',
          'Transfer to your Firestick using instructions provided',
          'Install the APK on your Firestick',
          'Open SteadyStream TV AI Enhanced',
          'Select "Link Account" or "Enter Code"',
          'Enter the activation code shown on this page',
          'Enjoy AI-enhanced streaming experience!'
        ],
        benefits: [
          '🤖 AI learns your preferences',
          '🎯 Smart content discovery',
          '✨ Cutting-edge features',
          '🚀 Regular feature updates'
        ],
        tips: [
          'AI recommendations improve over time',
          'Use voice search for best results',
          'Report issues to help us improve'
        ]
      }
    };
  }

  // Enhanced device instructions with app type support
  static getDeviceInstructions(deviceType: string, appType?: string): DeviceInstructions | null {
    if (deviceType === 'firestick' && appType) {
      const appOptions = this.getFireTVAppOptions();
      return appOptions[appType as keyof typeof appOptions];
    }

    // Standard device instructions for non-Fire TV devices
    const standardInstructions: Record<string, DeviceInstructions> = {
      apple_tv: {
        name: 'Apple TV',
        description: 'Apple TV 4K, Apple TV HD',
        icon: '📺',
        features: [
          'High-quality streaming',
          'Easy setup and navigation',
          'Reliable performance'
        ],
        steps: [
          'On your Apple TV, open the App Store',
          'Search for "SteadyStream TV"',
          'Download and install the app',
          'Open SteadyStream TV',
          'Select "Link Account"',
          'Enter the activation code from this page',
          'Enjoy streaming on your Apple TV!'
        ],
        tips: [
          'Use your Apple TV remote or iPhone as remote',
          'Make sure you\'re signed in to your Apple ID',
          'Enable AirPlay for easy phone casting'
        ]
      },
      android_tv: {
        name: 'Android TV / Smart TV',
        description: 'Sony, Samsung, LG Smart TVs',
        icon: '📺',
        features: [
          'High-quality streaming',
          'Easy setup and navigation',
          'Reliable performance'
        ],
        steps: [
          'On your Android TV, open Google Play Store',
          'Search for "SteadyStream TV"',
          'Install the app',
          'Open SteadyStream TV',
          'Select "Activate Device"',
          'Enter the code from this page',
          'Start watching your favorite content!'
        ],
        tips: [
          'Use your TV remote or phone as remote',
          'The app supports 4K streaming',
          'Enable voice search for easier navigation'
        ]
      }
    };

    return standardInstructions[deviceType] || null;
  }

  // Validation method (for TV app use)
  static async validatePairingCode(code: string) {
    try {
      const { data, error } = await supabase
        .from('device_pairings')
        .select('*')
        .eq('pairing_code', code)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to validate pairing code:', error);
      return null;
    }
  }
}
