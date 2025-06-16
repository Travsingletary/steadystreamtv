
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

      // Add circuit breaker to prevent infinite loops
      const storedCount = sessionStorage.getItem('admin_check_count') || '0';
      const checkCount = parseInt(storedCount, 10);
      
      if (checkCount > 5) {
        console.warn('Admin check circuit breaker triggered, using fallback');
        
        // Check for hardcoded admin user as fallback
        if (currentUser.id === 'de395bc5-08a6-4359-934a-e7509b4eff46') {
          console.log('Using hardcoded admin status for known admin user');
          localStorage.setItem('user_is_admin', 'true');
          setIsAdmin(true);
          return true;
        }
        
        // Check cached admin status
        const cachedAdminStatus = localStorage.getItem('user_is_admin');
        if (cachedAdminStatus === 'true') {
          console.log('Using cached admin status');
          setIsAdmin(true);
          return true;
        }
        
        setIsAdmin(false);
        return false;
      }

      // Increment check count
      sessionStorage.setItem('admin_check_count', (checkCount + 1).toString());

      // Try multiple methods to check admin status with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          // Method 1: Check user metadata first (fastest)
          const isAdminFromMetadata = currentUser.user_metadata?.role === 'admin' || 
                                    currentUser.app_metadata?.role === 'admin' ||
                                    currentUser.user_metadata?.is_admin === true;

          if (isAdminFromMetadata) {
            console.log('Admin status confirmed from user metadata');
            localStorage.setItem('user_is_admin', 'true');
            sessionStorage.setItem('admin_check_count', '0'); // Reset counter on success
            setIsAdmin(true);
            return true;
          }

          // Method 2: Check admin_roles table
          const { data: adminRole, error } = await supabase
            .from('admin_roles')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();
          
          if (!error && adminRole) {
            console.log('Admin status confirmed from admin_roles table');
            localStorage.setItem('user_is_admin', 'true');
            sessionStorage.setItem('admin_check_count', '0'); // Reset counter on success
            setIsAdmin(true);
            return true;
          }

          // If we get here without errors, user is not admin
          if (!error || error.code === 'PGRST116') { // PGRST116 = no rows found
            console.log('User is not admin');
            localStorage.setItem('user_is_admin', 'false');
            sessionStorage.setItem('admin_check_count', '0'); // Reset counter on success
            setIsAdmin(false);
            return false;
          }

          // If there was an error, retry
          throw error;

        } catch (error: any) {
          console.error(`Admin check attempt ${attempts + 1} failed:`, error);
          attempts++;
          
          if (attempts < maxAttempts) {
            // Wait before retrying with exponential backoff
            const delay = Math.pow(2, attempts) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All attempts failed - use fallback logic
      console.error('All admin check attempts failed, using fallback');
      
      // Hardcoded fallback for known admin user
      if (currentUser.id === 'de395bc5-08a6-4359-934a-e7509b4eff46') {
        console.log('Using hardcoded admin status for known admin user');
        localStorage.setItem('user_is_admin', 'true');
        setIsAdmin(true);
        return true;
      }

      // Check cached status as last resort
      const cachedAdminStatus = localStorage.getItem('user_is_admin');
      if (cachedAdminStatus === 'true') {
        console.log('Using cached admin status as fallback');
        setIsAdmin(true);
        return true;
      }

      setIsAdmin(false);
      return false;
      
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      
      // Use cached status if available
      const cachedAdminStatus = localStorage.getItem('user_is_admin');
      if (cachedAdminStatus === 'true') {
        console.log('Using cached admin status after error');
        setIsAdmin(true);
        return true;
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
          localStorage.removeItem('user_is_admin');
          sessionStorage.removeItem('admin_check_count');
          sessionStorage.removeItem('admin_redirect_count');
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
      sessionStorage.removeItem('admin_check_count');
      sessionStorage.removeItem('admin_redirect_count');
      
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
      localStorage.removeItem('user_is_admin');
      sessionStorage.removeItem('admin_check_count');
      sessionStorage.removeItem('admin_redirect_count');
      
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
