
import React, { useState } from 'react';
import { useCorrectedAutomation } from '@/hooks/useCorrectedAutomation';

const MobileAutomation = () => {
  const [showModal, setShowModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const { loading, error, result, executeAutomation, reset } = useCorrectedAutomation();

  const handleOpenModal = () => {
    reset();
    setShowModal(true);
  };

  const handleSuccess = (data: any) => {
    setSuccessData(data);
    setShowModal(false);
  };

  return (
    <div className="w-full">
      <SignupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        executeAutomation={executeAutomation}
        loading={loading}
        error={error}
      />

      {successData && (
        <SuccessModal
          isOpen={!!successData}
          onClose={() => setSuccessData(null)}
          successData={successData}
        />
      )}

      <button 
        onClick={handleOpenModal}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        🚀 Start with Real MegaOTT
      </button>
    </div>
  );
};

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  executeAutomation: (userData: any) => Promise<any>;
  loading: boolean;
  error: string | null;
}

const SignupModal: React.FC<SignupModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  executeAutomation, 
  loading, 
  error 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'trial',
    allowAdult: false
  });
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setValidationError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    setValidationError('');

    try {
      const result = await executeAutomation(formData);

      if (result.success) {
        onSuccess(result);
      } else {
        setValidationError(result.error || 'Registration failed');
      }
    } catch (error: any) {
      setValidationError(error.message || 'Network error - please try again');
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError('');
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
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            🚀
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Real MegaOTT Integration</h2>
          <p className="text-gray-400">Get actual IPTV credentials in seconds</p>
        </div>

        {(error || validationError) && (
          <div className="mb-6 bg-red-600 text-white p-4 rounded-lg text-sm">
            ❌ {error || validationError}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
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
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
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
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              placeholder="Create a password (6+ characters)"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Subscription Plan</label>
            <select
              value={formData.plan}
              onChange={(e) => updateField('plan', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              disabled={loading}
            >
              <option value="trial">🎉 24-Hour FREE Trial</option>
              <option value="basic">💰 Basic Plan (1 Device)</option>
              <option value="duo">💎 Duo Plan (2 Devices)</option>
              <option value="family">👨‍👩‍👧‍👦 Family Plan (3 Devices)</option>
              <option value="premium">⭐ Premium Plan (3 Devices)</option>
              <option value="ultimate">🔥 Ultimate Plan (5 Devices)</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowAdult"
              checked={formData.allowAdult}
              onChange={(e) => updateField('allowAdult', e.target.checked)}
              className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="allowAdult" className="text-sm text-gray-300">
              Include adult content (18+)
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating MegaOTT Account...
              </div>
            ) : (
              '🚀 Create Real IPTV Account'
            )}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>✅ Real MegaOTT API integration</p>
          <p>✅ Instant IPTV credentials</p>
          <p>✅ Professional M3U playlists</p>
          <p>✅ Smart TV compatibility</p>
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

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, successData }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
          <h2 className="text-4xl font-bold text-green-400 mb-2">🎉 Real MegaOTT Account Created!</h2>
          <p className="text-gray-300 text-lg">{successData.message}</p>
          {successData.source && (
            <p className="text-blue-400 text-sm mt-2">
              Source: {successData.source === 'megaott_api' ? 'Live MegaOTT API' : 'Fallback System'}
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          
          {/* Activation Code */}
          <div className="bg-gray-700 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-blue-400 flex items-center">
              📱 <span className="ml-2">Activation Code</span>
            </h3>
            <div className="text-4xl font-mono text-center py-6 bg-gray-900 rounded-lg border border-gray-600 mb-4">
              <span className="text-green-400 tracking-wider">{successData.activationCode}</span>
            </div>
            <button 
              onClick={() => copyToClipboard(successData.activationCode)}
              className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
            >
              📋 Copy Activation Code
            </button>
          </div>

          {/* IPTV Credentials */}
          <div className="bg-gray-700 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4 text-green-400 flex items-center">
              🔐 <span className="ml-2">IPTV Credentials</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Server:</span>
                <span className="text-white font-mono">{successData.credentials?.server}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Port:</span>
                <span className="text-white font-mono">{successData.credentials?.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Username:</span>
                <span className="text-white font-mono">{successData.credentials?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Password:</span>
                <span className="text-white font-mono">{successData.credentials?.password}</span>
              </div>
              {successData.megaottId && (
                <div className="flex justify-between">
                  <span className="text-gray-400">MegaOTT ID:</span>
                  <span className="text-white font-mono">{successData.megaottId}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* M3U Playlist URL */}
        <div className="bg-gray-700 p-6 rounded-xl mb-6">
          <h3 className="text-xl font-semibold mb-4 text-purple-400 flex items-center">
            🔗 <span className="ml-2">M3U Playlist URL</span>
          </h3>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 mb-4">
            <code className="text-sm text-green-400 break-all">{successData.playlistUrl}</code>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => copyToClipboard(successData.playlistUrl)}
              className="flex-1 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
            >
              📋 Copy M3U URL
            </button>
            <button 
              onClick={() => window.open(successData.playlistUrl, '_blank')}
              className="flex-1 text-sm bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
            >
              🎬 Test Playlist
            </button>
          </div>
        </div>

        {/* Smart TV URL */}
        {successData.smartTvUrl && (
          <div className="bg-gray-700 p-6 rounded-xl mb-6">
            <h3 className="text-xl font-semibold mb-4 text-yellow-400 flex items-center">
              📺 <span className="ml-2">Smart TV URL</span>
            </h3>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 mb-4">
              <code className="text-sm text-green-400 break-all">{successData.smartTvUrl}</code>
            </div>
            <button 
              onClick={() => copyToClipboard(successData.smartTvUrl)}
              className="w-full text-sm bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-3 px-4 rounded-lg transition-all duration-200"
            >
              📋 Copy Smart TV URL
            </button>
          </div>
        )}

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

        {/* Success Notice */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg text-center">
          <p className="text-white font-medium">
            🎉 Real MegaOTT integration active! Your IPTV credentials are live and ready to use.
            {successData.expiryDate && ` Expires: ${new Date(successData.expiryDate).toLocaleDateString()}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileAutomation;
