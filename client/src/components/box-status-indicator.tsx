import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BoxStatusIndicatorProps {
  accessToken?: string;
  onConnect?: () => void;
  compact?: boolean;
}

export default function BoxStatusIndicator({ 
  accessToken, 
  onConnect, 
  compact = false 
}: BoxStatusIndicatorProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    if (accessToken) {
      verifyConnection();
    } else {
      setConnectionStatus('disconnected');
      setUserInfo(null);
    }
  }, [accessToken]);

  const verifyConnection = async () => {
    try {
      setConnectionStatus('checking');
      
      // Test Box connection with or without token
      const headers: any = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch('/api/box/user', { headers });

      if (response.ok) {
        const userData = await response.json();
        setUserInfo(userData);
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Box connection check failed:', error);
      setConnectionStatus('disconnected');
      setUserInfo(null);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {connectionStatus === 'connected' && (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
              Connected to Box
            </Badge>
          </>
        )}
        {connectionStatus === 'disconnected' && (
          <>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
              Not Connected
            </Badge>
          </>
        )}
        {connectionStatus === 'checking' && (
          <>
            <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
            <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50">
              Checking...
            </Badge>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connectionStatus === 'connected' && (
              <>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800">Connected to Box</h4>
                  {userInfo && (
                    <p className="text-sm text-green-600">
                      Logged in as {userInfo.name || userInfo.login}
                    </p>
                  )}
                </div>
              </>
            )}
            
            {connectionStatus === 'disconnected' && (
              <>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                  <WifiOff className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-red-800">Not Connected</h4>
                  <p className="text-sm text-red-600">
                    Connect to Box to upload and organize files
                  </p>
                </div>
              </>
            )}
            
            {connectionStatus === 'checking' && (
              <>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
                  <Wifi className="w-5 h-5 text-yellow-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800">Checking Connection</h4>
                  <p className="text-sm text-yellow-600">
                    Verifying Box authentication...
                  </p>
                </div>
              </>
            )}
          </div>

          {connectionStatus === 'disconnected' && onConnect && (
            <Button onClick={onConnect} size="sm">
              Connect to Box
            </Button>
          )}

          {connectionStatus === 'connected' && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}