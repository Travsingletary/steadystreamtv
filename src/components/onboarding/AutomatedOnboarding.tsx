import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedMegaOTTService } from '@/services/enhancedMegaOTTService';

interface OnboardingProps {
  onComplete: (data: any) => void;
}

export const AutomatedOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    plan: 'trial',
    deviceType: '',
    preferences: {
      favoriteCategories: [] as string[],
      blockedCategories: [] as string[],
      preferredQuality: 'auto'
    }
  });
  const [setupData, setSetupData] = useState<any>(null);

  // Step 1: Create account
  const createAccount = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            plan: formData.plan
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. Create user profile in new table
      const { error: profileError } = await supabase
        .from('user_profiles_new')
        .insert({
          id: authData.user.id,
          full_name: formData.name,
          email: formData.email,
          subscription_plan: formData.plan,
          device_type: formData.deviceType,
          onboarding_completed: false
        });

      if (profileError) throw profileError;

      // 3. Store user preferences in enhanced table
      const { error: prefError } = await supabase
        .from('user_preferences_enhanced')
        .insert({
          user_id: authData.user.id,
          favorite_categories: formData.preferences.favoriteCategories,
          blocked_categories: formData.preferences.blockedCategories,
          preferred_quality: formData.preferences.preferredQuality,
          parental_controls: false,
          language_preference: 'en'
        });

      if (prefError) console.warn('Preferences save failed:', prefError);

      // 4. Use enhanced MegaOTT service to create user line
      const subscriptionResult = await EnhancedMegaOTTService.createUserLine(
        formData.email,
        formData.plan
      );

      if (!subscriptionResult.success) {
        throw new Error('Failed to create IPTV subscription');
      }

      // 5. Generate playlist URL based on subscription result
      const playlistUrl = subscriptionResult.m3uUrl || 
        `${window.location.origin}/api/playlist/${authData.user.id}`;

      // 6. Create setup data with available information
      const deviceInfo = formData.deviceType ? {
        deviceId: `${formData.deviceType}_${Date.now()}`,
        deviceName: `${formData.name}'s ${formData.deviceType}`,
        deviceType: formData.deviceType
      } : null;

      // 7. Send welcome email
      await sendWelcomeEmail(authData.user.id, {
        ...subscriptionResult,
        playlistUrl,
        name: formData.name,
        email: formData.email,
        deviceInfo
      });

      // 8. Mark onboarding as complete
      await supabase
        .from('user_profiles_new')
        .update({ onboarding_completed: true })
        .eq('id', authData.user.id);

      setSetupData({
        ...subscriptionResult,
        playlistUrl,
        userId: authData.user.id,
        email: formData.email,
        name: formData.name,
        deviceInfo
      });

      setStep(4); // Go to success step
      setLoading(false);

    } catch (err: any) {
      console.error('Account creation error:', err);
      setError(err.message || 'An error occurred during setup');
      setLoading(false);
    }
  };

  // Send welcome email with setup instructions
  const sendWelcomeEmail = async (userId: string, data: any) => {
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          to: data.email,
          subject: 'Welcome to SteadyStream TV - Your Account is Ready!',
          name: data.name,
          credentials: {
            username: data.credentials?.username || 'N/A',
            password: data.credentials?.password || 'N/A',
            server_url: data.credentials?.server || 'N/A',
            playlist_url: data.playlistUrl || 'N/A',
            activationCode: data.activationCode || 'N/A',
            maxConnections: data.credentials?.deviceLimit || 1,
            expiration: data.expiryDate || new Date()
          },
          planType: formData.plan
        }
      });
    } catch (error) {
      console.warn('Email send failed:', error);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-center text-white">Create Your Account</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white"
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Choose Your Plan</label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white"
                >
                  <option value="trial">24-Hour Free Trial</option>
                  <option value="solo">Solo Stream - $20/month (1 Device)</option>
                  <option value="duo">Duo Stream - $35/month (2 Devices)</option>
                  <option value="family">Family Max - $45/month (3 Devices)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.email || !formData.password}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-center text-white">Select Your Device</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'firestick', name: 'Fire TV Stick', icon: '🔥' },
                { id: 'androidtv', name: 'Android TV', icon: '📺' },
                { id: 'android', name: 'Android Phone', icon: '📱' },
                { id: 'ios', name: 'iPhone/iPad', icon: '🍎' }
              ].map((device) => (
                <button
                  key={device.id}
                  onClick={() => setFormData({ ...formData, deviceType: device.id })}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    formData.deviceType === device.id
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-3xl mb-2">{device.icon}</div>
                  <div className="font-medium text-white">{device.name}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-600 hover:border-gray-500 text-white font-bold py-3 px-6 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.deviceType}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-lg disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-center text-white">Customize Your Experience</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Favorite Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Sports', 'Movies', 'News', 'Kids', 'Entertainment', 'Documentary'].map((cat) => (
                    <label key={cat} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 text-white">
                      <input
                        type="checkbox"
                        checked={formData.preferences.favoriteCategories.includes(cat)}
                        onChange={(e) => {
                          const favorites = e.target.checked
                            ? [...formData.preferences.favoriteCategories, cat]
                            : formData.preferences.favoriteCategories.filter(c => c !== cat);
                          setFormData({
                            ...formData,
                            preferences: { ...formData.preferences, favoriteCategories: favorites }
                          });
                        }}
                        className="text-yellow-500"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Preferred Quality</label>
                <select
                  value={formData.preferences.preferredQuality}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, preferredQuality: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="auto">Auto (Recommended)</option>
                  <option value="sd">SD - Standard Definition</option>
                  <option value="hd">HD - High Definition</option>
                  <option value="fhd">Full HD - 1080p</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-600 hover:border-gray-500 text-white font-bold py-3 px-6 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={createAccount}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Setting Up...' : 'Complete Setup'}
              </button>
            </div>

            {error && (
              <div className="bg-red-600 text-white p-3 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-green-400 mb-2">You're All Set!</h2>
              <p className="text-gray-300">Welcome to SteadyStream TV, {formData.name}!</p>
            </div>

            {setupData && (
              <div className="space-y-4">
                {/* Optimized Playlist URL */}
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">🔗 Your Optimized Playlist</h3>
                  <div className="bg-gray-900 p-3 rounded border border-gray-600 mb-2">
                    <code className="text-sm text-green-400 break-all">{setupData.playlistUrl}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(setupData.playlistUrl, 'Playlist URL')}
                    className="w-full text-sm bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-2 px-4 rounded"
                  >
                    📋 Copy Playlist URL
                  </button>
                </div>

                {/* Login Credentials */}
                {setupData.credentials && (
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-yellow-400">🔐 Login Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
                        <span className="text-sm text-gray-400">Username:</span>
                        <code className="text-green-400">{setupData.credentials.username}</code>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
                        <span className="text-sm text-gray-400">Password:</span>
                        <code className="text-green-400">{setupData.credentials.password}</code>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
                        <span className="text-sm text-gray-400">Server:</span>
                        <code className="text-green-400">{setupData.credentials.server}</code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activation Code */}
                {setupData.activationCode && (
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-yellow-400">🎯 Activation Code</h3>
                    <div className="bg-gray-900 p-3 rounded border border-gray-600 text-center">
                      <code className="text-2xl text-green-400 font-bold">{setupData.activationCode}</code>
                    </div>
                  </div>
                )}

                {/* Setup Instructions */}
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-400">⚡ Quick Setup Guide</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                    <li>Download TiviMate using code <span className="font-mono bg-gray-900 px-2 py-1 rounded">1592817</span></li>
                    <li>Open TiviMate and select "Add Playlist"</li>
                    <li>Choose "Xtream Codes Login" for best quality</li>
                    <li>Enter the server URL, username, and password above</li>
                    <li>Or use "M3U Playlist" and paste the playlist URL</li>
                    <li>Start enjoying your optimized streaming experience!</li>
                  </ol>
                </div>

                {/* QR Code */}
                {setupData.playlistUrl && (
                  <div className="text-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.playlistUrl)}`}
                      alt="Playlist QR Code"
                      className="mx-auto rounded-lg"
                    />
                    <p className="text-sm text-gray-400 mt-2">Scan for quick mobile setup</p>
                  </div>
                )}

                <button
                  onClick={() => onComplete(setupData)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-xl p-8 shadow-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-1/4 h-2 mx-1 rounded-full transition-all ${
                s <= step ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        <div className="text-center text-sm text-gray-400">
          Step {step} of 4
        </div>
      </div>

      {renderStep()}
    </div>
  );
};
