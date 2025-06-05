
// src/services/types.ts
// Shared type definitions for all services

export interface UserData {
  name: string;
  email: string;
  password: string;
  plan: 'trial' | 'basic' | 'duo' | 'family' | 'standard' | 'premium' | 'ultimate';
  deviceType: string;
  preferences: {
    favoriteGenres: string[];
    parentalControls: boolean;
    autoOptimization: boolean;
    videoQuality: string;
  };
}

export interface RegistrationResult {
  success: boolean;
  user?: any;
  assets?: {
    activationCode: string;
    playlistToken: string;
    playlistUrl: string;
    qrCodeUrl: string;
  };
  playlistOptimization?: {
    channels: any[];
    totalOptimized: number;
    recommendation: string;
  };
  subscription?: {
    success: boolean;
    plan: string;
    megaottId?: string;
    credentials?: {
      username: string;
      password: string;
    };
  };
  userData?: UserData;
  error?: string;
}
