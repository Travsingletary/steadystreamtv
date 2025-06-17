
import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

// 🔐 ADMIN LOGIN COMPONENT - Clean, no loops
export const AdminLogin = () => {
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    // Don't need to handle success case - context will update automatically
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md border border-gray-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">SteadyStream Admin</h1>
          <p className="text-gray-400">Sign in to access the dashboard</p>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-6 text-sm">
            ❌ {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="admin@steadystreamtv.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm font-medium mb-2">Valid Credentials:</p>
            <div className="text-xs text-gray-400 space-y-1">
              <div>📧 admin@steadystreamtv.com</div>
              <div>🔐 Admin123!</div>
              <hr className="border-gray-600 my-2" />
              <div>📧 trav.singletary@gmail.com</div>
              <div>🔐 Password123!</div>
              <hr className="border-gray-600 my-2" />
              <div>📧 vincent@steadystreamtv.com</div>
              <div>🔐 Admin456!</div>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm">
            Need help? Contact{' '}
            <a href="mailto:support@steadystreamtv.com" className="text-yellow-400 hover:text-yellow-300">
              support@steadystreamtv.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
