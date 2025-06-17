import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MegaOTTCredits } from '@/components/admin/MegaOTTCredits';

// 🔐 AUTHENTICATION CONTEXT - Fixes infinite loops
const AuthContext = createContext(null);

// Authentication Provider - Central state management
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount (ONLY ONCE)
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication status...');
        
        // Check for stored session
        const storedUser = localStorage.getItem('steadystream-admin-user');
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (mounted) {
              setUser(userData);
              setIsAuthenticated(true);
              console.log('✅ User restored from storage:', userData.email);
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse stored user data');
            localStorage.removeItem('steadystream-admin-user');
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

  // Login function with hardcoded credentials
  const login = async (email, password) => {
    setLoading(true);
    
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Hardcoded admin credentials
      const validCredentials = [
        { email: 'admin@steadystreamtv.com', password: 'Admin123!' },
        { email: 'trav.singletary@gmail.com', password: 'Password123!' },
        { email: 'vincent@steadystreamtv.com', password: 'Admin456!' }
      ];

      const validUser = validCredentials.find(
        cred => cred.email === email && cred.password === password
      );

      if (validUser) {
        const userData = {
          email: validUser.email,
          id: `admin-${Date.now()}`,
          role: 'admin'
        };

        // Store authentication data
        localStorage.setItem('steadystream-admin-user', JSON.stringify(userData));
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful:', userData.email);
        
        return { success: true, user: userData };
      } else {
        throw new Error('Invalid email or password');
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
      localStorage.removeItem('steadystream-admin-user');
      
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

// 📊 ADMIN DASHBOARD - Protected content with REAL DATA and better explanations
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    revenue: 0,
    megaottCredits: 0
  });
  const [loading, setLoading] = useState(true);
  const [dataBreakdown, setDataBreakdown] = useState({
    userProfilesCount: 0,
    profilesCount: 0,
    subscriptionsTotal: 0,
    subscriptionsActive: 0,
    resellersCount: 0,
    iptvAccountsCount: 0
  });

  // Fetch real data from Supabase with detailed breakdown
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);
        console.log('📊 Fetching detailed admin statistics...');

        // Get total users from user_profiles
        const { count: userProfilesCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        // Get total users from profiles (fallback)
        const { count: profilesCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get total subscriptions
        const { count: subscriptionsTotal } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true });

        // Get active subscriptions
        const { count: activeSubsCount } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .gte('end_date', new Date().toISOString());

        // Get resellers count
        const { count: resellersCount } = await supabase
          .from('resellers')
          .select('*', { count: 'exact', head: true });

        // Get IPTV accounts count
        const { count: iptvAccountsCount } = await supabase
          .from('iptv_accounts')
          .select('*', { count: 'exact', head: true });

        // Get MegaOTT credits with error handling
        const { data: resellersData, error: resellersError } = await supabase
          .from('resellers')
          .select('credits');

        let totalCredits = 0;
        if (!resellersError && resellersData && resellersData.length > 0) {
          totalCredits = resellersData.reduce((sum, reseller) => sum + (reseller.credits || 0), 0);
        }

        // Calculate total users (prioritize user_profiles, fallback to profiles)
        const totalUsers = userProfilesCount || profilesCount || 0;

        // Calculate estimated revenue
        const estimatedRevenue = (activeSubsCount || 0) * 30; // $30 average per subscription

        setStats({
          totalUsers: totalUsers,
          activeSubscriptions: activeSubsCount || 0,
          revenue: estimatedRevenue,
          megaottCredits: totalCredits
        });

        setDataBreakdown({
          userProfilesCount: userProfilesCount || 0,
          profilesCount: profilesCount || 0,
          subscriptionsTotal: subscriptionsTotal || 0,
          subscriptionsActive: activeSubsCount || 0,
          resellersCount: resellersCount || 0,
          iptvAccountsCount: iptvAccountsCount || 0
        });

        console.log('✅ Detailed data loaded:', {
          totalUsers,
          userProfilesCount,
          profilesCount,
          subscriptionsTotal,
          activeSubscriptions: activeSubsCount,
          resellersCount,
          iptvAccountsCount,
          totalCredits
        });

      } catch (error) {
        console.error('❌ Failed to fetch real data:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

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
          {/* Stats Cards with REAL DATA */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
            <div className="mt-4 text-blue-400 text-sm">
              📊 {dataBreakdown.userProfilesCount} user_profiles + {dataBreakdown.profilesCount} profiles
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Subscriptions</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : stats.activeSubscriptions.toLocaleString()}
                </p>
              </div>
              <div className="text-2xl">💳</div>
            </div>
            <div className="mt-4 text-green-400 text-sm">
              ✅ {dataBreakdown.subscriptionsActive} active of {dataBreakdown.subscriptionsTotal} total
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Estimated Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${loading ? '...' : stats.revenue.toLocaleString()}
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
            <div className="mt-4 text-green-400 text-sm">
              💼 ${stats.activeSubscriptions * 30}/month projection
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">MegaOTT Credits</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? '...' : stats.megaottCredits.toLocaleString()}
                </p>
              </div>
              <div className="text-2xl">🔋</div>
            </div>
            <div className="mt-4 text-green-400 text-sm">
              📊 {dataBreakdown.resellersCount} reseller accounts
            </div>
          </div>
        </div>

        {/* Data Breakdown Section */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4">📋 Database Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">User Tables</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">user_profiles:</span>
                  <span className="text-white font-bold">{dataBreakdown.userProfilesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">profiles:</span>
                  <span className="text-white font-bold">{dataBreakdown.profilesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">iptv_accounts:</span>
                  <span className="text-white font-bold">{dataBreakdown.iptvAccountsCount}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Subscriptions</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total:</span>
                  <span className="text-white font-bold">{dataBreakdown.subscriptionsTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Active:</span>
                  <span className="text-green-400 font-bold">{dataBreakdown.subscriptionsActive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Expired:</span>
                  <span className="text-red-400 font-bold">{dataBreakdown.subscriptionsTotal - dataBreakdown.subscriptionsActive}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">MegaOTT</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Resellers:</span>
                  <span className="text-white font-bold">{dataBreakdown.resellersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Credits:</span>
                  <span className="text-purple-400 font-bold">{stats.megaottCredits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className={`font-bold ${dataBreakdown.resellersCount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dataBreakdown.resellersCount > 0 ? 'Active' : 'No Resellers'}
                  </span>
                </div>
              </div>
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
