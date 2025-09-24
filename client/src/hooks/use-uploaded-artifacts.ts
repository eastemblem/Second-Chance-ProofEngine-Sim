import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UploadedArtifactsResponse {
  success: boolean;
  data: {
    uploadedArtifacts: string[];
    ventureId: string;
  };
  message: string;
}

export function useUploadedArtifacts() {
  return useQuery<UploadedArtifactsResponse>({
    queryKey: ['/api/v1/vault/uploaded-artifacts'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/v1/vault/uploaded-artifacts`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error('Uploaded artifacts fetch error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    // Cache for 5 minutes since this data changes when files are uploaded
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}