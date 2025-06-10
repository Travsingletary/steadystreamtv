
import { supabase } from "@/integrations/supabase/client";
import { handleApiError, safeFetch } from "@/utils/errorHandling";

// Enhanced Supabase wrapper with error handling
export class EnhancedApiService {
  
  // Safe Supabase query with error handling
  static async safeQuery(
    queryFn: () => Promise<any>,
    context: string = 'Database query',
    retries: number = 2
  ) {
    let lastError: any;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 ${context} - Attempt ${attempt}/${retries}`);
        
        const { data, error } = await queryFn();
        
        if (error) {
          throw error;
        }
        
        console.log(`✅ ${context} successful`);
        return { data, error: null };
        
      } catch (error: any) {
        console.error(`❌ ${context} failed (attempt ${attempt}):`, error);
        lastError = error;
        
        // Don't retry on auth errors
        if (error.message?.includes('JWT') || error.message?.includes('auth')) {
          break;
        }
        
        // Wait before retry
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    const friendlyError = handleApiError(lastError, context);
    return { data: null, error: friendlyError };
  }
  
  // Safe function invocation with error handling
  static async safeInvokeFunction(
    functionName: string,
    payload: any = {},
    context?: string
  ) {
    const ctx = context || `Edge function: ${functionName}`;
    
    try {
      console.log(`🔄 Invoking ${functionName}...`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ ${functionName} successful`);
      return { data, error: null };
      
    } catch (error: any) {
      console.error(`❌ ${functionName} failed:`, error);
      const friendlyError = handleApiError(error, ctx);
      return { data: null, error: friendlyError };
    }
  }
  
  // Enhanced authentication with error handling
  static async safeAuth(operation: string, credentials: any) {
    try {
      console.log(`🔄 Auth operation: ${operation}`);
      
      let result;
      
      switch (operation) {
        case 'signUp':
          result = await supabase.auth.signUp(credentials);
          break;
        case 'signIn':
          result = await supabase.auth.signInWithPassword(credentials);
          break;
        case 'signOut':
          result = await supabase.auth.signOut();
          break;
        default:
          throw new Error(`Unknown auth operation: ${operation}`);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      console.log(`✅ Auth ${operation} successful`);
      return { data: result.data, error: null };
      
    } catch (error: any) {
      console.error(`❌ Auth ${operation} failed:`, error);
      
      let friendlyError = 'Authentication failed. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        friendlyError = 'Invalid email or password. Please check your credentials.';
      } else if (error.message?.includes('Email not confirmed')) {
        friendlyError = 'Please check your email and confirm your account.';
      } else if (error.message?.includes('User already registered')) {
        friendlyError = 'An account with this email already exists. Try signing in instead.';
      } else if (error.message?.includes('weak_password')) {
        friendlyError = 'Password is too weak. Please choose a stronger password.';
      }
      
      return { data: null, error: friendlyError };
    }
  }
}
