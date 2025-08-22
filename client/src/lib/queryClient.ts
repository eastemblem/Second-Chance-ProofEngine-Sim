import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { ClientCrypto } from './client-crypto';

// API version configuration
const API_VERSION = 'v1';
const getApiUrl = (endpoint: string) => {
  // Support both legacy and versioned endpoints
  if (endpoint.startsWith('/api/v1/')) {
    return endpoint; // Already versioned
  }
  
  // EXEMPTION: Payment routes and auth-token routes for onboarding flow use session-based auth (not JWT) 
  // Also disable encryption for auth-token endpoints temporarily
  if (endpoint.startsWith('/api/payment/') || endpoint.startsWith('/api/auth-token/')) {
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
    throw new Error(`${res.status}: ${text}`);
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
  
  // Handle response decryption if indicated by headers
  if (ClientCrypto.isEncryptedResponse(res.headers)) {
    try {
      const decryptionResult = await ClientCrypto.decryptResponsePayload(responseData);
      
      if (decryptionResult.wasDecrypted) {
        if (import.meta.env.MODE === 'development') {
          console.log('🔒 RESPONSE-DECRYPTION: Payload decrypted');
        }
        return decryptionResult.data;
      }
    } catch (error) {
      console.error('Response decryption failed, using original response:', error);
    }
  }
  
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
  
  // Handle request payload encryption
  let requestBody: string | undefined;
  let encryptionHeaders: Record<string, string> = {};
  
  if (data) {
    // Skip encryption for auth-token routes temporarily to fix login issues  
    if (apiUrl.includes('/api/auth-token/')) {
      requestBody = JSON.stringify(data);
    } else {
      try {
        const encryptionResult = await ClientCrypto.encryptRequestPayload(data);
        
        if (encryptionResult.wasEncrypted) {
          requestBody = JSON.stringify(encryptionResult.data);
          encryptionHeaders = encryptionResult.headers;
          
          if (import.meta.env.MODE === 'development') {
            console.log('🔒 REQUEST-ENCRYPTION: Payload encrypted');
          }
        } else {
          requestBody = JSON.stringify(data);
        }
      } catch (error) {
        console.error('Request encryption failed, falling back to unencrypted:', error);
        requestBody = JSON.stringify(data);
      }
    }
  }
  
  // Get JWT token from localStorage for authentication
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...encryptionHeaders,
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
