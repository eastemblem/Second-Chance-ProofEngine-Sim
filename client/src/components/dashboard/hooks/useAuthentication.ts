import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

interface User {
  founderId: string;
  email: string;
  isAuthenticated: boolean;
  fullName?: string;
  venture?: {
    name: string;
    ventureId?: string;
    certificateUrl?: string;
    reportUrl?: string;
  };
}

export function useAuthentication() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const checkAuthStatus = useCallback(async () => {
    try {
      // CRITICAL FIX: Clear any stale data first
      const token = localStorage.getItem('auth_token');
      if (!token || token === 'null' || token === 'undefined') {
        console.log('No valid token found, redirecting to login');
        localStorage.clear();
        setLocation('/login');
        return;
      }

      const response = await fetch('/api/auth-token/verify', { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const userData = {
            founderId: result.data.user.founderId,
            email: result.data.user.email,
            isAuthenticated: true,
            fullName: result.data.user.fullName,
            venture: {
              name: result.data.venture.name,
              ventureId: result.data.venture.ventureId
            }
          };
          setUser(userData);
          console.log('Auth successful for user:', result.data.user.email);
        } else {
          console.log('Auth failed - no success or data');
          localStorage.clear();
          setLocation('/login');
        }
      } else {
        console.log('Auth failed - response not ok:', response.status);
        localStorage.clear();
        setLocation('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.clear();
      setLocation('/login');
    } finally {
      setIsLoading(false);
    }
  }, [setLocation]);

  const handleLogout = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/auth-token/logout', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        
        trackEvent('logout', 'authentication', 'logout_success');
        
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
          duration: 3000,
        });
        
        setTimeout(() => {
          setLocation('/');
        }, 1000);
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      trackEvent('logout_failed', 'authentication', 'logout_error');
      toast({
        title: "Logout Error",
        description: "Token cleared locally. Please try again if needed.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setLocation('/');
      }, 1000);
    }
  }, [setLocation, toast]);

  return {
    user,
    isLoading,
    checkAuthStatus,
    handleLogout,
    setUser
  };
}