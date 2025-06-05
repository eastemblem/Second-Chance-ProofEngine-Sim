import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import BoxAuthSetup from "./box-auth-setup";

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
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="secondary">Checking connection...</Badge>
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

  return <BoxAuthSetup />;
}