# US Payment Processor Setup Guide

## Overview

Since CoinGate is not available for US businesses, we've implemented support for US-compatible payment processors. You can choose from three options:

## Option 1: BitPay (Recommended) 🥇

**Best for**: Card-to-crypto payments in the US
**Fees**: 1% settlement fee
**Settlement**: Receive Bitcoin, Ethereum, or USD

### Setup Steps:
1. **Create BitPay Account**: Visit [bitpay.com](https://bitpay.com)
2. **Business Verification**: Complete KYB (Know Your Business) process
3. **Get API Token**:
   - Go to Settings → API Tokens
   - Create new token with "pos" facade
4. **Configure Settlement**: Choose crypto or USD settlement
5. **Update Environment**:
   ```env
   VITE_PAYMENT_PROCESSOR=bitpay
   VITE_BITPAY_API_TOKEN=your_actual_token
   VITE_PAYMENT_TEST_MODE=false
   ```

**Supported Settlement Currencies**:
- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- Bitcoin Cash (BCH)
- Ripple (XRP)
- Dogecoin (DOGE)
- US Dollar (USD)

---

## Option 2: Coinbase Commerce 🥈

**Best for**: Direct crypto payments (customers need crypto wallets)
**Fees**: 1% processing fee
**Settlement**: Multiple cryptocurrencies

### Setup Steps:
1. **Create Coinbase Commerce Account**: Visit [commerce.coinbase.com](https://commerce.coinbase.com)
2. **Business Verification**: Complete verification process
3. **Get API Key**: Go to Settings → API Keys
4. **Update Environment**:
   ```env
   VITE_PAYMENT_PROCESSOR=coinbase_commerce
   VITE_COINBASE_COMMERCE_API_KEY=your_api_key
   VITE_PAYMENT_TEST_MODE=false
   ```

**Note**: Customers must have cryptocurrency to pay directly

---

## Option 3: Stripe (Traditional) 🥉

**Best for**: Traditional card processing
**Fees**: 2.9% + $0.30 per transaction
**Settlement**: USD only

### Setup Steps:
1. **Create Stripe Account**: Visit [stripe.com](https://stripe.com)
2. **Complete Business Setup**: Verify business details
3. **Get API Keys**: Go to Developers → API Keys
4. **Update Environment**:
   ```env
   VITE_PAYMENT_PROCESSOR=stripe
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   VITE_STRIPE_SECRET_KEY=sk_live_...
   VITE_PAYMENT_TEST_MODE=false
   ```

**Note**: This is traditional fiat processing, no crypto involved

---

## Database Setup

For US payments, you'll need to create a new table in Supabase:

```sql
CREATE TABLE us_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  processor TEXT NOT NULL, -- 'bitpay', 'coinbase_commerce', 'stripe'
  price_amount DECIMAL(10,2) NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  settlement_currency TEXT,
  settlement_amount DECIMAL(20,8),
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_url TEXT,
  customer_email TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX idx_us_payments_order_id ON us_payments(order_id);
CREATE INDEX idx_us_payments_user_id ON us_payments(user_id);
CREATE INDEX idx_us_payments_status ON us_payments(payment_status);
```

---

## Switching Payment Processors

The system is designed to be flexible. You can switch between processors by changing the `VITE_PAYMENT_PROCESSOR` environment variable:

```env
# For BitPay
VITE_PAYMENT_PROCESSOR=bitpay

# For Coinbase Commerce
VITE_PAYMENT_PROCESSOR=coinbase_commerce

# For Stripe
VITE_PAYMENT_PROCESSOR=stripe
```

---

## Recommendation: BitPay

For SteadyStream TV, **BitPay is the best choice** because:

✅ **US Compliant**: Fully licensed MSB (Money Service Business)
✅ **Card-to-Crypto**: Customers pay with cards, you receive crypto
✅ **Lower Fees**: 1% vs 2.9% for traditional processors
✅ **Established**: Founded in 2011, trusted by major companies
✅ **Multiple Cryptos**: Settle in BTC, ETH, LTC, BCH, XRP, DOGE, or USD
✅ **No Chargebacks**: Crypto settlements are final

---

## Next Steps

1. **Choose your processor** (BitPay recommended)
2. **Create account** and complete verification
3. **Get API credentials**
4. **Update environment variables**
5. **Create database table** (if using BitPay/Coinbase Commerce)
6. **Test with small amounts**
7. **Go live**

---

## Support

- **BitPay**: [support.bitpay.com](https://support.bitpay.com)
- **Coinbase Commerce**: [commerce.coinbase.com/help](https://commerce.coinbase.com/help)
- **Stripe**: [support.stripe.com](https://support.stripe.com)

Each processor provides extensive documentation and support for integration.