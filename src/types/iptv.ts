
export interface IPTVFormData {
  name: string;
  email: string;
  country: string;
  phone: string;
  planType: string;
}

export interface IPTVCredentials {
  username: string;
  password: string;
  server_url: string;
  playlist_url: string;
  max_connections: number;
  expiration_date: string;
}

export interface IPTVPlan {
  id: string;
  name: string;
  price: string;
  priceId: string;
  features: string[];
  packageId: number;
  popular?: boolean;
  isTrial?: boolean;
}
