
const REDIRECT_LIMIT = 5;
const REDIRECT_TIMEOUT = 30000; // 30 seconds
const STORAGE_KEY = 'admin_redirect_attempts';
const TIMEOUT_KEY = 'admin_redirect_timeout';

export const checkRedirectLimit = () => {
  const attempts = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0');
  const timeout = parseInt(sessionStorage.getItem(TIMEOUT_KEY) || '0');
  const now = Date.now();

  if (timeout && now > timeout) {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TIMEOUT_KEY);
    return false;
  }

  return attempts >= REDIRECT_LIMIT;
};

export const incrementRedirectCount = () => {
  const attempts = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0') + 1;
  sessionStorage.setItem(STORAGE_KEY, attempts.toString());
  
  if (attempts === 1) {
    sessionStorage.setItem(TIMEOUT_KEY, (Date.now() + REDIRECT_TIMEOUT).toString());
  }
  
  return attempts;
};

export const resetRedirectCount = () => {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(TIMEOUT_KEY);
};

export const checkAdminStatusWithCircuitBreaker = async (userId: string): Promise<boolean> => {
  if (checkRedirectLimit()) {
    console.log('Circuit breaker tripped - using fallback');
    
    // Try cached admin status
    const cached = localStorage.getItem('admin_check_cache');
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        const isExpired = Date.now() - cachedData.timestamp > 300000; // 5 minutes
        
        if (!isExpired) {
          return cachedData.isAdmin;
        }
      } catch (e) {
        console.warn('Invalid cached admin data');
      }
    }
    
    // Fallback to hardcoded admin check
    const knownAdminUserId = 'de395bc5-08a6-4359-934a-e7509b4eff46';
    return userId === knownAdminUserId;
  }

  try {
    incrementRedirectCount();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Use the correct supabase client import
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('admin-roles', {
      body: { userId }
    });

    clearTimeout(timeoutId);

    if (error) {
      throw new Error(`Admin check failed: ${error.message}`);
    }

    // Cache successful response
    localStorage.setItem('admin_check_cache', JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
    
    // Reset redirect count on success
    resetRedirectCount();
    
    return data.isAdmin;
  } catch (error) {
    console.error('Admin check failed:', error);
    
    // Hardcoded fallback for known admin
    const knownAdminUserId = 'de395bc5-08a6-4359-934a-e7509b4eff46';
    if (userId === knownAdminUserId) {
      localStorage.setItem('admin_check_cache', JSON.stringify({
        isAdmin: true,
        source: 'hardcoded_fallback',
        timestamp: Date.now(),
        userId: userId
      }));
      return true;
    }
    
    return false;
  }
};
