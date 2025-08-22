import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Eye, EyeOff, Lock, AlertCircle, XCircle } from "lucide-react";

import { AuthLayout } from "@/components/layout";


export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [tokenError, setTokenError] = useState<string>("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const verifiedParam = urlParams.get('verified');
    const emailParam = urlParams.get('email');
    const errorParam = urlParams.get('error');
    const resetParam = urlParams.get('reset');
    
    if (errorParam) {
      // Handle token errors
      switch (errorParam) {
        case 'expired':
          setTokenError('Your verification link has expired. Please start a new validation to receive a fresh verification email.');
          break;
        case 'already_verified':
          setTokenError('Your email is already verified. You can proceed to set your password.');
          setIsVerified(true);
          if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
          }
          break;
        case 'invalid':
          setTokenError('The verification link is invalid. Please check the link or start a new validation.');
          break;
        default:
          setTokenError('There was an issue with your verification link. Please try again.');
      }
    } else if (resetParam === 'true' && emailParam) {
      // Password reset flow
      setIsVerified(true);
      setEmail(decodeURIComponent(emailParam));
      toast({
        title: "Password Reset Authorized",
        description: "You can now set a new password for your account.",
        duration: 5000,
      });
    } else if (verifiedParam === 'true' && emailParam) {
      // Email verification flow
      setIsVerified(true);
      setEmail(decodeURIComponent(emailParam));
      toast({
        title: "Email Verified Successfully!",
        description: "Your email has been verified. Please set your password to continue.",
        duration: 5000,
      });
    } else {
      // Redirect to home if not coming from email verification or password reset
      setLocation('/');
    }
  }, [setLocation, toast]);

  const validatePassword = (pwd: string) => {
    const errors = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("One number");
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`]/.test(pwd)) errors.push("One special character");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !isVerified) {
      toast({
        title: "Error",
        description: "Email verification required",
        variant: "destructive",
      });
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      toast({
        title: "Password Requirements Not Met",
        description: `Missing: ${passwordErrors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords are identical",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Set Successfully!",
          description: "You can now login with your email and password.",
          duration: 5000,
        });
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          setLocation('/login');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to set password');
      }
    } catch (error) {
      console.error('Set password error:', error);
      toast({
        title: "Error Setting Password",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show error state for token issues
  if (tokenError) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">




            {/* Error Card */}
            <Card className="shadow-lg border-border/50">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  {tokenError.includes('already verified') ? (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
                <CardTitle className="text-xl gradient-text">
                  {tokenError.includes('already verified') ? 'Email Already Verified' : 'Verification Issue'}
                </CardTitle>
                <CardDescription className="text-base">
                  {tokenError}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {tokenError.includes('already verified') && isVerified && email ? (
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => {
                      // Continue to password setup for already verified users
                      setTokenError("");
                    }}
                  >
                    Continue to Set Password
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      className="w-full gradient-button"
                      onClick={() => setLocation('/')}
                    >
                      Start New Validation
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation('/login')}
                    >
                      Try Login Instead
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (!isVerified || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Please verify your email first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passwordErrors = validatePassword(password);

  return (
    <AuthLayout>
      <div className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">




          {/* Verification Success */}
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold gradient-text mb-2">Email Verified!</h1>
            <p className="text-muted-foreground">
              Welcome! Please set your password to complete your account setup.
            </p>
          </div>

          {/* Set Password Form */}
          <Card>
            <CardHeader>
              <CardTitle>Set Your Password</CardTitle>
              <CardDescription>
                Create a secure password for your account: {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  
                  {/* Password Requirements */}
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">Password must include:</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { check: password.length >= 8, text: "8+ characters" },
                        { check: /[A-Z]/.test(password), text: "Uppercase" },
                        { check: /[a-z]/.test(password), text: "Lowercase" },
                        { check: /[0-9]/.test(password), text: "Number" },
                        { check: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`]/.test(password), text: "Special char" },
                      ].map((req, idx) => (
                        <div key={idx} className={`flex items-center space-x-1 ${req.check ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${req.check ? 'bg-green-600' : 'bg-muted-foreground/30'}`} />
                          <span>{req.text}</span>
                        </div>
                      ))}
                    </div>
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
                      placeholder="Confirm your password"
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
                    <p className="text-xs text-red-500">Passwords don't match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-button"
                  disabled={isLoading || passwordErrors.length > 0 || password !== confirmPassword}
                >
                  {isLoading ? "Setting Password..." : "Set Password & Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
    </AuthLayout>
  );
}