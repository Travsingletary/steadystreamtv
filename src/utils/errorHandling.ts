
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Enhanced error handler for JSON parsing and API issues
export const handleApiError = (error: any, context: string = 'API call') => {
  console.error(`🚨 Error in ${context}:`, error);
  
  let userMessage = 'Something went wrong. Please try again.';
  
  if (error.message?.includes('JSON') || error.message?.includes('Unexpected end of JSON input')) {
    userMessage = 'Connection issue detected. Please check your internet and try again.';
  } else if (error.message?.includes('fetch')) {
    userMessage = 'Network error. Please check your connection and try again.';
  } else if (error.message?.includes('timeout')) {
    userMessage = 'Request timed out. Please try again.';
  } else if (error.status === 429) {
    userMessage = 'Too many requests. Please wait a moment and try again.';
  } else if (error.status >= 500) {
    userMessage = 'Server error. Please try again in a few minutes.';
  }
  
  return userMessage;
};

// Safe JSON parser with error handling
export const safeJsonParse = (text: string, fallback: any = null) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('🚨 JSON Parse Error:', error);
    return fallback;
  }
};

// Enhanced fetch wrapper with retry logic and JSON validation
export const safeFetch = async (
  url: string, 
  options: RequestInit = {}, 
  retries: number = 3,
  context: string = 'API call'
): Promise<any> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 ${context} - Attempt ${attempt}/${retries}`);
      
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
      
      // Get response text first to validate JSON
      const responseText = await response.text();
      
      // Handle empty responses
      if (!responseText.trim()) {
        console.warn(`⚠️ Empty response from ${context}`);
        return null;
      }
      
      // Safely parse JSON
      const data = safeJsonParse(responseText);
      if (data === null && responseText.trim()) {
        throw new Error('Invalid JSON response received');
      }
      
      console.log(`✅ ${context} successful`);
      return data;
      
    } catch (error: any) {
      console.error(`❌ ${context} failed (attempt ${attempt}):`, error);
      lastError = error;
      
      // Don't retry on certain errors
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Global error handler setup
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    
    if (event.reason?.message?.includes('JSON') || 
        event.reason?.message?.includes('Unexpected end of JSON input')) {
      console.error('🚨 JSON Error Caught:', event.reason);
      
      // Show user-friendly message instead of crash
      const toast = document.querySelector('[data-sonner-toaster]');
      if (toast) {
        // Use existing toast system if available
        window.dispatchEvent(new CustomEvent('show-error-toast', {
          detail: { message: 'Connection issue detected. Please try again.' }
        }));
      } else {
        // Fallback to alert
        alert('Connection issue detected. Please try again.');
      }
      
      event.preventDefault();
    }
  });

  // Handle general JavaScript errors
  window.addEventListener('error', event => {
    console.error('🚨 JavaScript Error:', event.error);
    
    if (event.error?.message?.includes('JSON')) {
      event.preventDefault();
    }
  });
};

export const useAuthErrorHandler = () => {
  const location = useLocation();
  const { toast } = useToast();

  const checkAuthErrors = () => {
    const query = new URLSearchParams(location.search);
    const error = query.get("error");
    const errorDescription = query.get("error_description");
    
    if (error) {
      const friendlyMessage = handleApiError({ message: errorDescription || error }, 'Authentication');
      toast({
        title: "Authentication Error",
        description: friendlyMessage,
        variant: "destructive",
      });
    }
  };

  return { checkAuthErrors };
};
