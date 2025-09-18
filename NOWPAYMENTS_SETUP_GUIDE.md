# NOWPayments Setup Guide - INSTANT APPROVAL! 🚀

NOWPayments is perfect for SteadyStream TV because:
- ✅ **Instant approval** (no waiting lists!)
- ✅ **No KYC required** for basic accounts
- ✅ **300+ cryptocurrencies** supported
- ✅ **0.5-1.5% fees** (much lower than traditional processors)
- ✅ **US compatible**
- ✅ **Direct crypto settlements**

## Step 1: Create NOWPayments Account (2 minutes)

1. **Go to**: [https://nowpayments.io](https://nowpayments.io)
2. **Click "Get Started"** in the top right
3. **Fill in details**:
   - Email address
   - Strong password
   - Business name: "SteadyStream TV" (or your business name)
   - Website: Your domain (or "in development")
4. **Verify email** - check your inbox and click the verification link
5. **Done!** No KYC needed for basic accounts

## Step 2: Get Your API Key

1. **Login** to your NOWPayments dashboard
2. **Go to Settings** → **API Keys**
3. **Click "Generate API Key"**
4. **Copy the API key** (keep it secure!)
5. **Save it** - you'll need this for your environment variables

## Step 3: Configure Your Environment

Update your `.env.local` file:

```env
# NOWPayments Configuration
VITE_NOWPAYMENTS_API_KEY=your_actual_api_key_here
VITE_NOWPAYMENTS_TEST_MODE=false
```

For testing, you can use:
```env
VITE_NOWPAYMENTS_TEST_MODE=true
```

## Step 4: Set Up Receiving Addresses (Optional but Recommended)

1. **Go to Settings** → **Receiving Addresses** in NOWPayments dashboard
2. **Add your wallet addresses** for cryptocurrencies you want to receive:
   - **Bitcoin (BTC)**: Your BTC wallet address
   - **Ethereum (ETH)**: Your ETH wallet address
   - **USDT**: Your USDT wallet address (ERC-20 or TRC-20)
   - **USDC**: Your USDC wallet address
   - **Litecoin (LTC)**: Your LTC wallet address

If you don't add addresses, NOWPayments will hold the funds in their system until you add them.

## Step 5: Database Setup

Run this SQL in your Supabase SQL editor:

```sql
-- Create NOWPayments records table
CREATE TABLE IF NOT EXISTS nowpayments_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  price_amount DECIMAL(10,2) NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'USD',
  pay_amount DECIMAL(20,8) NOT NULL,
  pay_currency TEXT NOT NULL,
  actually_paid DECIMAL(20,8),
  outcome_amount DECIMAL(20,8),
  outcome_currency TEXT,
  payment_status TEXT NOT NULL DEFAULT 'waiting',
  invoice_url TEXT,
  customer_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_nowpayments_payment_id ON nowpayments_records(payment_id);
CREATE INDEX idx_nowpayments_order_id ON nowpayments_records(order_id);
CREATE INDEX idx_nowpayments_user_id ON nowpayments_records(user_id);
```

## Step 6: Test the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Go to the onboarding flow**
3. **Select a plan**
4. **Choose a cryptocurrency** (try USDT for testing - it's stable)
5. **Complete the payment flow**

## Step 7: Supported Cryptocurrencies

Your customers can pay with any of these cryptocurrencies:

### Popular Options:
- **Bitcoin (BTC)** - The original cryptocurrency
- **Ethereum (ETH)** - Smart contract platform
- **USDT** - Stable coin pegged to USD (recommended for testing)
- **USDC** - Another stable coin
- **Litecoin (LTC)** - Fast and cheap transactions

### Additional Options:
- **Cardano (ADA)**
- **Polygon (MATIC)**
- **Solana (SOL)**
- **Avalanche (AVAX)**
- **TRON (TRX)**
- **And 290+ more!**

## Step 8: Payment Flow

Here's what happens when a customer pays:

1. **Customer selects plan** → Chooses cryptocurrency
2. **Payment created** → NOWPayments generates unique address
3. **Customer pays** → Sends crypto to the provided address
4. **Payment confirmed** → Usually within minutes
5. **Account activated** → Customer gets access to SteadyStream TV

## Step 9: Webhook Setup (Advanced)

For real-time payment notifications, set up webhooks:

1. **In NOWPayments dashboard** → Settings → Webhooks
2. **Add webhook URL**: `https://yourdomain.com/api/nowpayments-webhook`
3. **Select events**: Payment status changes
4. **Implement webhook handler** in your backend

## Step 10: Go Live!

Once everything is tested:

1. **Set test mode to false**:
   ```env
   VITE_NOWPAYMENTS_TEST_MODE=false
   ```

2. **Deploy your application**
3. **Start accepting crypto payments!**

## Fees & Pricing

NOWPayments charges:
- **0.5%** for high-volume accounts (>$10K/month)
- **1%** for standard accounts ($1K-$10K/month)
- **1.5%** for small accounts (<$1K/month)

Compare this to:
- **Stripe**: 2.9% + $0.30 per transaction
- **PayPal**: 2.9% + $0.30 per transaction
- **BitPay**: 1% (but requires approval)

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Monitor payments** regularly via NOWPayments dashboard
4. **Keep wallet private keys secure**
5. **Set up email notifications** for payments in NOWPayments dashboard

## Troubleshooting

### Common Issues:

**"API key invalid"**
- Double-check your API key in the dashboard
- Make sure no extra spaces in environment variable

**"Currency not supported"**
- Check the NOWPayments documentation for supported currencies
- Some currencies may have minimum amounts

**"Payment not confirming"**
- Crypto payments need network confirmations (usually 5-15 minutes)
- Check the blockchain explorer for transaction status

### Support

- **NOWPayments Support**: [support@nowpayments.io](mailto:support@nowpayments.io)
- **Documentation**: [https://documenter.getpostman.com/view/7907941/S1a32n38](https://documenter.getpostman.com/view/7907941/S1a32n38)
- **Status Page**: [https://status.nowpayments.io/](https://status.nowpayments.io/)

## Success! 🎉

You now have a crypto payment processor that:
- ✅ **Works immediately** (no approval process)
- ✅ **Supports 300+ cryptocurrencies**
- ✅ **Has low fees** (0.5-1.5%)
- ✅ **Is US-compatible**
- ✅ **Provides direct crypto settlements**

Your customers can now pay with their preferred cryptocurrency, and you'll receive the crypto directly in your wallets!