import { useProofCoach } from "@/contexts/ProofCoachContext";
import { useTokenAuth } from "@/hooks/use-token-auth";
import { useEffect, lazy, Suspense } from "react";

// Lazy load ProofCoach to break circular dependency
const ProofCoach = lazy(() => import("./ProofCoach"));

interface ProofCoachWrapperProps {
  children?: React.ReactNode;
  enableTutorial?: boolean; // If undefined, auto-detects based on authentication (Tutorial for anonymous, Coach for authenticated)
  forceStart?: boolean; // Bypass completion check for manual tutorial restart
  forcePage?: string; // Override getCurrentPage() for modals/specific contexts
  currentPage?: string; // Direct page specification
  autoStart?: boolean; // Auto-start tutorial on first render
}

export default function ProofCoachWrapper({ 
  children,
  enableTutorial, // Auto-detects if undefined
  forceStart = false, 
  forcePage,
  currentPage,
  autoStart = false
}: ProofCoachWrapperProps) {
  const {
    currentJourneyStep,
    completedJourneySteps,
    tutorialCompletedPages,
    isMinimized,
    isDismissed,
    isLoading,
    completeStep,
    completeTutorial,
    minimize,
    expand,
    dismiss,
    getCurrentPage,
    markCoachModeSeen,
    hasSeenCoachMode,
  } = useProofCoach();

  const { user, venture } = useTokenAuth();
  
  // Auto-detect mode based on authentication state
  // Tutorial Mode (enableTutorial=true): For anonymous users during onboarding
  // Coach Mode (enableTutorial=false): For authenticated users with journey tracking
  const isTutorialMode = enableTutorial !== undefined ? enableTutorial : !user;

  const handleStepAction = (stepId: number) => {
    // Navigation is handled inside ProofCoach component
    // This is just a callback for tracking
  };

  // Determine which page to use for tutorials
  const pageName = currentPage || forcePage || getCurrentPage();

  // Auto-expand ProofCoach when landing on a new uncompleted onboarding page (Tutorial Mode only)
  useEffect(() => {
    if (isTutorialMode && autoStart && isMinimized && !tutorialCompletedPages.includes(pageName)) {
      // Automatically expand the coach for new onboarding pages
      expand();
    }
  }, [pageName, autoStart, isTutorialMode, isMinimized, tutorialCompletedPages, expand]);

  // Auto-expand Coach Mode when transitioning from completed Tutorial Mode
  useEffect(() => {
    // Only in Coach Mode (not Tutorial Mode)
    if (!isTutorialMode && user) {
      // Check if tutorial for this page has been completed
      const tutorialCompleted = tutorialCompletedPages.includes(pageName);
      // Check if Coach Mode hasn't been seen yet
      const coachNotSeen = !hasSeenCoachMode();
      
      // Auto-expand if tutorial is complete but Coach hasn't been seen
      if (tutorialCompleted && coachNotSeen && isMinimized) {
        expand();
        markCoachModeSeen();
      }
    }
  }, [isTutorialMode, user, pageName, tutorialCompletedPages, hasSeenCoachMode, isMinimized, expand, markCoachModeSeen]);

  // Show coach if: not loading, not dismissed
  // Tutorial Mode (isTutorialMode=true): Allow without authentication
  // Coach Mode (isTutorialMode=false): Require authenticated user
  const shouldShowCoach = !isLoading && !isDismissed && (isTutorialMode || user);

  return (
    <>
      {children}
      {shouldShowCoach && (
        <Suspense fallback={null}>
          <ProofCoach
            currentStep={currentJourneyStep}
            completedSteps={completedJourneySteps}
            onStepAction={handleStepAction}
            onStepComplete={completeStep}
            enableTutorial={isTutorialMode}
            forceStart={forceStart || autoStart}
            currentPage={pageName}
            tutorialCompletedPages={tutorialCompletedPages}
            onTutorialComplete={completeTutorial}
            isMinimized={isMinimized}
            onMinimize={minimize}
            onExpand={expand}
            onClose={minimize}
            proofScore={(venture as any)?.proofScore || 0}
            vaultScore={(venture as any)?.vaultScore || 0}
            growthStage={venture?.growthStage || undefined}
          />
        </Suspense>
      )}
    </>
  );
}
