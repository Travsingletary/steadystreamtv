
/**
 * Enhanced safe API call utility with comprehensive error handling
 */
export const safeApiCall = async (url: string, options: RequestInit = {}): Promise<any> => {
  try {
    console.log(`🔄 Making API call to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Get response text first
    const text = await response.text();
    
    // Check if response is empty
    if (!text || text.trim() === '') {
      console.log('✅ API call successful (empty response)');
      return { success: true, data: null };
    }
    
    // Try to parse JSON safely
    try {
      const data = JSON.parse(text);
      console.log('✅ API call successful');
      return data;
    } catch (jsonError) {
      console.error('JSON Parse Error:', { url, text, error: jsonError });
      throw new Error('Server returned invalid data format');
    }
    
  } catch (error: any) {
    console.error('API Error:', { url, error });
    
    // Return user-friendly error
    const friendlyMessage = error.message.includes('JSON') 
      ? 'Connection issue. Please try again.' 
      : error.message;
      
    throw new Error(friendlyMessage);
  }
};

/**
 * Safe API call with retry logic
 */
export const safeApiCallWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  maxRetries: number = 3
): Promise<any> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await safeApiCall(url, options);
    } catch (error: any) {
      lastError = error;
      console.warn(`❌ API call failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Don't retry on certain errors
      if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};
