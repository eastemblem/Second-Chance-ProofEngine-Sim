import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";

interface AuthUser {
  founderId: string;
  email: string;
  fullName: string;
  positionRole: string;
  startupName?: string;
}

interface AuthVenture {
  ventureId: string;
  name: string;
  industry: string;
  geography: string;
  growthStage?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  fullName: string;
  startupName?: string;
  positionRole: string;
  industry?: string;
  geography?: string;
}

type AuthContextType = {
  user: AuthUser | null;
  venture: AuthVenture | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  loginMutation: any;
  registerMutation: any;
  logoutMutation: any;
  token: string | null;
};

export const TokenAuthContext = createContext<AuthContextType | null>(null);

export function TokenAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [venture, setVenture] = useState<AuthVenture | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Initialize authentication state from storage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authClient.getToken();
      const storedUser = authClient.getUser();
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        
        // Verify token is still valid
        const isValid = await authClient.verifyToken();
        if (!isValid) {
          handleLogout();
        }
      }
    };

    initAuth();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setVenture(null);
    setToken(null);
    queryClient.clear();
  };

  // Token verification query (runs periodically)
  const {
    data: verificationData,
    error: verificationError,
    isLoading,
  } = useQuery({
    queryKey: ['auth-verification'],
    queryFn: async () => {
      if (!authClient.isAuthenticated()) return null;
      
      const isValid = await authClient.verifyToken();
      if (!isValid) {
        handleLogout();
        return null;
      }
      return { valid: true };
    },
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // Check every 15 minutes
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return await authClient.login(credentials);
    },
    onSuccess: (data) => {
      if (data.success) {
        setUser(data.user);
        setVenture(data.venture);
        setToken(data.token);
        
        // Invalidate all queries to refresh with authenticated data
        queryClient.invalidateQueries();
        
        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.user.fullName}`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      return await authClient.register(userData);
    },
    onSuccess: (data) => {
      if (data.success) {
        setUser(data.user);
        setVenture(data.venture);
        setToken(data.token);
        
        // Invalidate all queries to refresh with authenticated data
        queryClient.invalidateQueries();
        
        toast({
          title: "Welcome to Second Chance!",
          description: `Account created for ${data.user.fullName}`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authClient.logout();
    },
    onSuccess: () => {
      handleLogout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      // Still clear local state even if API call fails
      handleLogout();
      toast({
        title: "Logged out",
        description: "You have been logged out",
      });
    },
  });

  return (
    <TokenAuthContext.Provider
      value={{
        user,
        venture,
        isLoading,
        isAuthenticated: !!user && !!token,
        error: verificationError as Error,
        loginMutation,
        registerMutation,
        logoutMutation,
        token,
      }}
    >
      {children}
    </TokenAuthContext.Provider>
  );
}

export function useTokenAuth() {
  const context = useContext(TokenAuthContext);
  if (!context) {
    throw new Error("useTokenAuth must be used within a TokenAuthProvider");
  }
  return context;
}

/**
 * Hook for making authenticated API requests
 */
export function useAuthenticatedRequest() {
  const { token, isAuthenticated } = useTokenAuth();

  const makeRequest = async (url: string, options: RequestInit = {}) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }

    return await authClient.authenticatedRequest(url, options);
  };

  return { makeRequest, isAuthenticated, token };
}

/**
 * Higher-order component for protecting routes
 */
export function withTokenAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useTokenAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to access this page.
            </p>
            <button
              onClick={() => window.location.href = '/auth'}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}