
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Globe, Plane, Car, Home, MapPin, CheckCircle, Wifi, X } from 'lucide-react';
import { SteadyStreamAutomation } from '../services/SteadyStreamAutomation';
import { UserData } from '@/services/types';

interface MobileAutomationProps {
  onClose?: () => void;
}

const MobileAutomation: React.FC<MobileAutomationProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<Partial<UserData>>({
    plan: 'trial',
    deviceType: 'mobile',
    preferences: {
      favoriteGenres: [],
      parentalControls: false,
      autoOptimization: true,
      videoQuality: 'HD'
    }
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!userData.name || !userData.email) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate secure password
      const password = Math.random().toString(36).slice(-12) + 'A1!';
      
      const completeUserData: UserData = {
        name: userData.name,
        email: userData.email,
        password: password,
        plan: userData.plan || 'trial',
        deviceType: 'mobile',
        preferences: userData.preferences || {
          favoriteGenres: [],
          parentalControls: false,
          autoOptimization: true,
          videoQuality: 'HD'
        }
      };

      const automationResult = await SteadyStreamAutomation.processCompleteSignup(completeUserData);
      
      if (automationResult.success) {
        setSuccessResult(automationResult);
        setShowSuccess(true);
      } else {
        setError(automationResult.error || 'Automation failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (showSuccess && successResult) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Success Modal */}
        <Card className="bg-gray-800 border-green-500">
          <CardHeader className="text-center border-b border-gray-700">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl text-green-400">🎉 Ready to Stream Anywhere!</CardTitle>
            <CardDescription className="text-gray-300">
              Welcome to mobile freedom, {userData.name}! Your TV travels with you now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            {/* Activation Code */}
            <div className="bg-gray-700 p-6 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-3 text-yellow-400">📱 Your Mobile Activation Code</h3>
              <div className="text-4xl font-mono bg-gray-900 p-4 rounded border border-gray-600 mb-4">
                <span className="text-green-400 tracking-wider">{successResult.activationCode}</span>
              </div>
              <Button 
                onClick={() => copyToClipboard(successResult.activationCode)}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
              >
                📋 Copy Code
              </Button>
            </div>

            {/* Playlist URL */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">🔗 Your Playlist URL</h3>
              <div className="bg-gray-900 p-3 rounded border border-gray-600 mb-3">
                <code className="text-sm text-green-400 break-all">{successResult.playlistUrl}</code>
              </div>
              <Button 
                onClick={() => copyToClipboard(successResult.playlistUrl)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                📋 Copy Playlist URL
              </Button>
            </div>

            {/* Xtream Codes */}
            {successResult.credentials && (
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-purple-400">🔐 Your Xtream Codes</h3>
                <div className="space-y-3">
                  <div className="bg-gray-900 p-3 rounded border border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Server:</span>
                      <span className="text-green-400 font-mono">{successResult.credentials.server}</span>
                    </div>
                  </div>
                  <div className="bg-gray-900 p-3 rounded border border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Port:</span>
                      <span className="text-green-400 font-mono">{successResult.credentials.port}</span>
                    </div>
                  </div>
                  <div className="bg-gray-900 p-3 rounded border border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Username:</span>
                      <span className="text-green-400 font-mono">{successResult.credentials.username}</span>
                    </div>
                  </div>
                  <div className="bg-gray-900 p-3 rounded border border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Password:</span>
                      <span className="text-green-400 font-mono">{successResult.credentials.password}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => copyToClipboard(`Server: ${successResult.credentials.server}\nPort: ${successResult.credentials.port}\nUsername: ${successResult.credentials.username}\nPassword: ${successResult.credentials.password}`)}
                  className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                >
                  📋 Copy All Credentials
                </Button>
              </div>
            )}

            {/* Mobile Setup Instructions */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">⚡ Quick Mobile Setup (2 minutes)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">📱 On Your Phone/Tablet:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                    <li>Download TiviMate app</li>
                    <li>Open app → "Add Playlist"</li>
                    <li>Enter your activation code: <span className="text-green-400 font-mono">{successResult.activationCode}</span></li>
                    <li>Start streaming anywhere! 🌍</li>
                  </ol>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">💻 On Laptop/Computer:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                    <li>Visit aftv.news/1592817</li>
                    <li>Use download code: 1592817</li>
                    <li>Install and enter activation code</li>
                    <li>Stream from anywhere! ✈️</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Where You Can Stream */}
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-blue-200">🌍 Now You Can Stream:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Car className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-blue-200">During Commutes</p>
                </div>
                <div className="text-center">
                  <Plane className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-blue-200">While Traveling</p>
                </div>
                <div className="text-center">
                  <Home className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-blue-200">At Home</p>
                </div>
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-blue-200">Anywhere</p>
                </div>
              </div>
            </div>

            {/* QR Code for Mobile */}
            <div className="bg-gray-700 p-6 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-3 text-yellow-400">📲 Quick Mobile Setup</h3>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(successResult.playlistUrl || '')}`} 
                  alt="Mobile Setup QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-400">Scan with your phone camera to get started</p>
            </div>

            {/* Close Button */}
            <div className="text-center pt-4">
              <Button 
                onClick={onClose}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                Done - Start Streaming! 🚀
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with close button */}
      {onClose && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= num
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {num}
            </div>
          ))}
        </div>
        <div className="text-center text-gray-400 text-sm">
          Step {step} of 4 - Get Your Mobile TV Ready
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <Smartphone className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <CardTitle className="text-2xl">Welcome to Mobile TV Freedom! 📱</CardTitle>
            <CardDescription className="text-gray-300">
              Your entertainment goes where you go. Let's set up your mobile streaming experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Full Name</label>
              <input
                type="text"
                value={userData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Email Address</label>
              <input
                type="email"
                value={userData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
                placeholder="Enter your email"
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleNext}
                disabled={!userData.name || !userData.email}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                Next - Choose Your Streaming Plan →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <Globe className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <CardTitle className="text-2xl">Choose Your Mobile Streaming Plan</CardTitle>
            <CardDescription className="text-gray-300">
              How many devices do you want to stream on simultaneously?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 mb-6">
              {/* Free Trial */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  userData.plan === 'trial' 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => handleInputChange('plan', 'trial')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-400">🎉 24-Hour Free Trial</h3>
                    <p className="text-sm text-gray-300">Perfect for testing mobile streaming</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">FREE</p>
                  </div>
                </div>
              </div>

              {/* Paid Plans */}
              {[
                { id: 'standard', name: 'Solo Stream', price: 20, streams: 1, desc: 'Perfect for individual mobile streaming' },
                { id: 'premium', name: 'Duo Stream', price: 35, streams: 2, desc: 'Great for couples on-the-go', popular: true },
                { id: 'ultimate', name: 'Family Stream', price: 45, streams: 3, desc: 'Perfect for traveling families' }
              ].map((plan) => (
                <div 
                  key={plan.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                    userData.plan === plan.id 
                      ? 'border-yellow-500 bg-yellow-900/20' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => handleInputChange('plan', plan.id)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-4 bg-yellow-500 text-black">MOST POPULAR</Badge>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-300">{plan.desc}</p>
                      <p className="text-sm text-yellow-400">{plan.streams} simultaneous streams anywhere</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-400">${plan.price}</p>
                      <p className="text-sm text-gray-400">/month</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button 
                onClick={handleBack}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                ← Back
              </Button>
              <Button 
                onClick={handleNext}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                Next - Where You'll Stream →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <MapPin className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <CardTitle className="text-2xl">Where Will You Stream?</CardTitle>
            <CardDescription className="text-gray-300">
              Select your favorite streaming locations and content preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-white">Favorite Content Types</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Sports', 'Movies', 'News', 'Entertainment', 'Kids', 'Documentary'].map((genre) => (
                  <div
                    key={genre}
                    className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                      userData.preferences?.favoriteGenres?.includes(genre.toLowerCase())
                        ? 'border-yellow-500 bg-yellow-900/20 text-yellow-400'
                        : 'border-gray-600 hover:border-gray-500 text-gray-300'
                    }`}
                    onClick={() => {
                      const current = userData.preferences?.favoriteGenres || [];
                      const genre_lower = genre.toLowerCase();
                      const updated = current.includes(genre_lower)
                        ? current.filter(g => g !== genre_lower)
                        : [...current, genre_lower];
                      
                      handleInputChange('preferences', {
                        ...userData.preferences,
                        favoriteGenres: updated
                      });
                    }}
                  >
                    {genre}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-white">Video Quality Preference</label>
              <div className="grid grid-cols-3 gap-3">
                {['HD', '4K', 'Auto'].map((quality) => (
                  <div
                    key={quality}
                    className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                      userData.preferences?.videoQuality === quality
                        ? 'border-yellow-500 bg-yellow-900/20 text-yellow-400'
                        : 'border-gray-600 hover:border-gray-500 text-gray-300'
                    }`}
                    onClick={() => handleInputChange('preferences', {
                      ...userData.preferences,
                      videoQuality: quality
                    })}
                  >
                    {quality}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                onClick={handleBack}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                ← Back
              </Button>
              <Button 
                onClick={handleNext}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                Next - Final Review →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <Wifi className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <CardTitle className="text-2xl">Ready to Stream Anywhere! 🌍</CardTitle>
            <CardDescription className="text-gray-300">
              Review your mobile streaming setup and activate your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-600 text-white p-3 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}

            <div className="bg-gray-700 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-white">📋 Your Mobile Streaming Setup:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="text-gray-400">Name:</span> <span className="text-white">{userData.name}</span></p>
                  <p><span className="text-gray-400">Email:</span> <span className="text-white">{userData.email}</span></p>
                </div>
                <div>
                  <p><span className="text-gray-400">Plan:</span> <span className="text-yellow-400">
                    {userData.plan === 'trial' ? '24-Hour Free Trial' : 
                     userData.plan === 'standard' ? 'Solo Stream ($20/mo)' :
                     userData.plan === 'premium' ? 'Duo Stream ($35/mo)' :
                     'Family Stream ($45/mo)'}
                  </span></p>
                  <p><span className="text-gray-400">Content:</span> <span className="text-white">
                    {userData.preferences?.favoriteGenres?.length ? 
                      userData.preferences.favoriteGenres.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ') : 
                      'All Categories'}
                  </span></p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-900 to-blue-900 p-6 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-4 text-green-200">🎉 What You Get:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <Car className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-green-200">Stream During Commutes</p>
                </div>
                <div className="text-center">
                  <Plane className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-green-200">Watch While Traveling</p>
                </div>
                <div className="text-center">
                  <Smartphone className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-green-200">Any Mobile Device</p>
                </div>
                <div className="text-center">
                  <Globe className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-green-200">Stream Anywhere</p>
                </div>
              </div>
              <p className="text-sm text-green-200">Instant activation • No credit card required for trial</p>
            </div>

            <div className="flex justify-between">
              <Button 
                onClick={handleBack}
                variant="outline"
                className="border-gray-600 text-gray-300"
                disabled={loading}
              >
                ← Back
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={loading}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
              >
                {loading ? '🔄 Setting Up Your Mobile TV...' : '🚀 Start Mobile Streaming!'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileAutomation;
