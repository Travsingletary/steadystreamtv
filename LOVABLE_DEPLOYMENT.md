# 🚀 Deploy SteadyStream to Lovable

## 📋 Pre-Deployment Checklist

### ✅ **Current Status:**
- ✅ Angular app built successfully
- ✅ MegaOTT integration working
- ✅ TiviMate app integration complete
- ✅ Payment system functional
- ✅ Supabase database connected
- ✅ Environment variables configured

## 🔄 **Option 1: Convert to React for Lovable**

Since Lovable primarily works with React/Next.js, you have two options:

### **Recommended: Create React Version**

1. **Create new Lovable project**:
   ```bash
   # Go to lovable.dev
   # Create new project: "SteadyStream IPTV Platform"
   # Choose React/Next.js template
   ```

2. **Copy core services** (these work in both Angular/React):
   ```
   ✅ Copy: src/app/services/supabase.service.ts
   ✅ Copy: src/app/services/payment.service.ts
   ✅ Copy: src/app/services/megaott.service.ts
   ✅ Copy: src/app/services/app-management.service.ts
   ✅ Copy: src/app/services/automation.service.ts
   ```

3. **Convert Angular components to React**:
   - Payment component → React payment form
   - Subscription dashboard → React dashboard
   - App config component → React config page

## 🔄 **Option 2: Use Current Angular Build**

### **Deploy as Static Site:**

1. **Build for production**:
   ```bash
   cd "/Volumes/On SIte/MY APPS/STEADY STREAM APP/iptvnator"
   npm run build:prod
   ```

2. **Deploy dist folder** to:
   - Vercel
   - Netlify
   - GitHub Pages
   - Your hosting provider

## 🎯 **Recommended: Lovable React Conversion**

### **Step 1: Environment Setup**

Create `.env` in your new Lovable project:

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
VITE_MEGAOTT_API_KEY=PduXXKv6Hi6M9xrstKEpXzmJ3WWBvZjigmr9opdg9c3c15af
VITE_MEGAOTT_USERNAME=IX5E3YZZ
VITE_MEGAOTT_PASSWORD=2N1xXXid

# TiviMate App Configuration
VITE_TIVIMATE_DOWNLOAD_URL=https://aftv.news/1592817
VITE_TIVIMATE_DOWNLOAD_CODE=1592817
VITE_TIVIMATE_ADMIN_URL=https://gangstageeks.com/tivimate/rs6/steady/
VITE_TIVIMATE_ADMIN_USER=SteadyBoss
VITE_TIVIMATE_ADMIN_PASS=Skyhigh123

# Webhook Configuration
VITE_WEBHOOK_URL=https://ojueihcytxwcioqtvwez.supabase.co/functions/v1/nowpayments-webhook
```

### **Step 2: Install Dependencies**

```bash
npm install @supabase/supabase-js axios uuid qrcode react-qr-code
```

### **Step 3: Core React Components**

#### **Payment Component (React)**

```tsx
import React, { useState, useEffect } from 'react';
import { PaymentService } from '../services/payment.service';

export const PaymentPage: React.FC = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentService = new PaymentService();

  useEffect(() => {
    setPlans([
      {
        id: 'basic_monthly',
        name: 'Basic Monthly',
        price: 20.00,
        features: ['1000+ Channels', 'HD Quality', '1 Connection', '30 Days']
      },
      {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 39.99,
        features: ['5000+ Channels', '4K Quality', '3 Connections', 'VOD Library']
      },
      {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: 399.99,
        features: ['Everything Premium', '12 Months + 2 Free', 'Priority Support']
      }
    ]);
  }, []);

  const handlePayment = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      const response = await paymentService.processSubscriptionPayment(selectedPlan.id);
      if (response.payment_url) {
        window.open(response.payment_url, '_blank');
        // Monitor payment status
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
        window.location.href = '/subscription';
      }
    }, 10000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 SteadyStream TV
          </h1>
          <p className="text-xl text-blue-100">
            Choose your IPTV subscription plan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 ${
                selectedPlan?.id === plan.id
                  ? 'ring-4 ring-blue-500 transform scale-105'
                  : 'hover:transform hover:scale-105'
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <div className="text-4xl font-bold text-blue-600 mb-6">
                ${plan.price}
              </div>
              <ul className="space-y-3">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className="text-center">
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-12 py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-300"
            >
              {isProcessing ? 'Processing...' : '💳 Pay with Crypto'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### **Subscription Dashboard (React)**

```tsx
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { AppManagementService } from '../services/app-management.service';

export const SubscriptionDashboard: React.FC = () => {
  const [subscription, setSubscription] = useState(null);
  const [appDownload, setAppDownload] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const appService = new AppManagementService();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      // Load user subscription data
      // This would connect to your Supabase service
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setIsLoading(false);
    }
  };

  const downloadApp = async () => {
    try {
      const response = appService.generateDownloadResponse('user_id', {
        m3u_url: subscription?.m3u_url,
        xtream_url: subscription?.xtream_url,
        username: subscription?.username,
        password: subscription?.password
      });
      setAppDownload(response);
    } catch (error) {
      console.error('Failed to generate download:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Subscription Dashboard</h1>

        {/* Subscription Status */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Subscription Status</h2>
          <div className="flex items-center">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              ✓ Active
            </span>
          </div>
        </div>

        {/* App Download Section */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">📱 Download SteadyStream TV App</h2>

          <button
            onClick={downloadApp}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 mb-6"
          >
            Generate Download Link
          </button>

          {appDownload && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Download Links */}
              <div>
                <h3 className="text-lg font-semibold mb-4">📥 Download Options</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Download URL:</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={appDownload.downloadUrl}
                        readOnly
                        className="flex-1 border rounded-l-lg px-3 py-2"
                      />
                      <button
                        onClick={() => copyToClipboard(appDownload.downloadUrl)}
                        className="bg-gray-200 px-4 py-2 rounded-r-lg"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Download Code:</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={appDownload.downloadCode}
                        readOnly
                        className="flex-1 border rounded-l-lg px-3 py-2"
                      />
                      <button
                        onClick={() => copyToClipboard(appDownload.downloadCode)}
                        className="bg-gray-200 px-4 py-2 rounded-r-lg"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div>
                <h3 className="text-lg font-semibold mb-4">📱 Quick Setup</h3>
                <div className="text-center">
                  <QRCode value={appDownload.deepLink} size={200} />
                  <p className="text-sm text-gray-600 mt-2">
                    Scan with your phone for instant setup
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">📋 Installation Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Download the APK from the link above</li>
              <li>Enable "Unknown Sources" in Android settings</li>
              <li>Install the downloaded file</li>
              <li>Open app and scan QR code for instant setup</li>
              <li>Start streaming your favorite content!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### **Step 4: Deploy to Lovable**

1. **Upload to Lovable**:
   - Copy all React components
   - Copy service files
   - Add environment variables
   - Configure routes

2. **Test the deployment**:
   - Navigate to payment page
   - Complete test transaction
   - Verify app download works
   - Test QR code functionality

## 🎯 **Quick Deploy Commands**

```bash
# If using current Angular build
npm run build:prod

# Copy dist folder to your hosting provider
# Or use:
vercel --prod
# or
netlify deploy --prod --dir=dist
```

## ✅ **Post-Deployment Checklist**

1. ✅ Test crypto payment flow
2. ✅ Verify MegaOTT API connection
3. ✅ Test TiviMate app download
4. ✅ Verify QR code generation
5. ✅ Test webhook functionality
6. ✅ Confirm email notifications
7. ✅ Test subscription dashboard

Your SteadyStream platform with TiviMate integration will be live! 🚀

## 🔗 **Useful Links**

- **TiviMate Download**: `aftv.news/1592817`
- **Admin Panel**: `gangstageeks.com/tivimate/rs6/steady/`
- **Supabase Dashboard**: `ojueihcytxwcioqtvwez.supabase.co`
- **MegaOTT API**: `megaott.net/api/v1`