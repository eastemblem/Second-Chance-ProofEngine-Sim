import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function BoxConnectionStatus() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string>('');

  const { data: connectionStatus, isLoading, refetch } = useQuery({
    queryKey: ['/api/box/test'],
    queryFn: async () => {
      const response = await fetch('/api/box/test');
      if (!response.ok) {
        throw new Error('Connection test failed');
      }
      return response.json();
    },
    retry: false,
    refetchInterval: false
  });

  const handleBoxAuth = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError('');

      const response = await fetch('/api/box/auth-url');
      if (!response.ok) {
        throw new Error('Failed to get authentication URL');
      }

      const { authUrl } = await response.json();

      const popup = window.open(
        authUrl,
        'box-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'BOX_AUTH_SUCCESS') {
          setIsAuthenticating(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          refetch(); // Refresh connection status
        } else if (event.data.type === 'BOX_AUTH_ERROR') {
          setAuthError(event.data.error || 'Authentication failed');
          setIsAuthenticating(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="secondary">Checking Box connection...</Badge>
      </div>
    );
  }

  if (connectionStatus?.connected) {
    return (
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          Box Connected
        </Badge>
      </div>
    );
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="flex items-center justify-between">
          <div>
            <strong>Box Authentication Required:</strong> Connect to Box.com to enable file uploads and document sharing.
          </div>
          <Button 
            onClick={handleBoxAuth}
            disabled={isAuthenticating}
            size="sm"
            className="ml-4 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isAuthenticating ? (
              'Connecting...'
            ) : (
              <>
                <ExternalLink className="h-3 w-3 mr-1" />
                Connect Box
              </>
            )}
          </Button>
        </div>
        {authError && (
          <div className="mt-2 text-sm text-red-700">
            Authentication failed: {authError}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}