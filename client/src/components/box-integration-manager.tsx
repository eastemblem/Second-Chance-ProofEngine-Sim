import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ExternalLink, AlertTriangle, Box, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function BoxIntegrationManager() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string>('');

  // Test both Box implementations
  const { data: originalBoxStatus, refetch: refetchOriginal } = useQuery({
    queryKey: ['/api/box/test'],
    queryFn: async () => {
      const response = await fetch('/api/box/test');
      return response.json();
    },
    retry: false
  });

  const { data: sdkBoxStatus, refetch: refetchSDK } = useQuery({
    queryKey: ['/api/box/sdk/test'],
    queryFn: async () => {
      const response = await fetch('/api/box/sdk/test');
      return response.json();
    },
    retry: false
  });

  const handleBoxSDKAuth = async () => {
    try {
      setIsAuthenticating(true);
      setAuthError('');

      const response = await fetch('/api/box/sdk/auth-url');
      if (!response.ok) {
        throw new Error('Failed to get authentication URL');
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
          refetchSDK();
          refetchOriginal();
        } else if (event.data.type === 'BOX_SDK_AUTH_ERROR') {
          setAuthError(event.data.error || 'Authentication failed');
          setIsAuthenticating(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

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

  const isSDKConnected = sdkBoxStatus?.connected;
  const isOriginalConnected = originalBoxStatus?.connected;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Box className="h-5 w-5 text-blue-600" />
          <span>Box.com Integration</span>
        </CardTitle>
        <CardDescription>
          Secure document storage and sharing for your venture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {isSDKConnected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Box Connected</p>
                  <p className="text-sm text-green-600">Ready for file uploads</p>
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Authentication Required</p>
                  <p className="text-sm text-amber-600">Connect to enable file uploads</p>
                </div>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                  Disconnected
                </Badge>
              </>
            )}
          </div>

          {!isSDKConnected && (
            <Button
              onClick={handleBoxSDKAuth}
              disabled={isAuthenticating}
              size="sm"
              className="flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>{isAuthenticating ? 'Connecting...' : 'Connect Box'}</span>
            </Button>
          )}
        </div>

        {/* Integration Details */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">What happens after connecting:</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>Files upload directly to Box.com storage</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Box className="h-4 w-4" />
              <span>ProofVault folders created automatically</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ExternalLink className="h-4 w-4" />
              <span>Shareable links generated for investor access</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {authError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {authError}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {isSDKConnected && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Box integration is active. Files will upload to secure Box storage with automatic folder organization.
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Issues */}
        {!isSDKConnected && !isAuthenticating && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Box authentication required for secure file uploads. Click "Connect Box" to enable document storage.
              {sdkBoxStatus?.error && (
                <div className="mt-2 text-xs">
                  Technical details: {sdkBoxStatus.error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}