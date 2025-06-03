
import React, { useState } from 'react';
import AutomationService from '../services/AutomationService';

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
    setError(''); // Clear error when user types
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

    setLoading(true);
    setError('');

    const result = await AutomationService.registerUser(formData);

    if (result.success) {
      // Call parent success handler with all the data
      onSuccess && onSuccess({
        user: result.user,
        activationCode: result.activationCode,
        playlistUrl: result.playlistUrl,
        userData: formData
      });
    } else {
      setError(result.error);
    }

    setLoading(false);
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
          onClick={handleSubmit}
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

export default AutomationSignup;
