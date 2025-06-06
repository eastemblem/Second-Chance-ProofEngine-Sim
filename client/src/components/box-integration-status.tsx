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

  // Test all Box services
  const { data: services, isLoading, refetch } = useQuery({
    queryKey: ['box-services-status', refreshKey],
    queryFn: async () => {
      const endpoints = [
        { name: 'Box Development', url: '/api/box/development/test' },
        { name: 'Box JWT', url: '/api/box/jwt/test' },
        { name: 'Box Enterprise', url: '/api/box/enterprise/test' }
      ];

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint.url);
            const data = await response.json();
            return {
              service: endpoint.name,
              connected: data.connected || false,
              error: data.error
            };
          } catch (error) {
            return {
              service: endpoint.name,
              connected: false,
              error: error instanceof Error ? error.message : 'Connection failed'
            };
          }
        })
      );

      return results;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
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

  const connectedServices = services?.filter(s => s.connected) || [];
  const hasWorkingService = connectedServices.length > 0;

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
          <div className="space-y-2">
            {services?.map((service, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  service.connected 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.connected, service.error)}
                  <div>
                    <span className="font-medium">{service.service}</span>
                    {service.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {service.error}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(service.connected)}
              </div>
            ))}
          </div>
        )}

        {hasWorkingService && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ready for File Uploads</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              {connectedServices.length} authentication method{connectedServices.length > 1 ? 's' : ''} available. 
              Files will be uploaded to Box.com with ProofVault folder organization.
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