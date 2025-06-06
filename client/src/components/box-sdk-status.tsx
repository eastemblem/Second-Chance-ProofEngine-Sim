import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function BoxSDKStatus() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string>('');

  const { data: connectionStatus, isLoading, refetch } = useQuery({
    queryKey: ['/api/box/sdk/test'],
    queryFn: async () => {
      const response = await fetch('/api/box/sdk/test');
      if (!response.ok) {
        throw new Error('SDK connection test failed');
      }
      return response.json();
    },
    retry: false,
    refetchInterval: false
  });

  const handleBoxSDKAuth = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError('');

      const response = await fetch('/api/box/sdk/auth-url');
      if (!response.ok) {
        throw new Error('Failed to get SDK authentication URL');
      }

      const { authUrl } = await response.json();

      const popup = window.open(
        authUrl,
        'box-sdk-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'BOX_SDK_AUTH_SUCCESS') {
          setIsAuthenticating(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          refetch(); // Refresh connection status
        } else if (event.data.type === 'BOX_SDK_AUTH_ERROR') {
          setAuthError(event.data.error || 'SDK authentication failed');
          setIsAuthenticating(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was blocked
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
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

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Testing Box SDK connection...</span>
      </div>
    );
  }

  const isConnected = connectionStatus?.connected;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Box SDK Connected</span>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Box SDK Not Connected</span>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                Authentication Required
              </Badge>
            </>
          )}
        </div>

        {!isConnected && (
          <Button
            onClick={handleBoxSDKAuth}
            disabled={isAuthenticating}
            size="sm"
            className="flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{isAuthenticating ? 'Connecting...' : 'Connect Box SDK'}</span>
          </Button>
        )}
      </div>

      {!isConnected && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Box SDK authentication required for file uploads and document management.
            {connectionStatus?.error && (
              <div className="mt-1 text-xs text-amber-600">
                {connectionStatus.error}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {authError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Authentication failed: {authError}
          </AlertDescription>
        </Alert>
      )}

      {isConnected && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Box SDK is connected and ready for file uploads to ProofVault folders.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}