import { useProofCoach } from "@/contexts/ProofCoachContext";
import { useTokenAuth } from "@/hooks/use-token-auth";
import ProofCoach from "./ProofCoach";

interface ProofCoachWrapperProps {
  children?: React.ReactNode;
  enableTutorial?: boolean;
  forceStart?: boolean; // Bypass completion check for manual tutorial restart
  forcePage?: string; // Override getCurrentPage() for modals/specific contexts
  currentPage?: string; // Direct page specification
  autoStart?: boolean; // Auto-start tutorial on first render
}

export default function ProofCoachWrapper({ 
  children,
  enableTutorial = true, 
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
  } = useProofCoach();

  const { user, venture } = useTokenAuth();

  const handleStepAction = (stepId: number) => {
    // Navigation is handled inside ProofCoach component
    // This is just a callback for tracking
  };

  // Determine which page to use for tutorials
  const pageName = currentPage || forcePage || getCurrentPage();

  // Show coach if: not loading, not dismissed
  // For onboarding tutorials (enableTutorial=true), allow without authentication
  // For journey coaching, require authenticated user
  const shouldShowCoach = !isLoading && !isDismissed && (enableTutorial || user);

  return (
    <>
      {children}
      {shouldShowCoach && (
        <ProofCoach
          currentStep={currentJourneyStep}
          completedSteps={completedJourneySteps}
          onStepAction={handleStepAction}
          onStepComplete={completeStep}
          enableTutorial={enableTutorial}
          forceStart={forceStart || autoStart}
          currentPage={pageName}
          tutorialCompletedPages={tutorialCompletedPages}
          onTutorialComplete={completeTutorial}
          isMinimized={isMinimized}
          onMinimize={minimize}
          onExpand={expand}
          onClose={dismiss}
          proofScore={(venture as any)?.proofScore || 0}
          vaultScore={(venture as any)?.vaultScore || 0}
          growthStage={venture?.growthStage || undefined}
        />
      )}
    </>
  );
}
