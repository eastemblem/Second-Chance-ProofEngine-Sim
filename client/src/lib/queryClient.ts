import { QueryClient, QueryFunction } from "@tanstack/react-query";
// Removed encryption dependency

const API_VERSION = 'v1';

const getApiUrl = (endpoint: string) => {
  // Support both legacy and versioned endpoints
  if (endpoint.startsWith('/api/v1/')) {
    return endpoint; // Already versioned
  }
  
  // EXEMPTION: Payment routes, auth-token routes, and proofscaling-wishlist use session-based auth (not JWT) 
  if (endpoint.startsWith('/api/payment/') || endpoint.startsWith('/api/auth-token/') || endpoint.includes('proofscaling-wishlist')) {
    console.log('🔥 EXEMPTION: Keeping route as-is:', endpoint);
    return endpoint; // Keep as-is for session-based routes
  }
  
  if (endpoint.startsWith('/api/')) {
    // Convert legacy endpoint to v1
    return endpoint.replace('/api/', `/api/${API_VERSION}/`);
  }
  return `/api/${API_VERSION}${endpoint}`;
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    console.log("🔍 API Error Response Debug:", {
      status: res.status,
      statusText: res.statusText,
      responseText: text,
      url: res.url
    });
    
    // Try to parse error response to extract user-friendly message
    try {
      const errorData = JSON.parse(text);
      
      console.log("📋 Parsed Error Data:", {
        errorData,
        hasError: 'error' in errorData,
        hasMessage: 'message' in errorData,
        hasSuccess: 'success' in errorData,
        errorType: typeof errorData.error,
        messageType: typeof errorData.message
      });
      
      // Extract the actual error message from various possible structures
      let errorMessage = 'An error occurred';
      
      if (errorData.error?.message) {
        // {"success": false, "error": {"status": 400, "message": "Email already taken"}}
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        // {"message": "Invalid credentials"}
        errorMessage = errorData.message;
      } else if (typeof errorData.error === 'string') {
        // {"error": "Invalid credentials"}
        errorMessage = errorData.error;
      } else if (errorData.error && typeof errorData.error === 'object') {
        // Handle any other nested error structures
        errorMessage = errorData.error.error || errorData.error.description || 'An error occurred';
      }
      
      console.log("✅ Extracted Error Message:", errorMessage);
      
      // Create a custom error that preserves the original response for detailed error handling
      const apiError = new Error(errorMessage);
      apiError.name = 'ApiError';
      (apiError as any).response = errorData;
      (apiError as any).status = res.status;
      
      throw apiError;
    } catch (parseError) {
      console.warn("❌ JSON Parse Error:", parseError);
      console.log("📝 Raw response text:", text);
      
      // If JSON parsing fails, try to extract error from raw text or provide status-based message
      let friendlyMessage = text || 'An error occurred';
      
      // Only use generic messages if we have no meaningful text
      if (!text || text.length < 3) {
        if (res.status === 401) {
          friendlyMessage = 'Invalid credentials';
        } else if (res.status === 400) {
          friendlyMessage = 'Invalid request';
        } else if (res.status === 403) {
          friendlyMessage = 'Access denied';
        } else if (res.status === 404) {
          friendlyMessage = 'Resource not found';
        } else if (res.status >= 500) {
          friendlyMessage = 'Server error. Please try again later.';
        }
      }
      
      const apiError = new Error(friendlyMessage);
      apiError.name = 'ApiError';
      (apiError as any).status = res.status;
      
      throw apiError;
    }
  }
}

// Enhanced response handler with decryption support
export async function handleResponse<T = any>(res: Response): Promise<T> {
  await throwIfResNotOk(res);
  
  const responseText = await res.text();
  
  // Parse JSON response
  let responseData: any;
  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    console.error('Failed to parse response JSON:', error);
    throw new Error('Invalid JSON response from server');
  }
  
  // Encryption removed - returning plain response
  
  return responseData;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  if (import.meta.env.MODE === 'development') {
    console.log('🔥 API-REQUEST-DEBUG: Original URL:', url);
  }
  const apiUrl = getApiUrl(url);
  if (import.meta.env.MODE === 'development') {
    console.log('🔥 API-REQUEST-DEBUG: Final API URL:', apiUrl);
  }
  
  // Standard request body handling
  const requestBody = data ? JSON.stringify(data) : undefined;
  
  // Get JWT token from localStorage for authentication
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
  
  const res = await fetch(apiUrl, {
    method,
    headers,
    body: requestBody,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const apiUrl = getApiUrl(queryKey[0] as string);
    
    // Get JWT token from localStorage for authentication
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      ...(token && { "Authorization": `Bearer ${token}` }),
    };
    
    const res = await fetch(apiUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // Use enhanced response handler with decryption support
    return await handleResponse(res);
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Make data always fresh for team updates
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
