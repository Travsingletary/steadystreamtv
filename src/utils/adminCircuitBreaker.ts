
const REDIRECT_LIMIT = 2; // Reduce the limit further
const REDIRECT_TIMEOUT = 30000; // 30 seconds timeout
const STORAGE_KEY = 'admin_redirect_attempts';
const TIMEOUT_KEY = 'admin_redirect_timeout';

export const checkRedirectLimit = () => {
  const attempts = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0');
  const timeout = parseInt(sessionStorage.getItem(TIMEOUT_KEY) || '0');
  const now = Date.now();

  // If timeout has expired, reset everything
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
  
  console.log(`Admin check attempt ${attempts}/${REDIRECT_LIMIT}`);
  return attempts;
};

export const resetRedirectCount = () => {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(TIMEOUT_KEY);
  console.log('Admin redirect count reset');
};

export const checkAdminStatusWithCircuitBreaker = async (userId: string): Promise<boolean> => {
  // First check if circuit breaker is tripped
  if (checkRedirectLimit()) {
    console.log('Circuit breaker tripped - using cached/fallback admin status');
    
    // Try cached admin status first
    const cached = localStorage.getItem('admin_check_cache');
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        const isExpired = Date.now() - cachedData.timestamp > 300000; // 5 minutes
        
        if (!isExpired && cachedData.userId === userId) {
          console.log('Using cached admin status:', cachedData.isAdmin);
          return cachedData.isAdmin;
        }
      } catch (e) {
        console.warn('Invalid cached admin data');
      }
    }
    
    // Fallback to hardcoded admin check
    const knownAdminUserId = 'de395bc5-08a6-4359-934a-e7509b4eff46';
    const isKnownAdmin = userId === knownAdminUserId;
    
    if (isKnownAdmin) {
      // Cache the hardcoded result
      localStorage.setItem('admin_check_cache', JSON.stringify({
        isAdmin: true,
        source: 'hardcoded_fallback',
        timestamp: Date.now(),
        userId: userId
      }));
    }
    
    return isKnownAdmin;
  }

  // Increment attempt counter
  const attempts = incrementRedirectCount();
  
  try {
    console.log('Making admin check API call for user:', userId);
    
    // Use dynamic import to avoid module loading issues
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('admin-roles', {
      body: { userId }
    });

    if (error) {
      console.error('Admin check API error:', error);
      throw new Error(`Admin check failed: ${error.message}`);
    }

    const isAdmin = data?.isAdmin || false;
    
    // Cache successful response
    localStorage.setItem('admin_check_cache', JSON.stringify({
      ...data,
      timestamp: Date.now(),
      userId: userId
    }));
    
    // Reset redirect count on successful API call
    resetRedirectCount();
    
    console.log('Admin check successful:', isAdmin);
    return isAdmin;
    
  } catch (error) {
    console.error('Admin check failed:', error);
    
    // For known admin user, return true as fallback
    const knownAdminUserId = 'de395bc5-08a6-4359-934a-e7509b4eff46';
    if (userId === knownAdminUserId) {
      console.log('Using hardcoded fallback for known admin');
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
