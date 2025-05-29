
export interface OnboardingUserData {
  name: string;
  email: string;
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
