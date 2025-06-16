
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { checkAdminStatusWithCircuitBreaker, resetRedirectCount } from '@/utils/adminCircuitBreaker';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async (): Promise<boolean> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setIsAdmin(false);
        return false;
      }

      console.log('Checking admin status for user:', currentUser.id);

      const adminStatus = await checkAdminStatusWithCircuitBreaker(currentUser.id);
      setIsAdmin(adminStatus);
      return adminStatus;
      
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      
      // Use cached status if available
      const cachedAdminStatus = localStorage.getItem('admin_check_cache');
      if (cachedAdminStatus) {
        try {
          const cachedData = JSON.parse(cachedAdminStatus);
          const isExpired = Date.now() - cachedData.timestamp > 300000; // 5 minutes
          
          if (!isExpired) {
            console.log('Using cached admin status after error');
            setIsAdmin(cachedData.isAdmin);
            return cachedData.isAdmin;
          }
        } catch (e) {
          console.warn('Invalid cached admin data');
        }
      }
      
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      setTimeout(async () => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User authenticated:', session.user.email);
          await checkAdminStatus();
        } else {
          console.log('User signed out');
          setIsAdmin(false);
          // Clear admin-related storage on sign out
          localStorage.removeItem('admin_check_cache');
          resetRedirectCount();
        }
        
        setLoading(false);
      }, 0);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setTimeout(async () => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkAdminStatus();
        }
        
        setLoading(false);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Clear any previous admin check state
      resetRedirectCount();
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear admin-related storage on sign out
      localStorage.removeItem('admin_check_cache');
      resetRedirectCount();
      
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    checkAdminStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
