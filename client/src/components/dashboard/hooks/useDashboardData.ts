import { useState, useCallback } from "react";
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

export function useDashboardData() {
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [proofVaultData, setProofVaultData] = useState<ProofVaultData | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [hasDealRoomAccess, setHasDealRoomAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const checkDocumentReadiness = useCallback((validation: ValidationData) => {
    // Check for certificate availability
    if (validation.certificateUrl && !sessionStorage.getItem('certificate_ready_notified')) {
      toast({
        title: "Certificate Ready!",
        description: "Your ProofScore certificate is now available for download.",
        variant: "default",
      });
      
      trackEvent('notification', 'document', 'certificate_ready');
      sessionStorage.setItem('certificate_ready_notified', 'true');
    }
    
    // Check for report availability
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

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    console.log('🔄 Starting dashboard data load...', { forceRefresh });
    
    try {
      // Prepare headers - skip cache when forcing refresh
      const headers = forceRefresh ? {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      } : {
        'Cache-Control': 'max-age=300' // Cache for 5 minutes normally
      };

      // Load critical data first (validation) for faster LCP - USE V1 API with JWT
      const token = localStorage.getItem('auth_token');
      console.log('🔐 Using auth token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const validationResponse = await fetch('/api/v1/dashboard/validation', {
        credentials: 'include',
        headers: { ...headers, ...authHeaders } as HeadersInit
      });
      if (validationResponse.ok) {
        const validation = await validationResponse.json();
        console.log('✅ Validation data loaded successfully:', validation);
        setValidationData(validation);
        
        // Check for newly available documents and show toast notifications
        checkDocumentReadiness(validation);
      } else {
        console.error('❌ Validation API failed:', validationResponse.status, validationResponse.statusText);
      }

      // Load secondary data in parallel - USE V1 APIS with JWT
      const [vaultResponse, leaderboardResponse] = await Promise.all([
        fetch('/api/v1/dashboard/vault', {
          credentials: 'include',
          headers: { 
            ...(forceRefresh ? headers : { 'Cache-Control': 'max-age=600' }),
            ...authHeaders
          } as HeadersInit
        }),
        fetch('/api/v1/leaderboard?limit=5', {
          credentials: 'include',
          headers: { 
            ...(forceRefresh ? headers : { 'Cache-Control': 'max-age=1200' }),
            ...authHeaders
          } as HeadersInit
        })
      ]);

      if (vaultResponse.ok) {
        const vault = await vaultResponse.json();
        console.log('✅ Vault counts loaded successfully');
        setProofVaultData({
          ...vault,
          files: [] // Clear files array since we use paginated files hook instead
        });
      } else {
        console.error('❌ Vault API failed:', vaultResponse.status, vaultResponse.statusText);
      }

      if (leaderboardResponse.ok) {
        const leaderboard = await leaderboardResponse.json();
        console.log('✅ Leaderboard data loaded successfully:', leaderboard);
        if (leaderboard.success && leaderboard.data) {
          // Enhance leaderboard data with ProofTags calculation
          const enhancedData = leaderboard.data.map((entry: any) => ({
            ...entry,
            proofTags: entry.proofTags || Math.floor(entry.totalScore / 15), // Calculate ProofTags based on score
            handle: entry.handle || `@${entry.ventureName.toLowerCase().replace(/\s+/g, '')}`
          }));
          setLeaderboardData(enhancedData);
        }
      } else {
        console.error('❌ Leaderboard API failed:', leaderboardResponse.status, leaderboardResponse.statusText);
      }
      
      // Check deal room access
      try {
        const dealRoomResponse = await fetch('/api/v1/payments/deal-room-access', {
          credentials: 'include',
          headers: authHeaders as HeadersInit
        });
        if (dealRoomResponse.ok) {
          const accessResult = await dealRoomResponse.json();
          setHasDealRoomAccess(accessResult.hasAccess || false);
        }
      } catch (error) {
        console.error('❌ Deal room access check failed:', error);
        setHasDealRoomAccess(false);
      }
      
      console.log('✅ Dashboard data loading completed successfully');
      setIsLoading(false);
    } catch (error: unknown) {
      console.error('❌ Dashboard data load error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's actually a network or fetch error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error detected:', error.message);
        toast({
          title: "Network Error",
          description: "Unable to connect to server. Please check your connection.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // If authentication fails, don't set loading to false - let auth redirect handle it
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Not authenticated')) {
        console.log('🔐 Authentication failed, will be handled by auth system');
        return;
      }
      
      console.warn('⚠️ Some dashboard data failed to load, but continuing:', errorMessage);
      setIsLoading(false);
    }
  }, [toast, checkDocumentReadiness]);

  return {
    validationData,
    proofVaultData,
    leaderboardData,
    hasDealRoomAccess,
    isLoading,
    loadDashboardData,
    setHasDealRoomAccess
  };
}