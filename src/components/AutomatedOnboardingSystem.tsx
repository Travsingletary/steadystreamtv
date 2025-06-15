
// =====================================
// REACT COMPONENT FOR FRONTEND
// =====================================
import React, { useState } from 'react';
import { AutomatedRegistrationService } from '@/services/automatedRegistrationService';
import type { UnifiedUserData, RegistrationResult } from '@/types/automation';

export const AutomatedOnboardingSystem: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [formData, setFormData] = useState<UnifiedUserData>({
    name: '',
    email: '',
    password: '',
    plan: 'trial'
  });

  const registrationService = new AutomatedRegistrationService();

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const registrationResult = await registrationService.registerUser(formData);
    setResult(registrationResult);
    setLoading(false);

    if (registrationResult.success) {
      setShowModal(false);
      setShowSuccess(true);
    } else {
      alert(`Registration failed: ${registrationResult.error}`);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-8 rounded-lg transition-all duration-200"
      >
        🚀 Start Free Trial
      </button>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Start Your IPTV Journey
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
              
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
              
              <input
                type="password"
                placeholder="Password (6+ characters)"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
              
              <select
                value={formData.plan}
                onChange={(e) => setFormData({...formData, plan: e.target.value as any})}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="trial">🎉 24-Hour FREE Trial</option>
                <option value="solo">💰 $20/month - Solo Stream (1 Device)</option>
                <option value="duo">💎 $35/month - Duo Stream (2 Devices)</option>
                <option value="family">👨‍👩‍👧‍👦 $45/month - Family Max (3 Devices)</option>
              </select>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? '🔄 Creating...' : '🚀 Get Started'}
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-400">
              <p>✅ No credit card required for trial</p>
              <p>✅ Instant activation in 60 seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && result?.success && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">✅</span>
              </div>
              <h2 className="text-3xl font-bold text-green-400">Welcome to SteadyStream TV!</h2>
              <p className="text-gray-300">Your IPTV account is ready to stream!</p>
            </div>

            <div className="bg-gray-700 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">🔐 Your IPTV Credentials</h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <strong>Username:</strong> 
                  <code className="ml-2 bg-gray-900 px-2 py-1 rounded">{result.credentials?.username}</code>
                </div>
                <div className="flex justify-between items-center">
                  <strong>Password:</strong> 
                  <code className="ml-2 bg-gray-900 px-2 py-1 rounded">{result.credentials?.password}</code>
                </div>
                <div className="flex justify-between items-center">
                  <strong>Server:</strong> 
                  <code className="ml-2 bg-gray-900 px-2 py-1 rounded">{result.credentials?.serverUrl}</code>
                </div>
                {result.credentials?.activationCode && (
                  <div className="flex justify-between items-center">
                    <strong>Activation Code:</strong> 
                    <code className="ml-2 bg-gray-900 px-2 py-1 rounded">{result.credentials.activationCode}</code>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center space-y-4">
              <button
                onClick={() => setShowSuccess(false)}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-8 rounded-lg"
              >
                🎬 Start Streaming Now
              </button>
              
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setShowModal(false);
                  setResult(null);
                  setFormData({ name: '', email: '', password: '', plan: 'trial' });
                }}
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-400">
              <p>📧 Detailed setup instructions sent to your email</p>
              <p>📞 Need help? Contact support@steadystreamtv.com</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AutomatedOnboardingSystem;
