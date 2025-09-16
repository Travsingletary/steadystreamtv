export const AppConfig = {
    production: false,
    environment: 'WEB',
    version: require('../../package.json').version,
    BACKEND_URL: 'http://localhost:3333',
    NOWPAYMENTS_API_URL: 'https://api-sandbox.nowpayments.io/v1',
    NOWPAYMENTS_API_KEY: 'TMhut7sRBMcQ8achNXRTuFyutc9QT1DKfv',
    NOWPAYMENTS_IPN_SECRET: '241dd87f-e1de-44e0-8baf-787c42a6b8c8',
    SUPABASE_URL: 'https://ojueihcytxwcioqtvwez.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM',
    MEGAOTT_API_URL: 'https://megaott.net/api/v1',
    MEGAOTT_API_KEY: 'PduXXKv6Hi6M9xrstKEpXzmJ3WWBvZjigmr9opdg9c3c15af',
    MEGAOTT_USERNAME: 'IX5E3YZZ',
    MEGAOTT_PASSWORD: '2N1xXXid',
    // PAYCLY Card Payment Configuration
    PAYCLY_API_URL: 'https://sandbox.paycly.com/api/v1', // Sandbox for web testing
    PAYCLY_MERCHANT_ID: 'your_paycly_merchant_id', // Replace with actual PAYCLY credentials
    PAYCLY_API_KEY: 'your_paycly_api_key', // Replace with actual PAYCLY API key
    PAYCLY_SECRET_KEY: 'your_paycly_secret_key', // Replace with actual PAYCLY secret
};
