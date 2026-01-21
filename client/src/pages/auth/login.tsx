import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import Logo from "@/components/logo";
import { AuthLayout } from "@/components/layout/layout";
import { trackEvent } from "@/lib/analytics";
import { apiRequest, handleResponse } from "@/lib/queryClient";
import { useTokenAuth } from "@/hooks/use-token-auth";
import { trackLogin, identifyFounder, identifyVenture } from "@/lib/amplitude";

interface OnboardingIncompleteData {
  email: string;
  founderId?: string;
  sessionId?: string;
  currentStep?: string;
  completedSteps?: string[];
  resumeToken?: string;
  resumeUrl: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [onboardingIncomplete, setOnboardingIncomplete] = useState<OnboardingIncompleteData | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setVentureFromLogin } = useTokenAuth();

  // CRITICAL FIX: Check if user is already logged in with JWT token
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token && token !== 'null' && token !== 'undefined') {
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
              // User is already logged in, redirect to dashboard
              console.log('User already authenticated, redirecting to dashboard');
              setLocation('/dashboard');
              return;
            }
          }
        }
        // CRITICAL FIX: Clear any invalid/stale tokens
        localStorage.clear();
        console.log('No valid authentication found, showing login page');
      } catch (error) {
        console.log('Authentication check failed, showing login page');
        localStorage.clear();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/auth-token/login', {
        email,
        password,
      });

      // Note: apiRequest throws for non-2xx responses, so 409 is handled in catch block
      const data = await handleResponse(response);

      if (data.success) {
        // Track successful login event
        trackEvent('login', 'authentication', 'login_success');
        
        // Store new auth data (don't clear everything at once)
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_user', JSON.stringify(data.founder));
          
          // Identify user in Amplitude
          if (data.founder?.founderId) {
            identifyFounder(data.founder.founderId, data.founder.email || '', data.founder.fullName || '');
            trackLogin(data.founder.founderId, data.founder.email || '', data.venture?.ventureId);
          }
          
          // Store venture data with growthStage
          if (data.venture) {
            localStorage.setItem('auth_venture', JSON.stringify(data.venture));
            // CRITICAL FIX: Pass venture data directly to avoid localStorage timing issues
            setVentureFromLogin(data.venture);
            
            // Identify venture in Amplitude
            if (data.venture.ventureId) {
              identifyVenture(data.venture.ventureId, data.venture.name || '', data.founder?.founderId || '');
            }
          }
          
          // Clear only old/unnecessary data after storing new data
          const keysToKeep = ['auth_token', 'auth_user', 'auth_venture'];
          Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
              localStorage.removeItem(key);
            }
          });
        } else {
          console.error('❌ No token received in login response');
        }
        
        toast({
          title: "Welcome Back!",
          description: `Hello ${data.founder.fullName}, you're now logged in.`,
          duration: 3000,
          variant: "success",
        });
        
        // CRITICAL FIX: Redirect immediately to dashboard after successful login
        setLocation('/dashboard');
      } else {
        throw new Error(data.error?.message || data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Check for onboarding incomplete response (409 status)
      // Note: throwIfResNotOk attaches parsed JSON to error.response and status to error.status
      if (error?.status === 409 || error?.message?.includes('onboarding_incomplete')) {
        try {
          // error.response IS the parsed JSON data (not a wrapper)
          const errorData = error?.response;
          if (errorData?.error === 'onboarding_incomplete' && errorData?.data) {
            setOnboardingIncomplete(errorData.data);
            trackEvent('login_onboarding_incomplete', 'authentication', 'incomplete_onboarding');
            return;
          }
        } catch (parseError) {
          console.error('Failed to parse onboarding incomplete response:', parseError);
        }
      }
      
      // Track failed login event
      trackEvent('login_failed', 'authentication', 'login_error');
      
      // Extract user-friendly error message
      let errorMessage = "Please check your credentials and try again";
      
      if (error instanceof Error) {
        // Clean up the error message to be user-friendly
        if (error.message.includes("Invalid credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes("required")) {
          errorMessage = "Email and password are required.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          // For any other error, provide a generic but helpful message
          errorMessage = "Login failed. Please check your credentials and try again.";
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication status
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Handle resume onboarding
  const handleResumeOnboarding = () => {
    if (onboardingIncomplete?.resumeUrl) {
      trackEvent('resume_onboarding', 'authentication', 'resume_from_login');
      setLocation(onboardingIncomplete.resumeUrl);
    }
  };

  // Show onboarding incomplete UI
  if (onboardingIncomplete) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo size="lg" showTagline={false} />
          </div>

          <Card className="border-amber-500/50">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Complete Your Setup</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                You haven't finished setting up your account yet. Continue where you left off to access your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Email:</span> {onboardingIncomplete.email}
                </p>
                {onboardingIncomplete.currentStep && (
                  <p className="text-muted-foreground mt-1">
                    <span className="font-medium text-foreground">Last step:</span>{" "}
                    {onboardingIncomplete.currentStep.charAt(0).toUpperCase() + onboardingIncomplete.currentStep.slice(1)}
                  </p>
                )}
              </div>

              <Button
                onClick={handleResumeOnboarding}
                className="w-full gradient-button py-3 text-base"
              >
                Continue Setup
              </Button>

              <Button
                variant="ghost"
                onClick={() => setOnboardingIncomplete(null)}
                className="w-full text-muted-foreground"
              >
                Try different email
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo size="lg" showTagline={false} />
          </div>

          {/* Login Form */}
          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center">
                <LogIn className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl gradient-text">Welcome Back</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Sign in to your Second Chance account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-button py-3 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  <a 
                    href="/forgot-password" 
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Forgot your password?
                  </a>
                </p>
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setLocation('/')}
                    className="text-primary hover:text-primary-gold font-medium"
                  >
                    Start Your Validation
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    </AuthLayout>
  );
}