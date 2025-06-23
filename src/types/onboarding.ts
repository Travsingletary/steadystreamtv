
export interface OnboardingUserData {
  full_name: string;
  email: string;
  password?: string;
  preferredDevice: string;
  genres: string[];
  subscription: {
    plan: string;
    price: number;
    trialDays: number;
    trialEndDate?: string;
  } | null;
  xtreamCredentials?: {
    username: string;
    password: string;
    playlistUrl?: string;
  };
}
