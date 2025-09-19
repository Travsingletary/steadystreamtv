# Deployment Debug Checklist

## Environment Variables to Add in Loveable/Hosting Platform:

```
VITE_SUPABASE_URL=https://ojueihcytxwcioqtvwez.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM
VITE_NOWPAYMENTS_API_KEY=GWY1RNA-CDXMZ35-M326YDF-JC660RR
VITE_NOWPAYMENTS_TEST_MODE=false
VITE_APP_ENV=production
VITE_PAYMENT_PROCESSOR=nowpayments
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_DVR=true
VITE_ENABLE_RECOMMENDATIONS=true
VITE_ENABLE_MOBILE_FEATURES=true
```

## Supabase Configuration:
1. Go to Supabase Dashboard → Settings → API
2. Add your live domain to "Site URL"
3. Add to "Additional redirect URLs"

## NOWPayments Configuration:
1. Update IPN callback URL to your live domain
2. Update success/cancel URLs

## Common Issues:
- CORS errors = Supabase domain issue
- Payment fails = Environment variables missing
- Account creation fails = RLS policies or missing env vars
- "Network error" = API keys not loaded

## Quick Test:
Open browser console (F12) on live site and run:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Payment API:', import.meta.env.VITE_NOWPAYMENTS_API_KEY);
```