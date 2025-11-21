import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import type { CoachState } from "../../../shared/schema";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { COACH_JOURNEY_STEPS, type JourneyStep } from "../../../shared/config/coach-journey";
import { useTokenAuth } from "@/hooks/use-token-auth";
import { useCoachProgress, type CoachProgressData } from "@/hooks/use-coach-progress";
import { queryClient } from "@/lib/queryClient";

// Venture progress data from backend APIs (cached for performance)
// IMPORTANT: This interface must include ALL checkField values used in COACH_JOURNEY_STEPS
interface VentureProgressData {
  // Backend-provided metrics
  completedExperimentsCount: number;
  vaultUploadCount: number;
  vaultScore: number;
  proofScore: number;
  hasDealRoomAccess: boolean;
  
  // Client-side flags
  dashboardTutorialCompleted: boolean;
  validationMapExported: boolean;
  validationMapUploadedToVault: boolean;
  hasAccessedCommunityOrDownloads: boolean;
  
  // Derived/computed flags
  onboardingComplete: boolean;
  hasCompletedExperiment: boolean;
  
  // Metadata
  lastRefreshed: number;
}

interface ProofCoachContextValue {
  // State
  coachState: CoachState | null;
  isLoading: boolean;
  isMinimized: boolean;
  isDismissed: boolean;
  currentJourneyStep: number;
  completedJourneySteps: number[];
  tutorialCompletedPages: string[];
  ventureProgress: VentureProgressData | null;
  
  // Actions
  updateState: (updates: Partial<CoachState>) => void;
  completeStep: (stepId: number) => void;
  completeTutorial: (page: string) => void;
  minimize: () => void;
  expand: () => void;
  dismiss: () => void;
  reopen: () => void;
  resetCoach: () => void;
  refreshVentureProgress: () => Promise<void>;
  markCsvExported: () => void;
  markCommunityAccessed: () => void;
  markCoachModeSeen: () => void;
  hasSeenCoachMode: () => boolean;
  
  // Helpers
  isStepCompleted: (stepId: number) => boolean;
  isTutorialCompleted: (page: string) => boolean;
  isStepCriteriaMetByBackend: (stepId: number) => boolean;
  getCurrentPage: () => string;
}

const ProofCoachContext = createContext<ProofCoachContextValue | undefined>(undefined);

export function useProofCoach() {
  const context = useContext(ProofCoachContext);
  if (!context) {
    throw new Error("useProofCoach must be used within ProofCoachProvider");
  }
  return context;
}

interface ProofCoachProviderProps {
  children: ReactNode;
}

const COACH_STATE_KEY = "coach_state"; // All users use same key

// Client-side flags storage keys (no longer founder-namespaced)
const CLIENT_FLAG_CSV_EXPORTED = "coach_csv_exported";
const CLIENT_FLAG_COMMUNITY_ACCESSED = "coach_community_accessed";
const CLIENT_FLAG_COACH_MODE_SEEN = "coach_mode_first_seen";

export function ProofCoachProvider({ children }: ProofCoachProviderProps) {
  const [location] = useLocation();
  const { user } = useTokenAuth();
  
  // Fetch server-side progress via React Query hook
  const { data: serverProgress, refetch: refetchServerProgress, isLoading: isLoadingServerProgress } = useCoachProgress();
  
  // All users use same storage key
  const getStorageKey = useCallback(() => {
    return COACH_STATE_KEY;
  }, []);

  // Helper: Get client-side flag from localStorage
  const getClientFlag = useCallback((flagKey: string): boolean => {
    if (typeof window === 'undefined') return false;
    const value = localStorage.getItem(flagKey);
    return value === 'true';
  }, []);

  // Helper: Set client-side flag in localStorage
  const setClientFlag = useCallback((flagKey: string, value: boolean) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(flagKey, String(value));
  }, []);

  // Load state from localStorage on initial render
  const [localState, setLocalState] = useState<Partial<CoachState>>(() => {
    if (typeof window === 'undefined') return {};
    
    const cached = localStorage.getItem(COACH_STATE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (error) {
        console.error("Failed to parse cached coach state", error);
        return {};
      }
    }
    return {};
  });

  // Merge server-side progress with client-side flags
  const ventureProgress: VentureProgressData | null = serverProgress ? {
    // Backend-provided metrics
    completedExperimentsCount: serverProgress.completedExperimentsCount,
    vaultUploadCount: serverProgress.vaultUploadCount,
    vaultScore: serverProgress.vaultScore,
    proofScore: serverProgress.proofScore,
    hasDealRoomAccess: serverProgress.hasDealRoomAccess,
    
    // Client-side flags
    dashboardTutorialCompleted: localState.tutorialCompletedPages?.includes('dashboard') || false,
    validationMapExported: serverProgress.validationMapExported, // Use backend progress instead of client flag
    validationMapUploadedToVault: serverProgress.vaultUploadCount > 0, // Use actual vault uploads, not CSV export
    hasAccessedCommunityOrDownloads: getClientFlag(CLIENT_FLAG_COMMUNITY_ACCESSED),
    
    // Derived/computed flags
    onboardingComplete: !!user?.founderId && !!serverProgress.ventureId, // User is authenticated with a venture
    hasCompletedExperiment: serverProgress.completedExperimentsCount > 0,
    
    // Metadata
    lastRefreshed: Date.now(),
  } : null;

  // Helper function to persist state to localStorage
  const persistState = useCallback((newState: Partial<CoachState>) => {
    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(newState));
    }
  }, [getStorageKey]);

  // Load state from localStorage whenever user changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const state = localStorage.getItem(COACH_STATE_KEY);
    if (state) {
      try {
        const parsedState = JSON.parse(state);
        setLocalState(parsedState);
      } catch (error) {
        console.error("Failed to load coach state", error);
        setLocalState({});
      }
    } else {
      setLocalState({});
    }
  }, [user?.founderId]);

  // Action functions - all client-side only
  const updateState = useCallback((updates: Partial<CoachState>) => {
    const newState = { ...localState, ...updates };
    setLocalState(newState);
    persistState(newState);
  }, [localState, persistState]);

  const completeStep = useCallback((stepId: number) => {
    const completedSteps = localState.completedJourneySteps || [];
    if (!completedSteps.includes(stepId)) {
      const newState = {
        ...localState,
        completedJourneySteps: [...completedSteps, stepId],
      };
      setLocalState(newState);
      persistState(newState);
      trackEvent("coach_step_completed", "user_journey", `step_${stepId}`);
    }
  }, [localState, persistState]);

  const completeTutorial = useCallback((page: string) => {
    const completedPages = localState.tutorialCompletedPages || [];
    if (!completedPages.includes(page)) {
      const newState = {
        ...localState,
        tutorialCompletedPages: [...completedPages, page],
      };
      setLocalState(newState);
      persistState(newState);
      trackEvent("coach_tutorial_completed", "user_journey", `page_${page}`);
    }
  }, [localState, persistState]);

  const minimize = useCallback(() => {
    updateState({ isMinimized: true });
    trackEvent("coach_minimized", "user_journey", "minimize");
  }, [updateState]);

  const expand = useCallback(() => {
    updateState({ isMinimized: false });
    trackEvent("coach_expanded", "user_journey", "expand");
  }, [updateState]);

  const dismiss = useCallback(() => {
    updateState({ isDismissed: true });
    trackEvent("coach_dismissed", "user_journey", "dismiss");
  }, [updateState]);

  const reopen = useCallback(() => {
    updateState({ isDismissed: false });
    trackEvent("coach_reopened", "user_journey", "reopen");
  }, [updateState]);

  const resetCoach = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    }
    setLocalState({});
    trackEvent("coach_reset", "user_journey", "reset");
  }, [getStorageKey]);

  // Refresh venture progress (invalidate cache and refetch)
  const refreshVentureProgress = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/v1/coach/progress'] });
    await refetchServerProgress();
  }, [refetchServerProgress]);

  // Mark CSV as exported (client-side flag)
  const markCsvExported = useCallback(() => {
    setClientFlag(CLIENT_FLAG_CSV_EXPORTED, true);
  }, [setClientFlag]);

  // Mark community/downloads as accessed (client-side flag)
  const markCommunityAccessed = useCallback(() => {
    setClientFlag(CLIENT_FLAG_COMMUNITY_ACCESSED, true);
  }, [setClientFlag]);

  // Mark Coach Mode as seen (client-side flag)
  const markCoachModeSeen = useCallback(() => {
    setClientFlag(CLIENT_FLAG_COACH_MODE_SEEN, true);
  }, [setClientFlag]);

  // Check if Coach Mode has been seen (client-side flag)
  const hasSeenCoachMode = useCallback((): boolean => {
    return getClientFlag(CLIENT_FLAG_COACH_MODE_SEEN);
  }, [getClientFlag]);

  // Helper functions
  const isStepCompleted = useCallback((stepId: number): boolean => {
    const completedSteps = localState.completedJourneySteps || [];
    return completedSteps.includes(stepId);
  }, [localState.completedJourneySteps]);

  // Check if step criteria is met based on backend progress data
  const isStepCriteriaMetByBackend = useCallback((stepId: number): boolean => {
    const step = COACH_JOURNEY_STEPS.find(s => s.id === stepId);
    if (!step?.completionCriteria || !ventureProgress) return false;
    
    const { checkField, minValue } = step.completionCriteria;
    const value = ventureProgress[checkField as keyof VentureProgressData];
    
    // Handle numeric thresholds (e.g., completedExperimentsCount >= 3)
    if (typeof value === 'number' && minValue !== undefined) {
      return value >= minValue;
    }
    
    // Handle boolean flags (e.g., hasDealRoomAccess === true)
    return !!value;
  }, [ventureProgress]);

  const isTutorialCompleted = useCallback((page: string): boolean => {
    const completedPages = localState.tutorialCompletedPages || [];
    return completedPages.includes(page);
  }, [localState.tutorialCompletedPages]);

  const getCurrentPage = useCallback((): string => {
    // Extract page name from location
    if (location === "/" || location === "") return "landing";
    if (location.startsWith("/dashboard")) return "dashboard";
    if (location.startsWith("/validation-map")) return "validation-map";
    if (location.startsWith("/onboarding")) return "onboarding";
    if (location.startsWith("/deal-room")) return "deal-room";
    if (location.startsWith("/proof-scaling")) return "proof-scaling";
    return location.replace(/^\//, "").split("/")[0] || "landing";
  }, [location]);

  // Get the next uncompleted step for the current page
  const getCurrentPageStep = useCallback((): number => {
    const currentPage = getCurrentPage();
    const completedSteps = localState.completedJourneySteps || [];
    
    // Find all steps for the current page
    const pageSteps = COACH_JOURNEY_STEPS.filter((step: JourneyStep) => step.page === currentPage);
    
    if (pageSteps.length === 0) {
      // If no steps defined for this page, use global journey step
      return localState.currentJourneyStep ?? 0;
    }
    
    // Find the first incomplete step for this page
    const nextStep = pageSteps.find((step: JourneyStep) => !completedSteps.includes(step.id));
    
    return nextStep?.id ?? pageSteps[pageSteps.length - 1].id; // Return last step if all complete
  }, [getCurrentPage, localState.completedJourneySteps, localState.currentJourneyStep]);

  const value: ProofCoachContextValue = {
    coachState: localState as CoachState | null,
    isLoading: isLoadingServerProgress,
    isMinimized: localState.isMinimized ?? false,
    isDismissed: localState.isDismissed ?? false,
    currentJourneyStep: getCurrentPageStep(), // Now returns page-specific step
    completedJourneySteps: localState.completedJourneySteps || [],
    tutorialCompletedPages: localState.tutorialCompletedPages || [],
    ventureProgress,
    updateState,
    completeStep,
    completeTutorial,
    minimize,
    expand,
    dismiss,
    reopen,
    resetCoach,
    refreshVentureProgress,
    markCsvExported,
    markCommunityAccessed,
    markCoachModeSeen,
    hasSeenCoachMode,
    isStepCompleted,
    isTutorialCompleted,
    isStepCriteriaMetByBackend,
    getCurrentPage,
  };

  return (
    <ProofCoachContext.Provider value={value}>
      {children}
    </ProofCoachContext.Provider>
  );
}
