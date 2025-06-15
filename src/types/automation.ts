
// =====================================
// UNIFIED TYPE DEFINITIONS
// =====================================
export interface UnifiedUserData {
  name: string;
  email: string;
  password: string;
  plan: 'trial' | 'solo' | 'duo' | 'family';
  deviceType?: 'firestick' | 'android' | 'ios' | 'web';
}

export interface IPTVCredentials {
  username: string;
  password: string;
  serverUrl: string;
  activationCode?: string;
  playlistUrl: string;
  expiresAt: string;
}

export interface RegistrationResult {
  success: boolean;
  user?: any;
  credentials?: IPTVCredentials;
  error?: string;
}
