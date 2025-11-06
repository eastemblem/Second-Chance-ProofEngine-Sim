import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTokenAuth } from "@/hooks/use-token-auth";
import type { CoachState } from "../../../shared/schema";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";

interface ProofCoachContextValue {
  // State
  coachState: CoachState | null;
  isLoading: boolean;
  isMinimized: boolean;
  isDismissed: boolean;
  currentJourneyStep: number;
  completedJourneySteps: number[];
  tutorialCompletedPages: string[];
  
  // Actions
  updateState: (updates: Partial<CoachState>) => Promise<void>;
  completeStep: (stepId: number) => Promise<void>;
  completeTutorial: (page: string) => Promise<void>;
  minimize: () => Promise<void>;
  expand: () => Promise<void>;
  dismiss: () => Promise<void>;
  reopen: () => Promise<void>;
  resetCoach: () => Promise<void>;
  
  // Helpers
  isStepCompleted: (stepId: number) => boolean;
  isTutorialCompleted: (page: string) => boolean;
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

export function ProofCoachProvider({ children }: ProofCoachProviderProps) {
  const { user } = useTokenAuth();
  const [location] = useLocation();
  
  // Immediately hydrate from localStorage for fast initial render
  const [localState, setLocalState] = useState<Partial<CoachState>>(() => {
    if (typeof window === 'undefined') return {};
    
    const cached = localStorage.getItem("coach_state");
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

  // Fetch coach state from server
  const { data: serverState, isLoading } = useQuery<{ success: boolean; data: CoachState }>({
    queryKey: ["/api/v1/coach"],
    enabled: !!user?.founderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync server state to local state when it arrives (overrides cache)
  useEffect(() => {
    if (serverState?.data) {
      setLocalState(serverState.data);
      // Update localStorage cache
      localStorage.setItem("coach_state", JSON.stringify(serverState.data));
    }
  }, [serverState]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<CoachState>) => {
      const response = await apiRequest("PATCH", "/api/v1/coach", updates);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/coach"] });
      // Update localStorage
      if (data.data) {
        localStorage.setItem("coach_state", JSON.stringify(data.data));
      }
    },
  });

  // Complete step mutation
  const completeStepMutation = useMutation({
    mutationFn: async (stepId: number) => {
      const response = await apiRequest("POST", "/api/v1/coach/complete-step", { stepId });
      return await response.json();
    },
    onSuccess: (data, stepId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/coach"] });
      trackEvent("coach_step_completed", "user_journey", `step_${stepId}`);
      // Update localStorage
      if (data.data) {
        localStorage.setItem("coach_state", JSON.stringify(data.data));
      }
    },
  });

  // Complete tutorial mutation
  const completeTutorialMutation = useMutation({
    mutationFn: async (page: string) => {
      const response = await apiRequest("POST", "/api/v1/coach/complete-tutorial", { page });
      return await response.json();
    },
    onSuccess: (data, page) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/coach"] });
      trackEvent("coach_tutorial_completed", "user_journey", `page_${page}`);
      // Update localStorage
      if (data.data) {
        localStorage.setItem("coach_state", JSON.stringify(data.data));
      }
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/v1/coach/reset", {});
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/coach"] });
      trackEvent("coach_reset", "user_journey", "reset");
      // Clear localStorage
      localStorage.removeItem("coach_state");
    },
  });

  // Action functions
  const updateState = useCallback(async (updates: Partial<CoachState>) => {
    // Optimistically update local state
    setLocalState((prev) => ({ ...prev, ...updates }));
    
    // Update server
    await updateMutation.mutateAsync(updates);
  }, [updateMutation]);

  const completeStep = useCallback(async (stepId: number) => {
    await completeStepMutation.mutateAsync(stepId);
  }, [completeStepMutation]);

  const completeTutorial = useCallback(async (page: string) => {
    await completeTutorialMutation.mutateAsync(page);
  }, [completeTutorialMutation]);

  const minimize = useCallback(async () => {
    await updateState({ isMinimized: true });
    trackEvent("coach_minimized", "user_journey", "minimize");
  }, [updateState]);

  const expand = useCallback(async () => {
    await updateState({ isMinimized: false });
    trackEvent("coach_expanded", "user_journey", "expand");
  }, [updateState]);

  const dismiss = useCallback(async () => {
    await updateState({ isDismissed: true });
    trackEvent("coach_dismissed", "user_journey", "dismiss");
  }, [updateState]);

  const reopen = useCallback(async () => {
    await updateState({ isDismissed: false });
    trackEvent("coach_reopened", "user_journey", "reopen");
  }, [updateState]);

  const resetCoach = useCallback(async () => {
    await resetMutation.mutateAsync();
  }, [resetMutation]);

  // Helper functions
  const isStepCompleted = useCallback((stepId: number): boolean => {
    const completedSteps = localState.completedJourneySteps || [];
    return completedSteps.includes(stepId);
  }, [localState.completedJourneySteps]);

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

  const value: ProofCoachContextValue = {
    coachState: (serverState?.data || localState) as CoachState | null,
    isLoading,
    isMinimized: localState.isMinimized ?? false,
    isDismissed: localState.isDismissed ?? false,
    currentJourneyStep: localState.currentJourneyStep ?? 0,
    completedJourneySteps: localState.completedJourneySteps || [],
    tutorialCompletedPages: localState.tutorialCompletedPages || [],
    updateState,
    completeStep,
    completeTutorial,
    minimize,
    expand,
    dismiss,
    reopen,
    resetCoach,
    isStepCompleted,
    isTutorialCompleted,
    getCurrentPage,
  };

  return (
    <ProofCoachContext.Provider value={value}>
      {children}
    </ProofCoachContext.Provider>
  );
}
