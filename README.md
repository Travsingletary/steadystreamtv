# 🚀 SteadyStream TV - Automated IPTV Onboarding Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

## 📺 About

SteadyStream TV is a fully automated IPTV subscription platform that accepts cryptocurrency payments and automatically provisions IPTV accounts. Built with modern technologies and complete automation from payment to service delivery.

### ✨ Key Features

- 🪙 **Cryptocurrency Payments** - Accept 300+ cryptocurrencies via NOWPayments
- 🤖 **Full Automation** - Zero manual intervention from payment to IPTV activation
- 📺 **MegaOTT Integration** - Automated IPTV account provisioning
- 💳 **Low Fees** - 0.5% payment processing vs traditional 3%+
- ⚡ **Instant Delivery** - IPTV credentials delivered within minutes
- 📊 **Real-time Dashboard** - Subscription management and monitoring
- 📧 **Automated Emails** - Welcome emails with setup instructions
- 🔒 **Secure** - Enterprise-grade security with Supabase

## 🏗️ Architecture

```
Frontend (Angular/React) → NOWPayments API → Webhook → Supabase → MegaOTT API → Email Service
```

### Tech Stack

- **Frontend**: Angular 19 / React (Lovable compatible)
- **Backend**: Supabase (Database + Edge Functions)
- **Payments**: NOWPayments (Cryptocurrency processing)
- **IPTV**: MegaOTT Reseller API
- **Email**: Resend API
- **Hosting**: Vercel / Supabase

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- NOWPayments account
- Supabase project
- MegaOTT reseller account

### Installation

```bash
# Clone the repository
git clone https://github.com/Travsingletary/steadystreamtv.git
cd steadystreamtv

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run serve
```

### Environment Variables

```env
# NOWPayments Configuration
NOWPAYMENTS_API_URL=https://api.nowpayments.io/v1
NOWPAYMENTS_API_KEY=TMhut7sRBMcQ8achNXRTuFyutc9QT1DKfv
NOWPAYMENTS_IPN_SECRET=241dd87f-e1de-44e0-8baf-787c42a6b8c8

# Supabase Configuration
SUPABASE_URL=https://ojueihcytxwcioqtvwez.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM

# MegaOTT Configuration
MEGAOTT_API_URL=https://megaott.net/api/v1
MEGAOTT_API_KEY=your_megaott_key
MEGAOTT_USERNAME=your_reseller_username
MEGAOTT_PASSWORD=your_reseller_password
```

## 💳 Subscription Plans

| Plan | Price | Duration | Features |
|------|-------|----------|----------|
| Basic Monthly | $9.99 | 30 days | 1000+ channels, HD quality, 1 connection |
| Premium Monthly | $19.99 | 30 days | 5000+ channels, 4K quality, 3 connections, VOD |
| Premium Yearly | $199.99 | 365 days | 5000+ channels, 4K quality, 3 connections, VOD, 2 months free |

## 🔄 Automation Flow

1. **User visits** `/payment` and selects subscription plan
2. **Payment created** via NOWPayments API with crypto address
3. **User pays** with Bitcoin, Ethereum, USDT, or 300+ other cryptocurrencies
4. **Webhook triggered** when payment is confirmed
5. **User account created** in Supabase database
6. **IPTV account provisioned** via MegaOTT API
7. **Welcome email sent** with M3U URL and Xtream codes
8. **Dashboard updated** with active subscription and credentials

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── payment/                    # Payment form & processing
│   │   │   └── subscription-dashboard/     # User dashboard
│   │   ├── services/
│   │   │   ├── payment.service.ts          # NOWPayments integration
│   │   │   ├── supabase.service.ts         # Database operations
│   │   │   ├── megaott.service.ts          # IPTV provisioning
│   │   │   ├── automation.service.ts       # End-to-end automation
│   │   │   └── webhook.service.ts          # Webhook handling
│   │   └── environments/                   # Environment configs
│   └── assets/                             # Static assets
├── supabase/
│   ├── functions/
│   │   ├── nowpayments-webhook/           # Payment webhook handler
│   │   └── send-welcome-email/            # Email automation
│   └── migrations/                        # Database schema
├── docs/                                  # Documentation
├── LOVABLE_INTEGRATION.md                 # Lovable setup guide
└── lovable-config.json                    # Lovable configuration
```

## 🔧 API Configuration

### NOWPayments Setup
- **API Key**: `TMhut7sRBMcQ8achNXRTuFyutc9QT1DKfv`
- **IPN Secret**: `241dd87f-e1de-44e0-8baf-787c42a6b8c8`
- **Webhook URL**: `https://ojueihcytxwcioqtvwez.supabase.co/functions/v1/nowpayments-webhook`

### Supabase Project
- **URL**: `https://ojueihcytxwcioqtvwez.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🎨 Frontend Routes

- `/` - Landing page with service overview
- `/payment` - Subscription selection and payment
- `/subscription` - User dashboard and account management
- `/payment/success` - Payment confirmation
- `/payment/cancel` - Payment cancellation

## 🔒 Security Features

- ✅ **Webhook signature verification** (HMAC-SHA512)
- ✅ **Environment variable protection**
- ✅ **Supabase Row Level Security (RLS)**
- ✅ **API key rotation support**
- ✅ **Input validation and sanitization**
- ✅ **Secure credential storage**

## 🚀 Deployment

### GitHub Repository Setup

```bash
# Add remote origin
git remote add origin https://github.com/Travsingletary/steadystreamtv.git

# Push to GitHub
git add .
git commit -m "Initial SteadyStream TV implementation"
git push -u origin main
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add NOWPAYMENTS_API_KEY
vercel env add SUPABASE_URL
# ... add all required env vars
```

### Supabase Functions

```bash
# Deploy webhook function
supabase functions deploy nowpayments-webhook

# Deploy email function
supabase functions deploy send-welcome-email

# Set secrets
supabase secrets set NOWPAYMENTS_IPN_SECRET=241dd87f-e1de-44e0-8baf-787c42a6b8c8
```

## 🧪 Testing

### Local Development

```bash
# Start development server
npm run serve

# Navigate to payment page
open http://localhost:4200/payment

# Test payment flow
# 1. Select subscription plan
# 2. Generate crypto payment
# 3. Complete payment with testnet coins
# 4. Verify automation triggers
```

### API Testing

```bash
# Test NOWPayments connection
node test-nowpayments.js

# Expected output:
# ✅ API connection successful!
# 💰 Found 254 supported cryptocurrencies
```

## 📈 Supported Cryptocurrencies

**Popular coins available**: Bitcoin (BTC), Ethereum (ETH), USDT, Litecoin (LTC), Bitcoin Cash (BCH), XRP, Cardano (ADA), Polkadot (DOT), and 246+ more cryptocurrencies.

## 🔗 Integration with Lovable

This project is fully compatible with Lovable. See [LOVABLE_INTEGRATION.md](./LOVABLE_INTEGRATION.md) for complete setup instructions.

### Key Files for Lovable:
- `lovable-config.json` - Project configuration
- `LOVABLE_INTEGRATION.md` - Complete integration guide
- `src/app/services/` - All service files
- `src/app/components/` - Payment and dashboard components

## 🆘 Support & Documentation

- 📧 **Email**: support@steadystreamtv.com
- 💬 **Issues**: [GitHub Issues](https://github.com/Travsingletary/steadystreamtv/issues)
- 📚 **Full Documentation**: [LOVABLE_INTEGRATION.md](./LOVABLE_INTEGRATION.md)

## 🔗 External Services

- **NOWPayments**: [https://nowpayments.io](https://nowpayments.io) - Cryptocurrency payment processing
- **Supabase**: [https://supabase.com](https://supabase.com) - Backend as a service
- **MegaOTT**: [https://megaott.net](https://megaott.net) - IPTV reseller API
- **Resend**: [https://resend.com](https://resend.com) - Email delivery service

---

**🎯 Ready for Production**

✅ **NOWPayments**: Configured and tested
✅ **Supabase**: Database and functions ready
✅ **MegaOTT**: IPTV provisioning integrated
✅ **Automation**: End-to-end flow complete
✅ **Frontend**: Payment and dashboard built

*Built with ❤️ for automated IPTV business*