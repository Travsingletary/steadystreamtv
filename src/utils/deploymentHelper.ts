
// Deployment configuration and utilities for SteadyStream TV

export const DEPLOYMENT_CONFIG = {
  production: {
    domain: 'steadystreamtv.com',
    supabaseUrl: 'https://ojueihcytxwcioqtvwez.supabase.co',
    stripePublishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
    environment: 'production'
  },
  staging: {
    domain: 'staging.steadystreamtv.com',
    supabaseUrl: 'https://ojueihcytxwcioqtvwez.supabase.co',
    stripePublishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
    environment: 'staging'
  }
};

export const getDeploymentConfig = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'steadystreamtv.com') {
    return DEPLOYMENT_CONFIG.production;
  } else if (hostname.includes('staging')) {
    return DEPLOYMENT_CONFIG.staging;
  } else {
    // Development
    return {
      domain: 'localhost:5173',
      supabaseUrl: 'https://ojueihcytxwcioqtvwez.supabase.co',
      stripePublishableKey: 'pk_test_...',
      environment: 'development'
    };
  }
};

export const validateEnvironmentVariables = () => {
  const required = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY',
    'REACT_APP_STRIPE_PUBLISHABLE_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    return false;
  }
  
  return true;
};

// Deployment checklist
export const DEPLOYMENT_CHECKLIST = {
  backend: [
    'Supabase project configured',
    'Database tables created',
    'Edge functions deployed',
    'Secrets configured (Stripe, MegaOTT, etc.)',
    'RLS policies enabled'
  ],
  frontend: [
    'Build optimized for production',
    'Environment variables set',
    'Domain configured',
    'SSL certificate active'
  ],
  integrations: [
    'Stripe webhooks configured',
    'MegaOTT API integration tested',
    'Email service (Resend) configured',
    'Analytics tracking active'
  ],
  testing: [
    'User registration flow tested',
    'Payment processing tested',
    'Playlist generation tested',
    'Email automation tested',
    'Admin dashboard functional'
  ]
};

export const logDeploymentStatus = () => {
  const config = getDeploymentConfig();
  console.log('🚀 SteadyStream TV Deployment Status');
  console.log('Environment:', config.environment);
  console.log('Domain:', config.domain);
  console.log('Supabase URL:', config.supabaseUrl);
  console.log('Environment variables valid:', validateEnvironmentVariables());
};
