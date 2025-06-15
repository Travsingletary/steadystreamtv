
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  checkAdminAccess: () => Promise<boolean>;
  ensureAdminRole: (userId?: string) => Promise<boolean>;
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

  const checkAdminAccess = async (): Promise<boolean> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('No user found for admin check');
        return false;
      }

      console.log('Checking admin access for user:', user.id);
      console.log('User metadata:', user.user_metadata);
      console.log('App metadata:', user.app_metadata);
      
      // Check multiple possible locations for admin role
      const isAdminUser = user.user_metadata?.role === 'admin' || 
                         user.app_metadata?.role === 'admin' ||
                         user.user_metadata?.is_admin === true ||
                         user.app_metadata?.is_admin === true;
      
      console.log('Admin check result:', isAdminUser);
      return isAdminUser;
    } catch (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
  };

  const ensureAdminRole = async (userId?: string): Promise<boolean> => {
    try {
      // First check if role is already set
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user for admin role setup:', userError);
        return false;
      }
      
      if (user?.user_metadata?.role === 'admin') {
        console.log('Admin role already set');
        setIsAdmin(true);
        return true;
      }
      
      // If not, update the user metadata
      console.log('Setting admin role for user:', user.id);
      const { data, error } = await supabase.auth.updateUser({
        data: { role: 'admin', is_admin: true }
      });
      
      if (error) {
        console.error('Error updating admin role:', error);
        return false;
      }
      
      console.log('Admin role set successfully');
      setIsAdmin(true);
      return true;
    } catch (error) {
      console.error('Error in ensureAdminRole:', error);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      // Use setTimeout to prevent infinite loops with async operations
      setTimeout(async () => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User authenticated:', session.user.email);
          // Check admin status
          const adminStatus = await checkAdminAccess();
          setIsAdmin(adminStatus);
          console.log('Admin status set to:', adminStatus);
        } else {
          console.log('User signed out');
          setIsAdmin(false);
        }
        
        setLoading(false);
      }, 0);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setTimeout(async () => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const adminStatus = await checkAdminAccess();
          setIsAdmin(adminStatus);
        }
        
        setLoading(false);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }

      // Check admin status after successful login
      if (data.user) {
        setTimeout(async () => {
          const adminStatus = await checkAdminAccess();
          setIsAdmin(adminStatus);
          console.log('Post-login admin status:', adminStatus);
        }, 100);
      }
      
      return { error: null };
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
      setIsAdmin(false);
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
    checkAdminAccess,
    ensureAdminRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
