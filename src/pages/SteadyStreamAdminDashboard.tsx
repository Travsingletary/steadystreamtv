
import React from 'react';
import { AuthProvider } from '@/components/admin/steadystream/AuthProvider';
import { ProtectedRoute } from '@/components/admin/steadystream/ProtectedRoute';
import { AdminDashboard } from '@/components/admin/steadystream/AdminDashboard';

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
