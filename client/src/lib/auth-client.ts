/**
 * Client-side authentication management with persistent token storage
 */

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

interface AuthResponse {
  success: boolean;
  user: AuthUser;
  venture: AuthVenture | null;
  token: string;
  expiresIn: string;
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

class AuthClient {
  private token: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  constructor() {
    this.loadFromStorage();
    this.setupAutoRefresh();
  }

  /**
   * Load authentication data from localStorage
   */
  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      this.token = localStorage.getItem(this.TOKEN_KEY);
      if (this.token) {
        console.log('🔐 Auth token loaded from storage');
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      this.clearAuth();
    }
  }

  /**
   * Save authentication data to localStorage
   */
  private saveToStorage(token: string, user: AuthUser) {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.token = token;
      console.log('💾 Auth data saved to storage');
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  }

  /**
   * Clear authentication data
   */
  private clearAuth() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      this.token = null;
      this.clearRefreshTimer();
      console.log('🗑️ Auth data cleared');
    } catch (error) {
      console.error('Failed to clear auth storage:', error);
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Check token status every 30 minutes
    this.refreshTimer = setInterval(() => {
      this.checkAndRefreshToken();
    }, 30 * 60 * 1000);
  }

  /**
   * Clear refresh timer
   */
  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Check if token needs refresh and refresh if needed
   */
  private async checkAndRefreshToken() {
    if (!this.token) return;

    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // Refresh if token expires within next 2 hours
      if (exp - now < 2 * 60 * 60 * 1000) {
        console.log('🔄 Auto-refreshing token');
        await this.refreshToken();
      }
    } catch (error) {
      console.error('Token refresh check failed:', error);
      // Token might be invalid, try to verify
      const isValid = await this.verifyToken();
      if (!isValid) {
        this.clearAuth();
      }
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `/api/auth-token${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    // Check for new token in response headers
    const newToken = response.headers.get('X-New-Auth-Token');
    if (newToken && this.getUser()) {
      this.saveToStorage(newToken, this.getUser()!);
    }

    return response;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data: AuthResponse = await response.json();
      
      if (data.success && data.token) {
        this.saveToStorage(data.token, data.user);
        console.log('✅ User registered and authenticated');
      }

      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      
      if (data.success && data.token) {
        this.saveToStorage(data.token, data.user);
        console.log('✅ User logged in successfully');
      }

      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user - invalidate JWT token on server and clear local storage
   */
  async logout(): Promise<void> {
    try {
      // Call JWT logout endpoint to invalidate token on server
      await this.apiRequest('/logout', {
        method: 'POST',
      });
      console.log('🔐 JWT token invalidated on server');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API fails
    }

    // Clear local authentication data
    this.clearAuth();
    console.log('✅ User logged out and token invalidated');
  }

  /**
   * Verify current token
   */
  async verifyToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await this.apiRequest('/verify');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.tokenValid) {
          return true;
        }
      }
      
      // Token is invalid
      this.clearAuth();
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      this.clearAuth();
      return false;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await this.apiRequest('/refresh', {
        method: 'POST',
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        if (data.success && data.token) {
          this.saveToStorage(data.token, data.user);
          console.log('🔄 Token refreshed successfully');
          return true;
        }
      }

      // Refresh failed
      this.clearAuth();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      return false;
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get current user data
   */
  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;

    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token && !!this.getUser();
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  /**
   * Make authenticated request to any API endpoint
   */
  async authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    // Handle token refresh
    const newToken = response.headers.get('X-New-Auth-Token');
    if (newToken && this.getUser()) {
      this.saveToStorage(newToken, this.getUser()!);
    }

    // Handle 401 responses
    if (response.status === 401) {
      console.log('🚫 Authentication required - token may have expired');
      const refreshSuccess = await this.refreshToken();
      
      if (!refreshSuccess) {
        // Redirect to login or show login modal
        this.clearAuth();
        throw new Error('Authentication expired. Please log in again.');
      }

      // Retry request with new token
      const retryConfig = {
        ...config,
        headers: {
          ...config.headers,
          ...this.getAuthHeader(),
        },
      };
      
      return fetch(url, retryConfig);
    }

    return response;
  }
}

// Export singleton instance
export const authClient = new AuthClient();
export default authClient;