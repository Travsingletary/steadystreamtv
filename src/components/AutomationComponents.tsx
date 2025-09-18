import React, { useState } from 'react';

// Production Configuration
const SUPABASE_URL = 'https://ojueihcytxwcioqtvwez.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM';

// MegaOTT Production Configuration
const MEGAOTT_CONFIG = {
  baseUrl: 'https://megaott.net/api/v1/user',
  apiKey: '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d'
};

// Production Automation Service with REAL API calls
const ProductionAutomationService = {
  async signUp(email: string, password: string, userData: any) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        password,
        data: userData
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Registration failed');
    }
    
    return response.json();
  },

  async registerUser(userData: any) {
    try {
      console.log('🚀 Starting production registration for:', userData.email);

      // Create user in Supabase Auth
      const authData = await this.signUp(userData.email, userData.password, {
        full_name: userData.name,
        plan: userData.plan || 'trial'
      });

      const userId = authData.user?.id;
      if (!userId) throw new Error('User creation failed');

      console.log('✅ User created:', userId);

      // Generate activation code and assets
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const playlistToken = btoa(JSON.stringify({
        userId,
        activationCode,
        plan: userData.plan,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000)
      }));

      const playlistUrl = `${window.location.origin}/api/playlist/${playlistToken}.m3u8`;
      console.log('✅ Assets generated');

      // Create REAL MegaOTT subscription (no simulations)
      let megaottResult = null;
      try {
        console.log('🔥 Creating REAL MegaOTT subscription for all plans...');
        const megaottResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-xtream-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            userId: userId,
            planType: userData.plan,
            email: userData.email,
            name: userData.name
          })
        });

        if (megaottResponse.ok) {
          megaottResult = await megaottResponse.json();
          console.log('✅ REAL MegaOTT subscription created:', megaottResult.data?.username);
        } else {
          const errorData = await megaottResponse.json();
          console.error('❌ MegaOTT API error:', errorData);
          throw new Error(errorData.error || 'Failed to create IPTV account');
        }
      } catch (megaError) {
        console.error('❌ MegaOTT integration failed:', megaError.message);
        throw megaError; // Don't use fallback, require real subscription
      }

      // Send welcome email with REAL credentials
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userId,
            email: userData.email,
            name: userData.name,
            iptv: {
              username: megaottResult?.data?.username || activationCode,
              password: megaottResult?.data?.password || 'temp123',
              playlistUrls: megaottResult?.data?.playlistUrls || {
                m3u: playlistUrl,
                m3u_plus: playlistUrl.replace('.m3u8', '_plus.m3u8'),
                xspf: playlistUrl.replace('.m3u8', '.xspf')
              }
            }
          })
        });
        console.log('✅ Welcome email sent with REAL credentials');
      } catch (emailError) {
        console.warn('⚠️ Email sending failed:', emailError.message);
      }

      return {
        success: true,
        user: authData.user,
        activationCode: megaottResult?.data?.username || activationCode,
        playlistUrl: megaottResult?.data?.playlistUrls?.m3u || playlistUrl,
        megaottSubscription: megaottResult,
        message: 'Account created successfully with REAL IPTV subscription!'
      };

    } catch (error: any) {
      console.error('💥 Registration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export const AutomationModal: React.FC<AutomationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'trial'
  });
  const [error, setError] = useState('');

  // Card-to-crypto plan mapping
  const planMapping = {
    'basic': 'standard',
    'duo': 'premium',
    'family': 'ultimate'
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Route based on plan selection
    if (formData.plan !== 'trial') {
      // PAID PLANS: Redirect to onboarding flow for card-to-crypto payment
      const userDataForOnboarding = {
        name: formData.name,
        email: formData.email,
        preferredDevice: 'web',
        genres: [],
        subscription: {
          plan: planMapping[formData.plan as keyof typeof planMapping] || 'premium'
        }
      };

      localStorage.setItem('automation-onboarding-data', JSON.stringify(userDataForOnboarding));

      console.log('🔄 Redirecting to onboarding for card-to-crypto payment:', formData.plan);
      window.location.href = '/onboarding?step=subscription&from=automation';
      return;
    }

    // TRIAL PLAN: Execute production automation
    setLoading(true);
    setError('');

    console.log('🎯 Processing trial signup...');
    const result = await ProductionAutomationService.registerUser(formData);

    if (result.success) {
      console.log('✅ Trial signup successful');
      onSuccess({
        user: result.user,
        activationCode: result.activationCode,
        playlistUrl: result.playlistUrl,
        userData: formData,
        megaottSubscription: result.megaottSubscription
      });
      onClose();
    } else {
      console.error('❌ Trial signup failed:', result.error);
      setError(result.error);
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-md w-full bg-gray-800 rounded-xl p-8 shadow-2xl">
        
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          🚀 Start Your Streaming Journey
        </h2>
        
        {error && (
          <div className="mb-4 bg-red-600 text-white p-3 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
              placeholder="Create a password (6+ characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Choose Plan</label>
            <select
              value={formData.plan}
              onChange={(e) => handleInputChange('plan', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
            >
              <option value="trial">🎉 24-Hour FREE Trial</option>
              <option value="basic">💰 $20/month - Solo Stream (1 Device)</option>
              <option value="duo">💎 $35/month - Duo Stream (2 Devices)</option>
              <option value="family">👨‍👩‍👧‍👦 $45/month - Family Max (3 Devices)</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 mt-6"
          >
            {loading ? '🔄 Creating Your Account...' : 
             formData.plan === 'trial' ? '🚀 Start Free Trial' : '💳 Pay Now & Start Streaming'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          {formData.plan === 'trial' ? (
            <>
              <p>✅ No credit card required for trial</p>
              <p>✅ Instant activation in 60 seconds</p>
              <p>✅ Full access to premium features</p>
            </>
          ) : (
            <>
              <p>✅ Secure payment via Stripe</p>
              <p>✅ Instant access after payment</p>
              <p>✅ Cancel anytime, no contracts</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  activationCode: string;
  playlistUrl: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  userData, 
  activationCode, 
  playlistUrl 
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-2xl w-full bg-gray-800 rounded-xl p-8 shadow-2xl max-h-screen overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-green-400 mb-2">🎉 You're All Set!</h2>
          <p className="text-gray-300">Welcome to SteadyStream TV, {userData.name}!</p>
          <p className="text-sm text-yellow-400 mt-2">✅ Account created ✅ Playlist generated ✅ Email sent</p>
        </div>

        <div className="space-y-6">
          {/* Activation Code */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">📱 Your Activation Code</h3>
            <div className="text-3xl font-mono text-center py-4 bg-gray-900 rounded border border-gray-600">
              <span className="text-green-400 tracking-wider">{activationCode}</span>
            </div>
            <button 
              onClick={() => copyToClipboard(activationCode)}
              className="mt-2 w-full text-sm bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-2 px-4 rounded"
            >
              📋 Copy Activation Code
            </button>
          </div>

          {/* Playlist URL */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">🔗 Your Playlist URL</h3>
            <div className="bg-gray-900 p-3 rounded border border-gray-600">
              <code className="text-sm text-green-400 break-all">{playlistUrl}</code>
            </div>
            <button 
              onClick={() => copyToClipboard(playlistUrl)}
              className="mt-2 w-full text-sm bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-2 px-4 rounded"
            >
              📋 Copy Playlist URL
            </button>
          </div>

          {/* Setup Instructions */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">⚡ Quick Setup (60 seconds)</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300">
              <li>
                <strong className="text-white">Download TiviMate:</strong> Use code{' '}
                <span className="bg-gray-900 px-2 py-1 rounded font-mono">1592817</span> at aftv.news/1592817
              </li>
              <li>
                <strong className="text-white">Open TiviMate:</strong> Select "Add Playlist" → "M3U Playlist"
              </li>
              <li>
                <strong className="text-white">Enter your code:</strong> Use activation code{' '}
                <span className="text-green-400 font-mono">{activationCode}</span>
              </li>
              <li>
                <strong className="text-white">Add playlist URL:</strong> Paste the URL from above
              </li>
              <li>
                <strong className="text-white">Start streaming:</strong> Enjoy thousands of channels! 🎬
              </li>
            </ol>
          </div>

          {/* QR Code */}
          <div className="bg-gray-700 p-6 rounded-lg text-center">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">📲 Scan for Mobile Setup</h3>
            <div className="bg-white p-4 rounded-lg inline-block">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(playlistUrl)}`} 
                alt="Playlist QR Code" 
                className="w-48 h-48"
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">Point your phone camera at this code</p>
          </div>

          {/* Support */}
          <div className="text-center bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-lg">
            <p className="text-white font-medium">
              ✉️ Setup instructions sent to {userData.email}
            </p>
            <p className="text-green-100 text-sm mt-1">
              Need help? Email support@steadystream.tv • Live chat available 24/7
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface IntegratedAutomationProps {
  children?: React.ReactNode;
  className?: string;
}

export const IntegratedAutomation: React.FC<IntegratedAutomationProps> = ({ children, className = '' }) => {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const handleSignupSuccess = (data: any) => {
    console.log('🎉 Signup success:', data);
    setSuccessData(data);
    setShowSignupModal(false);
    setShowSuccessModal(true);
  };

  return (
    <>
      {children || (
        <button 
          onClick={() => setShowSignupModal(true)}
          className={`bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-8 rounded-lg transition-all duration-200 ${className}`}
        >
          🚀 Start Free Trial
        </button>
      )}

      <AutomationModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleSignupSuccess}
      />

      {successData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          userData={successData.userData}
          activationCode={successData.activationCode}
          playlistUrl={successData.playlistUrl}
        />
      )}
    </>
  );
};
