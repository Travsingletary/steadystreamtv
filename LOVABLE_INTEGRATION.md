# 🚀 Lovable Frontend Integration Guide

## 📋 Environment Variables for Lovable

Add these to your Lovable project's environment configuration:

```env
# NOWPayments Configuration
VITE_NOWPAYMENTS_API_URL=https://api.nowpayments.io/v1
VITE_NOWPAYMENTS_API_KEY=TMhut7sRBMcQ8achNXRTuFyutc9QT1DKfv
VITE_NOWPAYMENTS_IPN_SECRET=241dd87f-e1de-44e0-8baf-787c42a6b8c8

# Supabase Configuration
VITE_SUPABASE_URL=https://ojueihcytxwcioqtvwez.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM

# MegaOTT Configuration
VITE_MEGAOTT_API_URL=https://megaott.net/api/v1

# Webhook Configuration
VITE_WEBHOOK_URL=https://ojueihcytxwcioqtvwez.supabase.co/functions/v1/nowpayments-webhook
```

## 📦 Required Dependencies

Add these to your package.json:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "axios": "^1.6.2",
    "uuid": "^9.0.0"
  }
}
```

## 🔧 Core Services to Copy

### 1. Environment Configuration

Create `src/config/environment.ts`:

```typescript
export const AppConfig = {
  NOWPAYMENTS_API_URL: import.meta.env.VITE_NOWPAYMENTS_API_URL,
  NOWPAYMENTS_API_KEY: import.meta.env.VITE_NOWPAYMENTS_API_KEY,
  NOWPAYMENTS_IPN_SECRET: import.meta.env.VITE_NOWPAYMENTS_IPN_SECRET,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  MEGAOTT_API_URL: import.meta.env.VITE_MEGAOTT_API_URL,
  WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL,
};
```

### 2. Service Files to Copy

Copy these entire files to your Lovable project:

#### Core Services:
- `src/services/supabase.service.ts` - Database operations
- `src/services/payment.service.ts` - Payment processing
- `src/services/megaott.service.ts` - IPTV provisioning
- `src/services/automation.service.ts` - Full automation flow
- `src/services/webhook.service.ts` - Webhook handling

#### Components:
- `src/components/payment/payment.component.ts` - Payment form
- `src/components/payment/payment.component.html` - Payment template
- `src/components/payment/payment.component.scss` - Payment styles
- `src/components/subscription-dashboard/` - Complete dashboard

## 🎨 UI Components for Lovable

### Payment Component (React/Vue)

```typescript
// For React in Lovable
import React, { useState, useEffect } from 'react';
import { PaymentService } from '../services/payment.service';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: number;
  features: string[];
}

export const PaymentComponent: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentService = new PaymentService();

  useEffect(() => {
    setPlans(paymentService.getSubscriptionPlans());
  }, []);

  const handlePayment = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      const response = await paymentService.processSubscriptionPayment(selectedPlan.id);
      if (response.payment_url) {
        window.open(response.payment_url, '_blank');
        // Start monitoring payment status
        monitorPayment(response.payment_id);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const monitorPayment = (paymentId: string) => {
    const interval = setInterval(async () => {
      const confirmed = await paymentService.confirmPayment(paymentId);
      if (confirmed) {
        clearInterval(interval);
        // Redirect to success page
        window.location.href = '/subscription';
      }
    }, 10000);
  };

  return (
    <div className="payment-container">
      <h1>Choose Your IPTV Subscription</h1>

      <div className="plans-grid">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
            onClick={() => setSelectedPlan(plan)}
          >
            <h3>{plan.name}</h3>
            <div className="price">${plan.price}</div>
            <ul>
              {plan.features.map(feature => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="payment-actions">
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="pay-button"
          >
            {isProcessing ? 'Processing...' : 'Pay with Crypto'}
          </button>
        </div>
      )}
    </div>
  );
};
```

## 🔄 API Endpoints

### Webhook Endpoints for Lovable

```typescript
// API endpoint for NOWPayments webhook
// POST /api/webhook/nowpayments

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-nowpayments-sig');
    const payload = await request.text();

    // Verify webhook signature
    const isValid = verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const webhookData = JSON.parse(payload);

    // Process payment
    if (webhookData.payment_status === 'finished') {
      await processSuccessfulPayment(webhookData);
    }

    return new Response('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}
```

## 🎯 Subscription Plans Configuration

```typescript
export const SUBSCRIPTION_PLANS = [
  {
    id: 'basic_monthly',
    name: 'Basic Monthly',
    price: 9.99,
    currency: 'USD',
    duration: 30,
    features: [
      '1000+ Live Channels',
      'HD Quality',
      'Basic Support',
      '1 Connection'
    ]
  },
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 19.99,
    currency: 'USD',
    duration: 30,
    features: [
      '5000+ Live Channels',
      '4K Quality',
      'Premium Support',
      'VOD Library',
      '3 Connections'
    ]
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 199.99,
    currency: 'USD',
    duration: 365,
    features: [
      '5000+ Live Channels',
      '4K Quality',
      'Premium Support',
      'VOD Library',
      '3 Connections',
      '2 Months Free'
    ]
  }
];
```

## 🎨 CSS Styles

Copy these key styles for the payment components:

```scss
.payment-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.plan-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover, &.selected {
    border-color: #2196f3;
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(33, 150, 243, 0.15);
  }
}

.pay-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
```

## 🔗 Routing Configuration

Add these routes to your Lovable router:

```typescript
// Routes for your payment system
{
  path: '/payment',
  component: PaymentComponent
},
{
  path: '/subscription',
  component: SubscriptionDashboard
},
{
  path: '/payment/success',
  component: PaymentSuccess
},
{
  path: '/payment/cancel',
  component: PaymentCancel
}
```

## ⚡ Quick Setup Checklist

1. ✅ **Add environment variables** to Lovable project
2. ✅ **Install dependencies** (`@supabase/supabase-js`, `axios`, `uuid`)
3. ✅ **Copy service files** (payment, supabase, megaott, automation)
4. ✅ **Copy components** (payment form, subscription dashboard)
5. ✅ **Add CSS styles** for payment interface
6. ✅ **Configure routes** for payment flow
7. ✅ **Set up webhook endpoint** for payment notifications
8. ✅ **Test payment flow** with NOWPayments

## 🚀 Testing in Lovable

Once integrated, test the flow:

1. Navigate to `/payment`
2. Select a subscription plan
3. Click "Pay with Crypto"
4. Complete payment with test crypto
5. Check `/subscription` for activation

Your automated IPTV onboarding system will be fully functional in Lovable! 🎯
```