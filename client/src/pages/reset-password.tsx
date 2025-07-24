import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Eye, EyeOff, Lock, AlertCircle, XCircle } from "lucide-react";

import Footer from "@/components/footer";


export default function ResetPasswordPage() {
  const [match, params] = useRoute("/reset-password/:token?");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string>("");
  const [isValidating, setIsValidating] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Support both path and query parameter formats
  const token = params?.token || new URLSearchParams(window.location.search).get('token');

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
  if (tokenError || !token) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-card to-background px-4 py-8">
          <div className="w-full max-w-md">
            {/* Error State */}
            <Card>
              <CardContent className="p-8 text-center">
                <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h1 className="text-2xl font-bold mb-2">Invalid Reset Link</h1>
                <p className="text-muted-foreground mb-6">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
                <Button
                  onClick={() => setLocation('/forgot-password')}
                  className="gradient-button"
                >
                  Request New Reset Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const passwordErrors = validatePassword(password);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f]">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center">
              <Lock className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-3">Reset Password</h1>
            <p className="text-gray-400 text-lg">
              Enter a new secure password for your account
            </p>
          </div>

          {/* Reset Password Form */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-white">Create New Password</CardTitle>
              <CardDescription className="text-gray-400">
                Choose a strong password to secure your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-white font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="pr-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder-gray-500 focus:border-primary focus:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="text-xs space-y-2">
                    <p className="text-gray-400 font-medium">Password requirements:</p>
                    <div className="grid grid-cols-1 gap-1">
                      {validatePassword(password).map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-red-400">
                          <XCircle className="w-3 h-3" />
                          <span>{error}</span>
                        </div>
                      ))}
                      {password && passwordErrors.length === 0 && (
                        <div className="flex items-center gap-2 text-primary-gold">
                          <CheckCircle className="w-3 h-3" />
                          <span>Password meets all requirements</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-white font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="pr-10 bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder-gray-500 focus:border-primary focus:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {confirmPassword && (
                    <div className={`text-xs flex items-center space-x-2 ${password === confirmPassword ? 'text-primary-gold' : 'text-red-400'}`}>
                      {password === confirmPassword ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}</span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-button py-3 text-lg font-semibold"
                  disabled={isLoading || passwordErrors.length > 0 || password !== confirmPassword}
                >
                  {isLoading ? "Resetting Password..." : "Reset Password & Continue"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Remember your password?{" "}
                  <button
                    onClick={() => setLocation('/login')}
                    className="text-primary hover:text-primary-gold font-medium transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}