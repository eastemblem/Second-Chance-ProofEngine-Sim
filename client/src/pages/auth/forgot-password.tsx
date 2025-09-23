import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import Logo from '@/components/logo';
import { AuthLayout } from '@/components/layout/layout';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [location] = useLocation();
  
  const { toast } = useToast();

  // Parse URL parameters for error handling
  const params = new URLSearchParams(location.split('?')[1] || '');
  const urlError = params.get('error');
  const expiredEmail = params.get('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setIsSubmitted(true);
      toast({
        title: "Reset email sent",
        description: "Please check your inbox for password reset instructions.",
        variant: "success",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show error messages from URL parameters
  const getErrorMessage = () => {
    switch (urlError) {
      case 'invalid':
        return 'The password reset link is invalid or has already been used.';
      case 'expired':
        return 'The password reset link has expired. Please request a new one.';
      default:
        return null;
    }
  };

  const urlErrorMessage = getErrorMessage();

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo size="lg" showTagline={false} />
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold gradient-text">
                {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isSubmitted 
                  ? "We've sent password reset instructions to your email address"
                  : "Enter your email address and we'll send you a link to reset your password"
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* URL Error Alert */}
              {urlErrorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {urlErrorMessage}
                    {urlError === 'expired' && expiredEmail && (
                      <span className="block mt-1 text-sm">
                        Email: {expiredEmail}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {isSubmitted ? (
                /* Success State */
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Reset email sent!</p>
                    <p className="text-sm text-muted-foreground">
                      We've sent password reset instructions to <strong>{email}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The link will expire in 24 hours for security reasons.
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail('');
                      }}
                      variant="outline" 
                      className="w-full"
                    >
                      Send Another Email
                    </Button>
                  </div>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full gradient-button"
                    disabled={isLoading || !email.trim()}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                  </Button>
                </form>
              )}

              {/* Additional Links */}
              <div className="text-center space-y-2 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link href="/login" className="text-primary hover:text-primary-gold transition-colors">
                    Sign in
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  Need help? Contact our support team
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    </AuthLayout>
  );
}