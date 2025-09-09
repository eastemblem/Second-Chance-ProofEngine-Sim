import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Eye, EyeOff, Lock, AlertCircle, XCircle } from "lucide-react";
import Logo from "@/components/logo";
import { AuthLayout } from "@/components/layout/layout";


export default function ResetPasswordPage() {
  console.log("🔍 ResetPasswordPage component loaded, URL:", window.location.href);
  console.log("🔍 Component is rendering - this should appear if routing works");
  
  const [match, params] = useRoute("/reset-password/:token?");
  const [location, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string>("");
  const [isValidating, setIsValidating] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();

  // Extract token from URL on component mount and when location changes
  useEffect(() => {
    console.log('🔍 Token extraction effect running');
    console.log('🔍 Current location:', location);
    console.log('🔍 Current params:', params);
    console.log('🔍 Window location:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    
    const extractToken = () => {
      // First try query parameter from window.location
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryToken = urlParams.get('token');
        if (queryToken) {
          console.log('✅ Found token in query params:', queryToken);
          setToken(queryToken);
          setTokenError('');
          return;
        }
      }
      
      // Then try path parameter from wouter
      if (params?.token) {
        console.log('✅ Found token in path params:', params.token);
        setToken(params.token);
        setTokenError('');
        return;
      }
      
      console.log('❌ No token found in URL');
      setToken(null);
      setTokenError('Token not found in URL');
    };

    extractToken();
  }, [location, params]);

  useEffect(() => {
    if (!token) {
      setTokenError("Invalid reset link");
      setIsValidating(false);
      return;
    }

    // Validate token by attempting to use it
    setIsValidating(false);
  }, [token]);

  const validatePassword = (pwd: string) => {
    const errors = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/(?=.*[a-z])/.test(pwd)) errors.push("One lowercase letter");
    if (!/(?=.*[A-Z])/.test(pwd)) errors.push("One uppercase letter");
    if (!/(?=.*\d)/.test(pwd)) errors.push("One number");
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/.test(pwd)) errors.push("One special character");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (validatePassword(password).length > 0) {
      toast({
        title: "Invalid Password",
        description: "Please meet all password requirements",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Reset Successfully!",
          description: "You can now login with your new password.",
          duration: 5000,
        });
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          setLocation('/login');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: "Error Resetting Password",
        description: error instanceof Error ? error.message : "Please try again or request a new reset link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state for token issues
  if (tokenError || (!token && !isValidating)) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center px-4">
          <Card className="w-full max-w-md shadow-xl border-destructive/20 bg-destructive/5">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Invalid Reset Link</CardTitle>
              <CardDescription className="text-muted-foreground">
                {tokenError || "Reset token is missing or invalid"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setLocation('/forgot-password')}
                className="w-full bg-destructive hover:bg-destructive/90"
              >
                Request New Reset Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  const passwordErrors = validatePassword(password);

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" showTagline={false} />
        </div>

        {/* Reset Password Form */}
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl sm:text-2xl gradient-text">Reset Your Password</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter a new secure password for your account
            </CardDescription>
          </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
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
                  
                  {/* Password Requirements */}
                  <div className="text-xs space-y-1">
                    {validatePassword(password).map((error, index) => (
                      <div key={index} className="flex items-center gap-1 text-destructive">
                        <XCircle className="w-3 h-3" />
                        {error}
                      </div>
                    ))}
                    {password && passwordErrors.length === 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Password meets all requirements
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {confirmPassword && password !== confirmPassword && (
                    <div className="flex items-center gap-1 text-destructive text-xs">
                      <XCircle className="w-3 h-3" />
                      Passwords do not match
                    </div>
                  )}
                  
                  {confirmPassword && password === confirmPassword && (
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Passwords match
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-button py-3 text-base"
                  disabled={isLoading || passwordErrors.length > 0 || password !== confirmPassword}
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <button
                    onClick={() => setLocation('/login')}
                    className="text-primary hover:text-primary-gold font-medium"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    </AuthLayout>
  );
}