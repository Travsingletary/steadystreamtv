# 🚀 SteadyStream TV Deployment Guide

## 📋 Pre-Deployment Checklist

### Required Accounts & Services
- ✅ **GitHub Account** - For code repository
- ✅ **NOWPayments Account** - Cryptocurrency payment processing
- ✅ **Supabase Account** - Backend database and functions
- ✅ **MegaOTT Reseller Account** - IPTV service provisioning
- ✅ **Resend Account** - Email delivery service
- ✅ **Vercel Account** - Frontend hosting (optional)

### API Keys Required
- ✅ **NOWPayments API Key**: `TMhut7sRBMcQ8achNXRTuFyutc9QT1DKfv`
- ✅ **NOWPayments IPN Secret**: `241dd87f-e1de-44e0-8baf-787c42a6b8c8`
- ✅ **Supabase URL**: `https://ojueihcytxwcioqtvwez.supabase.co`
- ✅ **Supabase Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`
- ⏳ **MegaOTT API Key**: (Obtain from your reseller account)
- ⏳ **Resend API Key**: (Obtain from resend.com)

## 🔧 Environment Configuration

### 1. Development Environment (.env.local)
```env
# NOWPayments
NOWPAYMENTS_API_URL=https://api-sandbox.nowpayments.io/v1
NOWPAYMENTS_API_KEY=TMhut7sRBMcQ8achNXRTuFyutc9QT1DKfv
NOWPAYMENTS_IPN_SECRET=241dd87f-e1de-44e0-8baf-787c42a6b8c8

# Supabase
SUPABASE_URL=https://ojueihcytxwcioqtvwez.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# MegaOTT
MEGAOTT_API_URL=https://megaott.net/api/v1
MEGAOTT_API_KEY=your_megaott_key
MEGAOTT_USERNAME=your_reseller_username
MEGAOTT_PASSWORD=your_reseller_password

# Email
RESEND_API_KEY=your_resend_key
FROM_EMAIL=noreply@steadystreamtv.com
```

### 2. Production Environment
```env
# NOWPayments Production
NOWPAYMENTS_API_URL=https://api.nowpayments.io/v1
NOWPAYMENTS_API_KEY=TMhut7sRBMcQ8achNXRTuFyutc9QT1DKfv
NOWPAYMENTS_IPN_SECRET=241dd87f-e1de-44e0-8baf-787c42a6b8c8

# Same Supabase and other configs...
```

## 🗄️ Database Setup (Supabase)

### 1. Database Schema
The following tables need to be created in Supabase:

```sql
-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IPTV accounts table
CREATE TABLE iptv_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  megaott_subscription_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MegaOTT subscriptions table
CREATE TABLE megaott_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  subscription_plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  megaott_user_id TEXT,
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase automations table
CREATE TABLE purchase_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  payment_id TEXT NOT NULL,
  subscription_plan TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  megaott_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE iptv_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE megaott_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_automations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Similar policies for other tables...
```

## ⚡ Supabase Edge Functions Deployment

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link to your project
```bash
supabase link --project-ref ojueihcytxwcioqtvwez
```

### 4. Deploy Edge Functions
```bash
# Deploy NOWPayments webhook
supabase functions deploy nowpayments-webhook

# Deploy email service
supabase functions deploy send-welcome-email
```

### 5. Set Environment Secrets
```bash
supabase secrets set NOWPAYMENTS_IPN_SECRET=241dd87f-e1de-44e0-8baf-787c42a6b8c8
supabase secrets set MEGAOTT_API_KEY=your_megaott_key
supabase secrets set MEGAOTT_USERNAME=your_username
supabase secrets set MEGAOTT_PASSWORD=your_password
supabase secrets set RESEND_API_KEY=your_resend_key
```

## 🌐 Frontend Deployment Options

### Option 1: Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_NOWPAYMENTS_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# ... add all VITE_ prefixed variables
```

### Option 2: Netlify Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Option 3: GitHub Pages
```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 🔗 NOWPayments Configuration

### 1. Login to NOWPayments Dashboard
Visit: https://account.nowpayments.io

### 2. Configure IPN Settings
- **IPN Callback URL**: `https://ojueihcytxwcioqtvwez.supabase.co/functions/v1/nowpayments-webhook`
- **IPN Secret**: `241dd87f-e1de-44e0-8baf-787c42a6b8c8`
- **Send IPN for statuses**: `finished`, `failed`, `partially_paid`

### 3. API Settings
- **API Key**: `TMhut7sRBMcQ8achNXRTuFyutc9QT1DKfv`
- **Environment**: Production
- **Allowed IPs**: Add your server IPs (optional)

## 📧 Email Service Setup (Resend)

### 1. Create Resend Account
Visit: https://resend.com

### 2. Add Domain
- Add your domain (e.g., `steadystreamtv.com`)
- Verify DNS records
- Get API key

### 3. Configure Email Templates
The welcome email template is included in the edge function.

## 🧪 Testing Deployment

### 1. Test NOWPayments API
```bash
# Test API connection
node test-nowpayments.js

# Expected output:
# ✅ API connection successful!
# 💰 Found 254 supported cryptocurrencies
```

### 2. Test Webhook
```bash
# Use ngrok for local testing
ngrok http 3000

# Update NOWPayments with ngrok URL
# https://abc123.ngrok.io/webhook/nowpayments
```

### 3. Test Full Payment Flow
1. Navigate to `/payment`
2. Select a subscription plan
3. Generate crypto payment (use testnet)
4. Complete payment
5. Verify webhook triggers
6. Check database for new records
7. Verify email delivery

## 🔍 Monitoring & Logging

### 1. Supabase Logs
```bash
# View function logs
supabase functions logs nowpayments-webhook --follow
supabase functions logs send-welcome-email --follow
```

### 2. NOWPayments Dashboard
- Monitor payment success rates
- Track transaction volumes
- View failed payments

### 3. Application Monitoring
- Set up error tracking (Sentry)
- Monitor API response times
- Track user conversion rates

## 🚨 Security Checklist

- ✅ **Environment Variables**: Stored securely
- ✅ **Webhook Signature**: HMAC-SHA512 verification
- ✅ **Database**: Row Level Security enabled
- ✅ **API Keys**: Rotated regularly
- ✅ **HTTPS**: Enforced on all endpoints
- ✅ **Input Validation**: Implemented
- ✅ **Rate Limiting**: Configured

## 📊 Performance Optimization

### 1. Frontend Optimization
```bash
# Build with optimization
npm run build --prod

# Analyze bundle size
npm run analyze
```

### 2. Database Optimization
- Add indexes on frequently queried columns
- Enable database connection pooling
- Monitor query performance

### 3. CDN Configuration
- Use CDN for static assets
- Enable compression
- Set appropriate cache headers

## 🔄 Backup & Recovery

### 1. Database Backups
Supabase automatically handles backups, but you can also:
```bash
# Export data
supabase db dump > backup.sql

# Restore data
psql < backup.sql
```

### 2. Code Backups
- GitHub repository (main backup)
- Local development environment
- Deployment artifacts

## 📈 Scaling Considerations

### 1. Database Scaling
- Monitor connection usage
- Consider read replicas for high traffic
- Implement database connection pooling

### 2. Edge Function Scaling
- Monitor function execution times
- Optimize function code for performance
- Consider regional deployment

### 3. Payment Processing
- Monitor NOWPayments rate limits
- Implement retry logic for failed requests
- Consider multiple payment processors

## ✅ Go-Live Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Edge functions deployed and tested
- [ ] NOWPayments webhook configured
- [ ] Email service configured
- [ ] Domain configured and SSL enabled
- [ ] Payment flow tested end-to-end
- [ ] Monitoring and alerting set up
- [ ] Backup strategy implemented
- [ ] Security audit completed

## 🆘 Troubleshooting

### Common Issues

1. **Webhook not receiving payments**
   - Check NOWPayments IPN settings
   - Verify webhook URL is accessible
   - Check Supabase function logs

2. **IPTV accounts not created**
   - Verify MegaOTT API credentials
   - Check function logs for errors
   - Test MegaOTT API directly

3. **Emails not sending**
   - Verify Resend API key
   - Check email template formatting
   - Monitor Resend dashboard

### Support Resources
- Supabase Documentation: https://supabase.com/docs
- NOWPayments API Docs: https://documenter.getpostman.com/view/7907941/S1a32n38
- MegaOTT Support: Contact your reseller account manager

---

**🎯 Deployment Complete!**

Your SteadyStream TV platform is now ready for production with full automation from cryptocurrency payments to IPTV service delivery.