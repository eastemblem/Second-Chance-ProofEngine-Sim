import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import type { CoachState } from "../../../shared/schema";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { COACH_JOURNEY_STEPS, type JourneyStep } from "../../../shared/config/coach-journey";
import { useTokenAuth } from "@/hooks/use-token-auth";

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
  updateState: (updates: Partial<CoachState>) => void;
  completeStep: (stepId: number) => void;
  completeTutorial: (page: string) => void;
  minimize: () => void;
  expand: () => void;
  dismiss: () => void;
  reopen: () => void;
  resetCoach: () => void;
  
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

const COACH_STATE_KEY_ANON = "coach_state"; // Anonymous users (onboarding)
const COACH_STATE_KEY_PREFIX = "coach_state_"; // Authenticated users (per founder)

export function ProofCoachProvider({ children }: ProofCoachProviderProps) {
  const [location] = useLocation();
  const { user } = useTokenAuth();
  
  // Determine storage key based on authentication status
  const getStorageKey = useCallback(() => {
    if (user?.founderId) {
      return `${COACH_STATE_KEY_PREFIX}${user.founderId}`;
    }
    return COACH_STATE_KEY_ANON;
  }, [user]);

  // Load state from localStorage on initial render
  const [localState, setLocalState] = useState<Partial<CoachState>>(() => {
    if (typeof window === 'undefined') return {};
    
    const storageKey = user?.founderId ? `${COACH_STATE_KEY_PREFIX}${user.founderId}` : COACH_STATE_KEY_ANON;
    const cached = localStorage.getItem(storageKey);
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

  // Helper function to persist state to localStorage
  const persistState = useCallback((newState: Partial<CoachState>) => {
    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(newState));
    }
  }, [getStorageKey]);

  // Migrate anonymous state to authenticated state when user logs in
  // Clear authenticated state when user logs out
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (user?.founderId) {
      // User is authenticated - load or migrate to authenticated state
      const anonState = localStorage.getItem(COACH_STATE_KEY_ANON);
      const userKey = `${COACH_STATE_KEY_PREFIX}${user.founderId}`;
      const userState = localStorage.getItem(userKey);
      
      // If user has no state but anonymous state exists, migrate it
      if (!userState && anonState) {
        try {
          const parsedAnonState = JSON.parse(anonState);
          localStorage.setItem(userKey, JSON.stringify(parsedAnonState));
          setLocalState(parsedAnonState);
          // Clean up anonymous state after migration
          localStorage.removeItem(COACH_STATE_KEY_ANON);
          trackEvent("coach_state_migrated", "user_journey", `founder_${user.founderId}`);
        } catch (error) {
          console.error("Failed to migrate coach state", error);
        }
      } else if (userState) {
        // Load existing user state
        try {
          const parsedUserState = JSON.parse(userState);
          setLocalState(parsedUserState);
        } catch (error) {
          console.error("Failed to load user coach state", error);
        }
      }
    } else {
      // User is not authenticated - load anonymous state
      const anonState = localStorage.getItem(COACH_STATE_KEY_ANON);
      if (anonState) {
        try {
          const parsedAnonState = JSON.parse(anonState);
          setLocalState(parsedAnonState);
        } catch (error) {
          console.error("Failed to load anonymous coach state", error);
          setLocalState({}); // Reset to empty on error
        }
      } else {
        setLocalState({}); // No anonymous state exists, start fresh
      }
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
    isLoading: false, // No loading state needed for client-side only
    isMinimized: localState.isMinimized ?? false,
    isDismissed: localState.isDismissed ?? false,
    currentJourneyStep: getCurrentPageStep(), // Now returns page-specific step
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
