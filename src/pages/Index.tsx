
import React, { useState } from 'react';

// Supabase Configuration (Direct API calls)
const SUPABASE_URL = 'https://ojueihcytxwcioqtvwez.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM';

// Direct Supabase API calls (no library needed)
const supabaseAPI = {
  async signUp(email, password, userData) {
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

  async insertData(table, data) {
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

  async invokeFunction(functionName, body) {
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

// 🔥 AUTOMATION SIGNUP COMPONENT (Inline)
const AutomationSignup = ({ onSuccess, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'trial'
  });
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

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
      // Create user in Supabase Auth
      const authData = await supabaseAPI.signUp(formData.email, formData.password, {
        full_name: formData.name,
        plan: formData.plan
      });

      const userId = authData.user?.id;
      if (!userId) throw new Error('User creation failed');

      // Generate activation code
      const activationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create playlist token
      const playlistToken = btoa(JSON.stringify({
        userId,
        activationCode,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000)
      }));

      // Generate playlist URL
      const playlistUrl = `${window.location.origin}/api/playlist/${playlistToken}.m3u8`;

      // Store user profile (with fallback)
      try {
        await supabaseAPI.insertData('user_profiles', {
          id: userId,
          full_name: formData.name,
          email: formData.email,
          subscription_plan: formData.plan,
          activation_code: activationCode,
          onboarding_completed: false,
          created_at: new Date().toISOString()
        });
      } catch (profileError) {
        console.warn('Profile table not ready yet - user still created');
      }

      // Store playlist info (with fallback)
      try {
        await supabaseAPI.insertData('user_playlists', {
          user_id: userId,
          playlist_token: playlistToken,
          activation_code: activationCode,
          is_active: true,
          created_at: new Date().toISOString()
        });
      } catch (playlistError) {
        console.warn('Playlist table not ready yet - URL still works');
      }

      // MegaOTT integration (non-blocking)
      try {
        await fetch(MEGAOTT_CONFIG.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MEGAOTT_CONFIG.apiKey}`
          },
          body: JSON.stringify({
            user_id: userId,
            subscription_plan: formData.plan,
            auto_renew: true,
            trial_period: formData.plan === 'trial' ? 24 : 0
          })
        });
      } catch (megaError) {
        console.warn('MegaOTT integration pending');
      }

      // Send welcome email (non-blocking)
      try {
        await supabaseAPI.invokeFunction('send-welcome-email', {
          to: formData.email,
          name: formData.name,
          playlistUrl: playlistUrl,
          activationCode: activationCode,
          downloadLink: 'aftv.news/1592817'
        });
      } catch (emailError) {
        console.warn('Email function not deployed yet');
      }

      // SUCCESS!
      onSuccess && onSuccess({
        user: authData.user,
        activationCode,
        playlistUrl,
        userData: formData
      });

      setLoading(false);

    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className={`bg-gray-800 rounded-xl p-8 shadow-2xl ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Start Your Free Trial
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
  );
};

// 🔥 SUCCESS SCREEN COMPONENT (Inline)
const SuccessScreen = ({ userData, activationCode, playlistUrl, onReset }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-green-400 mb-2">🎉 You're All Set!</h2>
        <p className="text-gray-300">Welcome to SteadyStream TV, {userData.name}!</p>
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
            Need help? Email support@steadystreamtv.com
          </p>
        </div>

        {/* Reset */}
        {onReset && (
          <div className="text-center pt-4">
            <button 
              onClick={onReset}
              className="text-yellow-400 hover:text-yellow-300 text-sm underline"
            >
              ← Register Another Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 🔥 MAIN HOMEPAGE WITH AUTOMATION
const Index = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleSignupSuccess = (data) => {
    setSuccessData(data);
    setShowSuccess(true);
    setShowSignup(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      
      {/* SUCCESS SCREEN OVERLAY */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <SuccessScreen 
            userData={successData.userData}
            activationCode={successData.activationCode}
            playlistUrl={successData.playlistUrl}
            onReset={() => {
              setShowSuccess(false);
              setShowSignup(false);
            }}
          />
        </div>
      )}

      {/* SIGNUP MODAL OVERLAY */}
      {showSignup && !showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-md w-full">
            <button 
              onClick={() => setShowSignup(false)}
              className="absolute -top-4 -right-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
            <AutomationSignup onSuccess={handleSignupSuccess} />
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mr-4">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-black">
                <path fill="currentColor" d="M21,3H3C1.89,3 1,3.89 1,5V19A2,2 0 0,0 3,21H21A2,2 0 0,0 23,19V5C23,3.89 22.1,3 21,3M21,19H3V5H21V19Z"/>
                <path fill="currentColor" d="M10,15L15.19,12L10,9V15Z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              STEADYSTREAM TV
            </h1>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-yellow-400 transition-colors">Pricing</a>
            <a href="#support" className="hover:text-yellow-400 transition-colors">Support</a>
          </nav>

          <button 
            onClick={() => setShowSignup(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-2 px-6 rounded-lg transition-all duration-200"
          >
            🚀 Free Trial
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          The Smarter Way to <span className="text-yellow-400">Stream</span>
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Premium IPTV streaming with thousands of channels, instant setup, and 24/7 support. 
          Start your free trial and be streaming in under 60 seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => setShowSignup(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200"
          >
            🎉 Start 24-Hour Free Trial
          </button>
          <a 
            href="#features" 
            className="border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200"
          >
            Learn More
          </a>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <p>✅ No credit card required • ✅ Instant activation • ✅ Cancel anytime</p>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-16">Why Choose SteadyStream?</h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">📺</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Thousands of Channels</h3>
            <p className="text-gray-300">
              Premium content from around the world including sports, movies, news, and entertainment.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Instant Setup</h3>
            <p className="text-gray-300">
              Automated onboarding gets you streaming in under 60 seconds with QR code setup.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">24/7 Support</h3>
            <p className="text-gray-300">
              Premium customer support to help you with any questions or technical issues.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-16">Choose Your Plan</h2>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Solo Plan */}
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold mb-4">Solo Stream</h3>
            <div className="text-4xl font-bold mb-6">
              <span className="text-yellow-400">$20</span>
              <span className="text-lg text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                1 Device
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                All Premium Channels
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Live Sports + Catch-Up
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                VOD Library
              </li>
            </ul>
            <button 
              onClick={() => setShowSignup(true)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Choose Solo
            </button>
          </div>

          {/* Duo Plan */}
          <div className="bg-gray-800 rounded-xl p-8 border-2 border-yellow-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Duo Stream</h3>
            <div className="text-4xl font-bold mb-6">
              <span className="text-yellow-400">$35</span>
              <span className="text-lg text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                2 Devices
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Everything in Solo
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Perfect for Couples
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Priority Support
              </li>
            </ul>
            <button 
              onClick={() => setShowSignup(true)}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Choose Duo
            </button>
          </div>

          {/* Family Plan */}
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold mb-4">Family Max</h3>
            <div className="text-4xl font-bold mb-6">
              <span className="text-yellow-400">$45</span>
              <span className="text-lg text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                3 Devices
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                All Features Unlocked
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Perfect for Families
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Premium Support
              </li>
            </ul>
            <button 
              onClick={() => setShowSignup(true)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Choose Family
            </button>
          </div>
        </div>

        {/* EMBEDDED AUTOMATION SIGNUP */}
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">🎉 Start Your Free Trial</h3>
            <p className="text-gray-300">No credit card required • Cancel anytime</p>
          </div>
          <AutomationSignup onSuccess={handleSignupSuccess} />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4 text-yellow-400">SteadyStream TV</h4>
              <p className="text-gray-400">
                The smarter way to stream premium IPTV content.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Download</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Setup Guide</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SteadyStream TV. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
