import React, { useState, useEffect, createContext, useContext } from 'react';
import { MegaOTTCredits } from '@/components/admin/MegaOTTCredits';

// 🔐 AUTHENTICATION CONTEXT - Fixes infinite loops
const AuthContext = createContext(null);

// Authentication Provider - Central state management
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Supabase configuration
  const SUPABASE_URL = 'https://ojuethcytwcioqtvwez.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWV0aGN5dHdjaW9xdHZ3ZXoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNzEwODc1NywiZXhwIjoyMDMyNjg0NzU3fQ.NRQhx23mPLBzZojnK_vzUPR_FcpPXgzk88iZAcpvxoo';

  // Check authentication status on mount (ONLY ONCE)
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication status...');
        
        // Check for stored session
        const storedToken = localStorage.getItem('sb-access-token');
        const storedUser = localStorage.getItem('sb-user');
        
        if (storedToken && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (mounted) {
              setUser(userData);
              setIsAuthenticated(true);
              console.log('✅ User restored from storage:', userData.email);
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse stored user data');
            localStorage.removeItem('sb-access-token');
            localStorage.removeItem('sb-user');
          }
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - run only once

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Login failed');
      }

      const authData = await response.json();
      
      if (authData.access_token && authData.user) {
        // Store authentication data
        localStorage.setItem('sb-access-token', authData.access_token);
        localStorage.setItem('sb-user', JSON.stringify(authData.user));
        
        // Update state
        setUser(authData.user);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful:', authData.user.email);
        
        return { success: true, user: authData.user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      setUser(null);
      setIsAuthenticated(false);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      // Clear local storage
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-user');
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ Logout successful');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Logout failed:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 🔒 PROTECTED ROUTE COMPONENT - Prevents infinite loops
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // If authenticated, render the protected content
  return children;
};

// 🔐 ADMIN LOGIN COMPONENT - Clean, no loops
const AdminLogin = () => {
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

// 📊 ADMIN DASHBOARD - Protected content
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 1234,
    activeSubscriptions: 987,
    revenue: 24567,
    megaottCredits: 0
  });

  const handleLogout = async () => {
    await logout();
  };

  const onStatsUpdate = (newStats) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-yellow-400">SteadyStream Admin</h1>
              <p className="text-gray-400 text-sm">Welcome back, {user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
            <div className="mt-4 text-green-400 text-sm">
              ↗ +12% from last month
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-white">{stats.activeSubscriptions.toLocaleString()}</p>
              </div>
              <div className="text-2xl">💳</div>
            </div>
            <div className="mt-4 text-green-400 text-sm">
              ↗ +8% from last month
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Revenue</p>
                <p className="text-2xl font-bold text-white">${stats.revenue.toLocaleString()}</p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
            <div className="mt-4 text-green-400 text-sm">
              ↗ +15% from last month
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">MegaOTT Credits</p>
                <p className="text-2xl font-bold text-white">{stats.megaottCredits.toLocaleString()}</p>
              </div>
              <div className="text-2xl">🔋</div>
            </div>
            <div className="mt-4 text-green-400 text-sm">
              ✅ All systems operational
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-3 px-6 rounded-lg transition-colors">
              📊 View Analytics
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
              👥 Manage Users
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
              ⚙️ System Settings
            </button>
          </div>
        </div>

        {/* MegaOTT Credits Section */}
        <MegaOTTCredits onStatsUpdate={onStatsUpdate} />
      </main>
    </div>
  );
};

// 🚀 MAIN APP COMPONENT - Proper structure to prevent loops
const App = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;
