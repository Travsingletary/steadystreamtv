
import React, { useState } from 'react';

// Fixed Supabase configuration with correct URL
const SUPABASE_URL = 'https://ojueihcytxwcioqtvwez.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM';

// Enhanced Automation Service
const AutomationService = {
  async registerUser(userData: any) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/automated-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          ...userData,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration automation failed:', error);
      throw error;
    }
  },

  async generatePlaylist(token: string) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/playlist-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Playlist generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Playlist generation failed:', error);
      throw error;
    }
  }
};

interface EnhancedAutomationProps {
  className?: string;
}

// Enhanced Automation Component
const EnhancedAutomation: React.FC<EnhancedAutomationProps> = ({ className = '' }) => {
  const [showModal, setShowModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSuccess = (data: any) => {
    setSuccessData(data);
    setShowModal(false);
  };

  return (
    <div className={className}>
      <AutomationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        loading={loading}
        setLoading={setLoading}
      />

      {successData && (
        <SuccessModal
          isOpen={!!successData}
          onClose={() => setSuccessData(null)}
          successData={successData}
        />
      )}

      <button 
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        🚀 Start Enhanced Setup
      </button>
    </div>
  );
};

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

// Enhanced Signup Modal
const AutomationModal: React.FC<AutomationModalProps> = ({ isOpen, onClose, onSuccess, loading, setLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'trial'
  });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
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
      const result = await AutomationService.registerUser(formData);

      if (result.success) {
        onSuccess(result.data);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'Network error - please try again');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-md w-full bg-gray-800 rounded-2xl p-8 shadow-2xl">
        
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            ⚡
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Enhanced Automation</h2>
          <p className="text-gray-400">Complete setup in under 60 seconds</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-600 text-white p-4 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
              placeholder="Create a password (6+ characters)"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Subscription Plan</label>
            <select
              value={formData.plan}
              onChange={(e) => updateField('plan', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
              disabled={loading}
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
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold py-4 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                Processing Automation...
              </div>
            ) : (
              '🚀 Start Enhanced Setup'
            )}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>✅ Supabase integration</p>
          <p>✅ MegaOTT token automation</p>
          <p>✅ Instant playlist generation</p>
          <p>✅ Automated email with QR codes</p>
        </div>
      </div>
    </div>
  );
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  successData: any;
}

// Enhanced Success Modal
const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, successData }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Replace with a proper toast notification if available
    alert('Copied to clipboard!');
  };

  if (!isOpen || !successData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl w-full bg-gray-800 rounded-2xl p-8 shadow-2xl max-h-screen overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-green-400 mb-2">🎉 Enhanced Setup Complete!</h2>
          <p className="text-gray-300 text-lg">Your SteadyStream TV account is ready with enhanced automation</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* Activation Code */}
          <div className="bg-gray-700 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-yellow-400 flex items-center">
              📱 <span className="ml-2">Activation Code</span>
            </h3>
            <div className="text-4xl font-mono text-center py-6 bg-gray-900 rounded-lg border border-gray-600 mb-4">
              <span className="text-green-400 tracking-wider">{successData.activationCode}</span>
            </div>
            <button 
              onClick={() => copyToClipboard(successData.activationCode)}
              className="w-full text-sm bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-3 px-4 rounded-lg transition-all duration-200"
            >
              📋 Copy Activation Code
            </button>
          </div>

          {/* QR Code */}
          <div className="bg-gray-700 p-6 rounded-xl text-center">
            <h3 className="text-xl font-semibold mb-4 text-yellow-400 flex items-center justify-center">
              📲 <span className="ml-2">Instant Setup</span>
            </h3>
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <img 
                src={successData.qrCode} 
                alt="Setup QR Code" 
                className="w-40 h-40"
              />
            </div>
            <p className="text-sm text-gray-400">Scan with your device camera</p>
          </div>

        </div>

        {/* Enhanced Playlist URL */}
        <div className="bg-gray-700 p-6 rounded-xl mb-6">
          <h3 className="text-xl font-semibold mb-4 text-yellow-400 flex items-center">
            🔗 <span className="ml-2">Your Enhanced Playlist</span>
          </h3>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 mb-4">
            <code className="text-sm text-green-400 break-all">{successData.playlistUrl}</code>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => copyToClipboard(successData.playlistUrl)}
              className="flex-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-3 px-4 rounded-lg transition-all duration-200"
            >
              📋 Copy Playlist URL
            </button>
            <button 
              onClick={() => window.open(successData.playlistUrl, '_blank')}
              className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
            >
              🎬 Test Playlist
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 text-center">
          <button 
            onClick={() => window.open('/dashboard', '_blank')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
          >
            📊 Access Dashboard
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
          >
            ✅ Complete Setup
          </button>
        </div>

        {/* Additional Features Notice */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-center">
          <p className="text-white font-medium">
            🎉 Enhanced automation includes: Smart playlist optimization, Dynamic channel management, 
            Advanced analytics, and Automated customer support integration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAutomation;
export { AutomationService };
