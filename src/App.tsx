
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Player from '@/pages/Player';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Favorites from '@/pages/Favorites';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/onboarding" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/player" element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        } />
        <Route path="/favorites" element={
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        } />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
