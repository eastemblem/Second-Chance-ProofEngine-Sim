import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useTokenAuth } from "./use-token-auth";

export interface CoachProgressData {
  completedExperimentsCount: number;
  vaultUploadCount: number;
  proofScore: number;
  hasDealRoomAccess: boolean;
  ventureId: string;
  vaultScore: number;
}

interface CoachProgressResponse {
  success: boolean;
  data: CoachProgressData;
}

/**
 * React Query hook for fetching Coach Mode venture progress metrics
 * Caches results with 5-minute staleTime, refetches on window focus
 */
export function useCoachProgress(): UseQueryResult<CoachProgressData | null> {
  const { user } = useTokenAuth();

  return useQuery({
    queryKey: ['/api/v1/coach/progress'],
    queryFn: async () => {
      if (!user?.founderId) {
        return null; // Return null for unauthenticated users
      }

      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = token 
        ? { 'Authorization': `Bearer ${token}` } 
        : {};

      const response = await fetch('/api/v1/coach/progress', {
        credentials: 'include',
        headers: headers as HeadersInit
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No venture found yet - return null instead of throwing
          return null;
        }
        throw new Error(`Failed to fetch coach progress: ${response.statusText}`);
      }

      const result: CoachProgressResponse = await response.json();
      return result.data;
    },
    enabled: !!user?.founderId, // Only run when user is authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 1, // Only retry once on failure
  });
}
