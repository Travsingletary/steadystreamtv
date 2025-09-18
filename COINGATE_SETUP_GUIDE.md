# CoinGate Production Setup Guide

## 1. Create CoinGate Account

### Step 1: Sign Up
1. Visit [https://coingate.com](https://coingate.com)
2. Click "Sign Up" → "Business Account"
3. Fill in your business information:
   - Business name: "SteadyStream TV" or your legal business name
   - Business type: "Software/Technology" or "Media & Entertainment"
   - Website: Your domain
   - Expected monthly volume: Estimate based on your user projections

### Step 2: Complete Verification
1. Upload required documents:
   - Government ID
   - Business registration (if applicable)
   - Proof of address
2. Wait for approval (usually 24-48 hours)

## 2. Configure CoinGate Dashboard

### Step 1: Get API Token
1. Login to CoinGate dashboard
2. Go to **Settings** → **API**
3. Click **"Generate new token"**
4. Copy the API token (save it securely!)

### Step 2: Set Up Receiving Addresses
1. Go to **Settings** → **Receiving Addresses**
2. Add wallet addresses for each cryptocurrency you want to receive:
   - **Bitcoin (BTC)**: Your BTC wallet address
   - **Ethereum (ETH)**: Your ETH wallet address
   - **Litecoin (LTC)**: Your LTC wallet address
   - **USDT**: Your USDT wallet address (ERC-20 or TRC-20)
   - **USDC**: Your USDC wallet address

### Step 3: Configure Webhooks
1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/coingate-callback`
3. Select events: "Payment status changed"

## 3. Update Environment Variables

Once you have your API token, update your production environment:

```bash
# In .env.production
VITE_COINGATE_API_TOKEN=your_actual_api_token_here
VITE_COINGATE_TEST_MODE=false
```

## 4. Test Payment Flow

### Before Going Live:
1. Test with small amounts first
2. Verify payments arrive in your wallets
3. Check that user accounts are activated properly
4. Test all cryptocurrency options

### Monitoring:
- Monitor payments in CoinGate dashboard
- Check your crypto wallets for incoming payments
- Monitor user subscriptions in Supabase

## 5. Important Security Notes

1. **Never commit API tokens to Git**
2. **Use environment variables for all sensitive data**
3. **Regularly rotate API tokens**
4. **Monitor for unusual payment activity**
5. **Keep backup of wallet private keys**

## 6. Wallet Recommendations

### For Receiving Crypto:
- **Hardware Wallets**: Ledger, Trezor (most secure)
- **Multi-sig Wallets**: Gnosis Safe (for team management)
- **Exchange Wallets**: Coinbase Pro, Binance (for immediate conversion to fiat)

### Important:
- Use separate wallets for business vs personal funds
- Keep detailed records for tax purposes
- Consider automatic conversion to stablecoins (USDT/USDC) to reduce volatility

## 7. Going Live Checklist

- [ ] CoinGate account verified and approved
- [ ] API token generated and configured
- [ ] Crypto wallet addresses added to CoinGate
- [ ] Webhook endpoints configured
- [ ] Production environment variables set
- [ ] Test payments completed successfully
- [ ] Monitoring dashboard set up
- [ ] Legal/tax compliance reviewed

## Support

- **CoinGate Support**: support@coingate.com
- **CoinGate Documentation**: https://developer.coingate.com/
- **CoinGate API Reference**: https://developer.coingate.com/reference/