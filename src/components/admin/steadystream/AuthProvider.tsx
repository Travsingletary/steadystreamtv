
import React, { useState, useEffect, createContext, useContext } from 'react';

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
