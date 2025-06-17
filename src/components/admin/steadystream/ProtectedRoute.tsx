
import React from 'react';
import { useAuth } from './AuthProvider';
import { AdminLogin } from './AdminLogin';

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
