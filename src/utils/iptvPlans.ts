
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
  // Monthly Plans
  {
    id: 'basic',
    name: 'Basic Monthly',
    price: '$9.99/mo',
    priceId: 'price_1234567890',
    features: ['1000+ Channels', 'HD Quality', '1 Connection', 'Basic Support'],
    packageId: 1
  },
  {
    id: 'premium',
    name: 'Premium Monthly',
    price: '$19.99/mo',
    priceId: 'price_1234567891',
    features: ['2500+ Channels', 'HD & 4K Quality', '2 Connections', 'VOD Library'],
    packageId: 2,
    popular: true
  },
  {
    id: 'ultimate',
    name: 'Ultimate Monthly',
    price: '$29.99/mo',
    priceId: 'price_1234567892',
    features: ['5000+ Channels', 'HD & 4K Quality', '3 Connections', 'Adult Content'],
    packageId: 3
  },
  // Annual Plans (1 Year)
  {
    id: 'basic-annual',
    name: 'Basic Annual',
    price: '$99.99/year',
    priceId: 'price_annual_basic',
    features: ['1000+ Channels', 'HD Quality', '1 Connection', 'Basic Support', '2 Months FREE'],
    packageId: 11
  },
  {
    id: 'premium-annual',
    name: 'Premium Annual',
    price: '$199.99/year',
    priceId: 'price_annual_premium',
    features: ['2500+ Channels', 'HD & 4K Quality', '2 Connections', 'VOD Library', '2 Months FREE'],
    packageId: 12,
    popular: true
  },
  {
    id: 'ultimate-annual',
    name: 'Ultimate Annual',
    price: '$299.99/year',
    priceId: 'price_annual_ultimate',
    features: ['5000+ Channels', 'HD & 4K Quality', '3 Connections', 'Adult Content', '2 Months FREE'],
    packageId: 13
  }
];
