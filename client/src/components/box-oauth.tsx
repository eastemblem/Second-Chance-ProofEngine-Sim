import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface BoxOAuthProps {
  onAuthSuccess?: (tokens: any) => void;
  onAuthError?: (error: string) => void;
}

export default function BoxOAuth({ onAuthSuccess, onAuthError }: BoxOAuthProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Listen for OAuth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BOX_AUTH_SUCCESS') {
        setAuthStatus('success');
        setIsAuthenticating(false);
        onAuthSuccess?.(event.data.tokens);
      } else if (event.data?.type === 'BOX_AUTH_ERROR') {
        setAuthStatus('error');
        setIsAuthenticating(false);
        setErrorMessage(event.data.error || 'Authentication failed');
        onAuthError?.(event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAuthSuccess, onAuthError]);

  const handleAuthenticate = () => {
    setIsAuthenticating(true);
    setAuthStatus('idle');
    setErrorMessage('');

    // Open Box OAuth in a popup
    const popup = window.open(
      '/api/box/auth',
      'box-oauth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // Monitor popup closure
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        if (authStatus === 'idle') {
          setIsAuthenticating(false);
          setAuthStatus('error');
          setErrorMessage('Authentication was cancelled');
        }
      }
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Box.com Integration
        </CardTitle>
        <CardDescription>
          Connect your Box.com account to enable secure document storage and sharing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {authStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200">
              Box.com connected successfully!
            </span>
          </div>
        )}

        {authStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">
              {errorMessage}
            </span>
          </div>
        )}

        <Button 
          onClick={handleAuthenticate}
          disabled={isAuthenticating || authStatus === 'success'}
          className="w-full"
        >
          {isAuthenticating ? 'Authenticating...' : 
           authStatus === 'success' ? 'Connected' : 
           'Connect to Box.com'}
        </Button>

        <p className="text-sm text-muted-foreground">
          This will open a new window for secure authentication with Box.com
        </p>
      </CardContent>
    </Card>
  );
}