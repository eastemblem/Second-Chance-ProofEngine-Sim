import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function BoxConnectionStatus() {
  const { data: connectionStatus, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Checking connection...</Badge>
      </div>
    );
  }

  if (connectionStatus?.connected) {
    return (
      <div className="flex items-center gap-2">
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
        <strong>Box Integration Required:</strong> Valid Box credentials are needed for file uploads and shareable link generation. 
        Files cannot be uploaded until proper authentication is configured.
      </AlertDescription>
    </Alert>
  );
}