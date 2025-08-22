import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { encryptedApiClient } from './encryption';

// API version configuration
const API_VERSION = 'v1';
const getApiUrl = (endpoint: string) => {
  // Support both legacy and versioned endpoints
  if (endpoint.startsWith('/api/v1/')) {
    return endpoint; // Already versioned
  }
  
  // EXEMPTION: Payment routes for onboarding flow use session-based auth (not JWT)
  if (endpoint.startsWith('/api/payment/')) {
    return endpoint; // Keep as-is for session-based routes
  }
  
  // EXEMPTION: Encryption test routes for development testing
  if (endpoint.startsWith('/api/encryption-test/')) {
    return endpoint; // Keep as-is for test routes
  }
  
  // EXEMPTION: Auth token routes for JWT authentication
  if (endpoint.startsWith('/api/auth-token/')) {
    return endpoint; // Keep as-is for auth token routes
  }
  
  // EXEMPTION: Session auth routes for legacy authentication
  if (endpoint.startsWith('/api/auth/')) {
    return endpoint; // Keep as-is for session auth routes
  }
  
  // EXEMPTION: Email routes
  if (endpoint.startsWith('/api/email/')) {
    return endpoint; // Keep as-is for email routes
  }
  
  // EXEMPTION: Vault routes (legacy)
  if (endpoint.startsWith('/api/vault/')) {
    return endpoint; // Keep as-is for vault routes
  }
  
  // EXEMPTION: Leaderboard routes
  if (endpoint.startsWith('/api/leaderboard')) {
    return endpoint; // Keep as-is for leaderboard routes
  }
  
  // EXEMPTION: Direct submit endpoint
  if (endpoint.startsWith('/api/submit-for-scoring')) {
    return endpoint; // Keep as-is for direct submit
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
    throw new Error(`${res.status}: ${text}`);
  }
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
  
  // Check if encryption is enabled globally and for this endpoint
  const isEncryptionEnabled = import.meta.env.VITE_ENABLE_ENCRYPTION === 'true';
  const shouldUseEncryption = isEncryptionEnabled && 
    !url.includes('/payment/') && 
    (url.includes('/auth') || url.includes('/dashboard') || url.includes('/onboarding') || url.includes('/v1/'));
  
  if (shouldUseEncryption) {
    // Use encrypted API client for protected endpoints
    try {
      const responseData = await encryptedApiClient.request(apiUrl, {
        method,
        body: data ? JSON.stringify(data) : undefined,
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token') || ''}`,
        }
      });
      
      // Create mock response for compatibility
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.warn('Encrypted request failed, falling back to standard request:', error);
      // Fall through to standard request
    }
  }
  
  // Standard unencrypted request (for onboarding, payments, or fallback)
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
  
  const res = await fetch(apiUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
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

    await throwIfResNotOk(res);
    return await res.json();
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
