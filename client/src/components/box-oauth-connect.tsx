import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Check, AlertCircle } from 'lucide-react';

interface BoxOAuthConnectProps {
  onConnected?: (connected: boolean) => void;
}

export default function BoxOAuthConnect({ onConnected }: BoxOAuthConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    checkConnectionStatus();
    fetchAuthUrl();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/box/status');
      const data = await response.json();
      setIsConnected(data.connected);
      onConnected?.(data.connected);
    } catch (error) {
      console.error('Error checking Box connection:', error);
      setIsConnected(false);
      onConnected?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuthUrl = async () => {
    try {
      const response = await fetch('/api/box/auth-url');
      const data = await response.json();
      setAuthUrl(data.authUrl);
    } catch (error) {
      console.error('Error fetching auth URL:', error);
    }
  };

  const handleConnect = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Box.com Storage
            <Badge variant="outline">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Checking connection status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Box.com Storage
          {isConnected ? (
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Check className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Secure document storage and sharing for your ProofVault
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-green-700 dark:text-green-300">
              Your Box.com account is connected. Files will be uploaded to your secure ProofVault folder.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkConnectionStatus}
            >
              Refresh Status
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Box.com account to enable secure document storage and investor-ready shareable links.
            </p>
            <Button 
              onClick={handleConnect} 
              disabled={!authUrl}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect to Box.com
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}