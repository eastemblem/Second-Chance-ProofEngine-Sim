import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, XCircle, RefreshCw, Box } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ServiceStatus {
  service: string;
  connected: boolean;
  error?: string;
}

export default function BoxIntegrationStatus() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Test storage service status
  const { data: storageStatus, isLoading, refetch } = useQuery({
    queryKey: ['storage-status', refreshKey],
    queryFn: async () => {
      try {
        const response = await fetch('/api/storage/status');
        const data = await response.json();
        return {
          connected: data.connected || false,
          storageType: data.storageType || 'none',
          available: data.available || false,
          message: data.message || '',
          path: data.path || ''
        };
      } catch (error) {
        return {
          connected: false,
          storageType: 'none',
          available: false,
          message: 'Storage test failed',
          path: ''
        };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  const getStatusIcon = (connected: boolean, error?: string) => {
    if (connected) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (error) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (connected: boolean) => {
    return (
      <Badge variant={connected ? "default" : "destructive"} className={connected ? "bg-green-100 text-green-800" : ""}>
        {connected ? "Connected" : "Disconnected"}
      </Badge>
    );
  };

  const hasWorkingService = boxStatus?.connected || false;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="h-5 w-5" />
          Box.com Integration Status
        </CardTitle>
        <CardDescription>
          Real-time status of all Box.com authentication methods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasWorkingService ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Box Integration Active
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">
                  No Active Connection
                </span>
              </>
            )}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                  <div className="w-24 h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="w-20 h-6 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {boxStatus?.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : boxStatus?.authRequired ? (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="font-medium">Box.com ProofVault Service</div>
                  <div className="text-sm text-muted-foreground">
                    {boxStatus?.message || 'Testing connection...'}
                  </div>
                  {boxStatus?.authType && (
                    <div className="text-xs text-muted-foreground">
                      Authentication: {boxStatus.authType}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={
                  boxStatus?.connected ? "default" : 
                  boxStatus?.authRequired ? "secondary" : 
                  "destructive"
                }>
                  {boxStatus?.connected ? "Connected" : 
                   boxStatus?.authRequired ? "Auth Required" : 
                   "Failed"}
                </Badge>
                {boxStatus?.authRequired && (
                  <div className="text-xs text-amber-600">
                    BOX_ACCESS_TOKEN needed
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm font-medium mb-1">ProofVault Features:</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic ProofVault_[StartupName] folder creation</li>
                <li>• Secure document upload and storage</li>
                <li>• Shareable links for investor access</li>
                <li>• Enterprise-grade security and compliance</li>
              </ul>
            </div>
          </div>
        )}

        {hasWorkingService && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ready for File Uploads</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Box.com authentication active. Files will be uploaded with ProofVault folder organization.
            </p>
          </div>
        )}

        {!hasWorkingService && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Authentication Required</span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Box.com integration requires valid credentials. Files will be stored securely once connection is established.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}