import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ExternalLink, Shield, Upload } from "lucide-react";

export default function BoxAuthSetup() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleBoxAuth = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError('');

      // Get Box OAuth URL
      const response = await fetch('/api/box/auth-url');
      if (!response.ok) {
        throw new Error('Failed to get authentication URL');
      }

      const { authUrl } = await response.json();

      // Open popup window for authentication
      const popup = window.open(
        authUrl,
        'box-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for authentication result
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'BOX_AUTH_SUCCESS') {
          setAuthSuccess(true);
          setIsAuthenticating(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          
          // Reload the page to use new tokens
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else if (event.data.type === 'BOX_AUTH_ERROR') {
          setAuthError(event.data.error || 'Authentication failed');
          setIsAuthenticating(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsAuthenticating(false);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);

    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
      setIsAuthenticating(false);
    }
  };

  if (authSuccess) {
    return (
      <Alert className="mb-6 border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Box Authentication Successful!</strong> File uploads are now enabled. 
          The page will reload automatically to activate the connection.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-6 mb-6 border-amber-200 bg-amber-50">
      <div className="flex items-start gap-4">
        <Upload className="h-6 w-6 text-amber-600 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-800 mb-2">Box Integration Setup Required</h3>
          <p className="text-amber-700 mb-4">
            To enable file uploads and document management, authenticate with Box.com. 
            This is a one-time setup that will allow secure document storage and sharing.
          </p>
          
          {authError && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                <strong>Authentication Error:</strong> {authError}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleBoxAuth}
            disabled={isAuthenticating}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isAuthenticating ? (
              <>Authenticating...</>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect to Box
              </>
            )}
          </Button>
          
          <p className="text-sm text-amber-600 mt-2">
            You'll be redirected to Box.com to authorize the connection.
          </p>
        </div>
      </div>
    </Card>
  );
}