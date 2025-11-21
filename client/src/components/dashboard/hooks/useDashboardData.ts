import { useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

// Types
interface User {
  founderId: string;
  email: string;
  isAuthenticated: boolean;
  fullName?: string;
  venture?: {
    name: string;
    ventureId?: string;
    certificateUrl?: string;
    reportUrl?: string;
  };
}

interface ValidationData {
  proofScore: number;
  proofTagsUnlocked: number;
  totalProofTags: number;
  filesUploaded: number;
  status: string;
  certificateUrl?: string;
  reportUrl?: string;
  investorReady?: boolean;
  dealRoomAccess?: boolean;
  vaultScore?: number;
}

interface ProofVaultData {
  overviewCount: number;
  problemProofCount: number;
  solutionProofCount: number;
  demandProofCount: number;
  credibilityProofCount: number;
  commercialProofCount: number;
  investorPackCount: number;
  totalFiles: number;
  files: any[];
  folders?: any[];
  folderUrls?: Record<string, string>;
}

interface LeaderboardEntry {
  ventureName: string;
  totalScore: number;
  rank: number;
  analysisDate: string;
  isReal: boolean;
  proofTags?: number;
  handle?: string;
}

// Cache configuration - aggressive caching to minimize database hits
const CACHE_CONFIG = {
  validation: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  vault: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  leaderboard: {
    staleTime: 5 * 60 * 1000, // 5 minutes (more dynamic)
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  dealRoom: {
    staleTime: 15 * 60 * 1000, // 15 minutes (rarely changes)
    gcTime: 60 * 60 * 1000, // 60 minutes
  },
};

export function useDashboardData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query: Validation Data (critical path - highest priority)
  const {
    data: validationData,
    isLoading: validationLoading,
    error: validationError,
  } = useQuery<ValidationData>({
    queryKey: ['/api/v1/dashboard/validation'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/dashboard/validation', {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Validation fetch failed');
      return response.json();
    },
    staleTime: CACHE_CONFIG.validation.staleTime,
    gcTime: CACHE_CONFIG.validation.gcTime,
    retry: 2,
  });

  // Query: Vault Data (independent from validation)
  const {
    data: vaultData,
    isLoading: vaultLoading,
  } = useQuery<ProofVaultData>({
    queryKey: ['/api/v1/dashboard/vault'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/dashboard/vault', {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Vault fetch failed');
      return response.json();
    },
    staleTime: CACHE_CONFIG.vault.staleTime,
    gcTime: CACHE_CONFIG.vault.gcTime,
    retry: 2,
  });

  // Query: Leaderboard Data
  const {
    data: leaderboardResponse,
    isLoading: leaderboardLoading,
  } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['/api/v1/leaderboard', 5],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/leaderboard?limit=5', {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Leaderboard fetch failed');
      return response.json();
    },
    staleTime: CACHE_CONFIG.leaderboard.staleTime,
    gcTime: CACHE_CONFIG.leaderboard.gcTime,
    retry: 1,
  });

  // Query: Deal Room Access
  const {
    data: dealRoomData,
    isLoading: dealRoomLoading,
  } = useQuery<{ hasAccess: boolean; ventureStatus: 'pending' | 'reviewing' | 'reviewed' | 'done' }>({
    queryKey: ['/api/v1/payments/deal-room-access'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/payments/deal-room-access', {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Deal room access check failed');
      return response.json();
    },
    staleTime: CACHE_CONFIG.dealRoom.staleTime,
    gcTime: CACHE_CONFIG.dealRoom.gcTime,
    retry: 1,
  });

  // Memoized processed data
  const proofVaultData = useMemo(() => {
    if (!vaultData) return null;
    return {
      ...vaultData,
      files: [], // Clear files array since we use paginated files hook instead
    };
  }, [vaultData]);

  const leaderboardData = useMemo(() => {
    if (!leaderboardResponse?.success || !leaderboardResponse?.data) return [];
    
    return leaderboardResponse.data.map((entry: any) => ({
      ...entry,
      proofTags: entry.proofTagsCount || 0,
      handle: entry.handle || `@${entry.ventureName.toLowerCase().replace(/\s+/g, '')}`,
    }));
  }, [leaderboardResponse]);

  const hasDealRoomAccess = useMemo(() => dealRoomData?.hasAccess || false, [dealRoomData]);
  const ventureStatus = useMemo(() => dealRoomData?.ventureStatus || 'pending', [dealRoomData]);

  // Combined loading state
  const isLoading = validationLoading || vaultLoading || leaderboardLoading || dealRoomLoading;

  // Document readiness notifications
  const checkDocumentReadiness = useCallback((validation: ValidationData, hasAccess: boolean) => {
    if (!hasAccess) return;

    if (validation.certificateUrl && !sessionStorage.getItem('certificate_ready_notified')) {
      toast({
        title: "Certificate Ready!",
        description: "Your ProofScore certificate is now available for download.",
        variant: "default",
      });
      trackEvent('notification', 'document', 'certificate_ready');
      sessionStorage.setItem('certificate_ready_notified', 'true');
    }
    
    if (validation.reportUrl && !sessionStorage.getItem('report_ready_notified')) {
      toast({
        title: "Analysis Report Ready!",
        description: "Your detailed venture analysis report is now available for download.",
        variant: "default",
      });
      trackEvent('notification', 'document', 'report_ready');
      sessionStorage.setItem('report_ready_notified', 'true');
    }
  }, [toast]);

  // Check document readiness when data changes
  useEffect(() => {
    if (validationData && hasDealRoomAccess) {
      checkDocumentReadiness(validationData, hasDealRoomAccess);
    }
  }, [validationData, hasDealRoomAccess, checkDocumentReadiness]);

  // Manual refresh function for compatibility with existing code
  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    console.log('🔄 Refreshing dashboard data...', { forceRefresh });
    
    if (forceRefresh) {
      // Invalidate all dashboard queries to force fresh data
      // Use predicate to match partial keys (e.g., ['/api/v1/leaderboard', 5])
      await Promise.all([
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === '/api/v1/dashboard/validation' 
        }),
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === '/api/v1/dashboard/vault' 
        }),
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === '/api/v1/leaderboard' 
        }),
        queryClient.invalidateQueries({ 
          predicate: (query) => query.queryKey[0] === '/api/v1/payments/deal-room-access' 
        }),
      ]);
    }
    
    console.log('✅ Dashboard queries refreshed');
  }, [queryClient]);

  // Setters for backward compatibility (handle undefined cache)
  const setHasDealRoomAccess = useCallback((value: boolean) => {
    queryClient.setQueryData(['/api/v1/payments/deal-room-access'], (old: any) => {
      if (!old) {
        return { hasAccess: value, ventureStatus: 'pending' };
      }
      return { ...old, hasAccess: value };
    });
  }, [queryClient]);

  const setVentureStatus = useCallback((value: 'pending' | 'reviewing' | 'reviewed' | 'done') => {
    queryClient.setQueryData(['/api/v1/payments/deal-room-access'], (old: any) => {
      if (!old) {
        return { hasAccess: false, ventureStatus: value };
      }
      return { ...old, ventureStatus: value };
    });
  }, [queryClient]);

  return {
    validationData: validationData || null,
    proofVaultData,
    leaderboardData,
    hasDealRoomAccess,
    ventureStatus,
    isLoading,
    loadDashboardData,
    setHasDealRoomAccess,
    setVentureStatus,
  };
}