import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';

import Footer from '@/components/footer';
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setIsSubmitted(true);
      toast({
        title: "Reset email sent",
        description: "Please check your inbox for password reset instructions.",
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f]">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Back to Login Link */}
          <Link href="/login" className="inline-flex items-center text-gray-400 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>

          {/* Header Icon and Title */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center">
              <Mail className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-3">
              {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
            </h1>
            <p className="text-gray-400 text-lg">
              {isSubmitted 
                ? "We've sent password reset instructions to your email address"
                : "Enter your email address and we'll send you a link to reset your password"
              }
            </p>
          </div>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a] shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-white">
                {isSubmitted ? 'Email Sent Successfully' : 'Reset Your Password'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {isSubmitted 
                  ? "Check your inbox and follow the instructions to reset your password"
                  : "We'll send you a secure link to reset your password"
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
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-gold to-primary rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-3">
                    <p className="font-medium text-white text-lg">Reset email sent!</p>
                    <p className="text-gray-400">
                      We've sent password reset instructions to <span className="text-primary-gold font-medium">{email}</span>
                    </p>
                    <p className="text-xs text-gray-500">
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
                      className="w-full bg-transparent border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      Send Another Email
                    </Button>
                  </div>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <label htmlFor="email" className="text-white font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder-gray-500 focus:border-primary focus:ring-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full gradient-button py-3 text-lg font-semibold"
                    disabled={isLoading || !email.trim()}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                  </Button>
                </form>
              )}

              {/* Additional Links */}
              <div className="text-center space-y-2 pt-6 border-t border-[#3a3a3a]">
                <p className="text-sm text-gray-400">
                  Remember your password?{' '}
                  <Link href="/login" className="text-primary hover:text-primary-gold font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
                <p className="text-xs text-gray-500">
                  Need help? Contact our support team
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