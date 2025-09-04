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

// Custom error class to preserve full error response
class ApiError extends Error {
  response: any;
  status: number;
  
  constructor(message: string, response: any, status: number) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
    this.status = status;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Try to parse error response to preserve full structure
    try {
      const errorData = JSON.parse(text);
      
      // Extract the actual error message from various possible structures
      const errorMessage = 
        errorData.error?.message ||  // {"error": {"message": "Invalid credentials"}}
        errorData.message ||         // {"message": "Invalid credentials"}
        errorData.error ||           // {"error": "Invalid credentials"}
        res.statusText ||            // HTTP status text
        'An error occurred';         // Fallback
      
      // Ensure we never throw raw JSON strings to users
      const cleanMessage = typeof errorMessage === 'string' ? errorMessage : 'An error occurred';
      
      // Create ApiError with full response data preserved
      throw new ApiError(cleanMessage, errorData, res.status);
    } catch (parseError) {
      // If JSON parsing fails, provide user-friendly messages based on status
      let friendlyMessage = 'An error occurred';
      
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
      
      throw new ApiError(friendlyMessage, null, res.status);
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
