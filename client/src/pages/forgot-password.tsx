import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { Navbar } from '@/components/navbar';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar variant="logo-only" />
      
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Back to Login Link */}
          <Link href="/login" className="inline-flex items-center text-purple-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>

          <Card className="bg-black/20 border-purple-500/20 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
              </CardTitle>
              <CardDescription className="text-gray-300">
                {isSubmitted 
                  ? "We've sent password reset instructions to your email address"
                  : "Enter your email address and we'll send you a link to reset your password"
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* URL Error Alert */}
              {urlErrorMessage && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
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
                    <p className="text-white font-medium">Reset email sent!</p>
                    <p className="text-sm text-gray-300">
                      We've sent password reset instructions to <strong>{email}</strong>
                    </p>
                    <p className="text-xs text-gray-400">
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
                      className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                    >
                      Send Another Email
                    </Button>
                  </div>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert className="border-red-500/50 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-white">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="bg-white/5 border-purple-500/30 text-white placeholder:text-gray-400 focus:border-purple-400"
                      disabled={isLoading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-semibold"
                    disabled={isLoading || !email.trim()}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                  </Button>
                </form>
              )}

              {/* Additional Links */}
              <div className="text-center space-y-2 pt-4 border-t border-purple-500/20">
                <p className="text-sm text-gray-400">
                  Remember your password?{' '}
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
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
    </div>
  );
}