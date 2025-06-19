
import { IPTVPlan } from '@/types/iptv';

export const iptvPlans: IPTVPlan[] = [
  {
    id: 'free-trial',
    name: 'Free Trial',
    price: 'FREE',
    priceId: 'free_trial',
    features: ['24-Hour Full Access', '1000+ Channels', 'HD Quality', '1 Connection'],
    packageId: 0,
    isTrial: true
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    price: '$9.99',
    priceId: 'price_1234567890',
    features: ['1000+ Channels', 'HD Quality', '1 Connection', 'Basic Support'],
    packageId: 1
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: '$19.99',
    priceId: 'price_1234567891',
    features: ['2500+ Channels', 'HD & 4K Quality', '2 Connections', 'VOD Library'],
    packageId: 2,
    popular: true
  },
  {
    id: 'ultimate',
    name: 'Ultimate Plan',
    price: '$29.99',
    priceId: 'price_1234567892',
    features: ['5000+ Channels', 'HD & 4K Quality', '3 Connections', 'Adult Content'],
    packageId: 3
  }
];
