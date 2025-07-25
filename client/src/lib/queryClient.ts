import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API version configuration
const API_VERSION = 'v1';
const getApiUrl = (endpoint: string) => {
  // Support both legacy and versioned endpoints
  if (endpoint.startsWith('/api/v1/')) {
    return endpoint; // Already versioned
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
  const apiUrl = getApiUrl(url);
  
  // Get JWT token from localStorage for authentication
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    ...(data && { "Content-Type": "application/json" }),
    ...(token && { "Authorization": `Bearer ${token}` }),
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
