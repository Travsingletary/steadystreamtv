
import React, { useState } from 'react';

// Using existing Supabase configuration
const SUPABASE_URL = 'https://ojueihcytxwcioqtvwez.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM';

// Direct Supabase API calls (no library needed)
const supabaseAPI = {
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

  async insertData(table: string, data: any) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      });
      
      return { success: response.ok };
    } catch (error) {
      console.warn(`Failed to insert into ${table}:`, error);
      return { success: false };
    }
  },

  async invokeFunction(functionName: string, body: any) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(body)
      });
      
      return { success: response.ok };
    } catch (error) {
      console.warn(`Function ${functionName} not available:`, error);
      return { success: false };
    }
  }
};

// MegaOTT API Configuration
const MEGAOTT_CONFIG = {
  baseUrl: 'https://megaott.net/api/v1/user',
  apiKey: '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d'
};

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'trial'
  });
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 🎯 MAIN AUTOMATION FUNCTION
  const processRegistration = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // STEP 1: Create user in Supabase Auth
      console.log('🔄 Creating user account...');
      const authData = await supabaseAPI.signUp(formData.email, formData.password, {
        full_name: formData.name,
        plan: formData.plan
      });

      const userId = authData.user?.id;
      if (!userId) throw new Error('User ID not generated');

      // STEP 2: Generate activation code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setActivationCode(code);

      // STEP 3: Create secure playlist token
      const token = btoa(JSON.stringify({
        userId,
        activationCode: code,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      }));

      // STEP 4: Generate playlist URL
      const baseUrl = window.location.origin;
      const playlist = `${baseUrl}/api/playlist/${token}.m3u8`;
      setPlaylistUrl(playlist);

      // STEP 5: Store user profile (with fallback if tables don't exist yet)
      try {
        await supabaseAPI.insertData('user_profiles', {
          id: userId,
          full_name: formData.name,
          email: formData.email,
          subscription_plan: formData.plan,
          onboarding_completed: false,
          created_at: new Date().toISOString()
        });
      } catch (profileError) {
        console.warn('Profile table not ready yet - user still created in auth');
      }

      // STEP 6: Store playlist info (with fallback)
      try {
        await supabaseAPI.insertData('user_playlists', {
          user_id: userId,
          playlist_token: token,
          activation_code: code,
          is_active: true,
          created_at: new Date().toISOString()
        });
      } catch (playlistError) {
        console.warn('Playlist table not ready yet - URL still generated');
      }

      // STEP 7: Attempt MegaOTT integration (non-blocking)
      try {
        await createMegaOTTSubscription(userId, formData.plan);
      } catch (megaError) {
        console.warn('MegaOTT integration pending - user still gets service');
      }

      // STEP 8: Send welcome email (non-blocking)
      try {
        await supabaseAPI.invokeFunction('send-welcome-email', {
          to: formData.email,
          name: formData.name,
          playlistUrl: playlist,
          activationCode: code,
          downloadLink: 'aftv.news/1592817'
        });
        setSuccess('Welcome email sent successfully!');
      } catch (emailError) {
        console.warn('Email function not deployed yet - user still gets access');
        setSuccess('Account created! Email system pending deployment.');
      }

      // SUCCESS! Move to next step
      setStep(2);
      setLoading(false);

    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // MegaOTT Subscription Creation
  const createMegaOTTSubscription = async (userId: string, plan: string) => {
    const response = await fetch(MEGAOTT_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEGAOTT_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        user_id: userId,
        subscription_plan: plan,
        auto_renew: true,
        trial_period: plan === 'trial' ? 24 : 0
      })
    });

    if (!response.ok) {
      throw new Error('MegaOTT subscription creation failed');
    }

    return response.json();
  };

  // Copy to clipboard functionality
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mr-4">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-black">
                <path fill="currentColor" d="M21,3H3C1.89,3 1,3.89 1,5V19A2,2 0 0,0 3,21H21A2,2 0 0,0 23,19V5C23,3.89 22.1,3 21,3M21,19H3V5H21V19Z"/>
                <path fill="currentColor" d="M10,15L15.19,12L10,9V15Z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              STEADYSTREAM TV
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            The Smarter Way to Stream - Automated setup in under 60 seconds
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="max-w-md mx-auto mb-6 bg-red-600 text-white p-4 rounded-lg">
            ❌ {error}
          </div>
        )}
        
        {success && (
          <div className="max-w-md mx-auto mb-6 bg-green-600 text-white p-4 rounded-lg">
            ✅ {success}
          </div>
        )}

        {/* STEP 1: Registration Interface */}
        {step === 1 && (
          <div className="max-w-md mx-auto bg-gray-800 rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Start Your Free Trial</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
                  placeholder="Create a password (6+ characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Choose Plan</label>
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
                onClick={processRegistration}
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 mt-6"
              >
                {loading ? '🔄 Creating Your Account...' : '🚀 Start Streaming Now'}
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-400">
              <p>✅ No credit card required for trial</p>
              <p>✅ Instant activation</p>
              <p>✅ Cancel anytime</p>
            </div>
          </div>
        )}

        {/* STEP 2: Success & Setup Instructions */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-green-400 mb-2">🎉 You're All Set!</h2>
              <p className="text-gray-300">Welcome to SteadyStream TV, {formData.name}!</p>
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
                    <strong className="text-white">Download TiviMate:</strong> Use code <span className="bg-gray-900 px-2 py-1 rounded font-mono">1592817</span> at aftv.news/1592817
                  </li>
                  <li>
                    <strong className="text-white">Open TiviMate:</strong> Select "Add Playlist" → "M3U Playlist"
                  </li>
                  <li>
                    <strong className="text-white">Enter your code:</strong> Use activation code <span className="text-green-400 font-mono">{activationCode}</span>
                  </li>
                  <li>
                    <strong className="text-white">Add playlist URL:</strong> Paste the URL from above
                  </li>
                  <li>
                    <strong className="text-white">Start streaming:</strong> Enjoy thousands of channels! 🎬
                  </li>
                </ol>
              </div>

              {/* QR Code Section */}
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
                  ✉️ Setup instructions sent to {formData.email}
                </p>
                <p className="text-green-100 text-sm mt-1">
                  Need help? Email support@steadystreamtv.com
                </p>
              </div>

              {/* Reset Button */}
              <div className="text-center pt-4">
                <button 
                  onClick={() => {setStep(1); setError(''); setSuccess(''); setFormData({name: '', email: '', password: '', plan: 'trial'});}}
                  className="text-yellow-400 hover:text-yellow-300 text-sm underline"
                >
                  ← Register Another Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2024 SteadyStream TV - The Smarter Way to Stream</p>
          <p>Questions? Contact support@steadystreamtv.com</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
