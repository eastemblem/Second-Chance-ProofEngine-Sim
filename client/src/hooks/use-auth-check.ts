import { useState, useEffect } from "react";

export function useAuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('auth_user');
        
        if (!token || !userData) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Parse user data
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    // Clear auth and user-scoped data (preserves onboarding, tutorial flags, etc.)
    const userData = localStorage.getItem('auth_user');
    let founderId: string | null = null;
    if (userData) {
      try {
        founderId = JSON.parse(userData).founderId;
      } catch (e) {}
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_venture');
    if (founderId) {
      localStorage.removeItem(`coach_state_${founderId}`);
      localStorage.removeItem(`coach_mode_first_seen_${founderId}`);
    }
    
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    logout
  };
}