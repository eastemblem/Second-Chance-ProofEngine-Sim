import { useProofCoach } from "@/contexts/ProofCoachContext";
import { useTokenAuth } from "@/hooks/use-token-auth";
import ProofCoach from "./ProofCoach";

interface ProofCoachWrapperProps {
  enableTutorial?: boolean;
  forcePage?: string; // Override getCurrentPage() for modals/specific contexts
}

export default function ProofCoachWrapper({ enableTutorial = true, forcePage }: ProofCoachWrapperProps) {
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

  // Wait for state to load before rendering to avoid premature tutorial launches
  if (isLoading) {
    return null;
  }

  // Don't show coach if dismissed or not logged in
  if (isDismissed || !user) {
    return null;
  }

  const handleStepAction = (stepId: number) => {
    // Navigation is handled inside ProofCoach component
    // This is just a callback for tracking
  };

  return (
    <ProofCoach
      currentStep={currentJourneyStep}
      completedSteps={completedJourneySteps}
      onStepAction={handleStepAction}
      onStepComplete={completeStep}
      enableTutorial={enableTutorial}
      currentPage={forcePage || getCurrentPage()}
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
  );
}
