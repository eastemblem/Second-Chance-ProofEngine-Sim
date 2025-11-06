import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minimize2, Maximize2, Sparkles, ChevronLeft, ChevronRight, ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import type { JourneyStep, TutorialMechanic } from "../../../shared/config/coach-journey";
import { COACH_JOURNEY_STEPS, getTutorialsForPage } from "../../../shared/config/coach-journey";

export interface ProofCoachProps {
  // Journey system
  currentStep: number;
  completedSteps: number[];
  onStepAction: (stepId: number) => void;
  onStepComplete: (stepId: number) => void;
  
  // Tutorial system
  enableTutorial?: boolean;
  currentPage: string;
  tutorialCompletedPages?: string[];
  onTutorialComplete?: (page: string) => void;
  
  // State management
  isMinimized: boolean;
  onMinimize: () => void;
  onExpand: () => void;
  onClose: () => void;
  
  // User context for personalization
  proofScore?: number;
  vaultScore?: number;
  growthStage?: string;
}

export default function ProofCoach({
  currentStep,
  completedSteps,
  onStepAction,
  onStepComplete,
  enableTutorial = false,
  currentPage,
  tutorialCompletedPages = [],
  onTutorialComplete,
  isMinimized,
  onMinimize,
  onExpand,
  onClose,
  proofScore = 0,
  vaultScore = 0,
  growthStage,
}: ProofCoachProps) {
  const [location, setLocation] = useLocation();
  const [isInTutorial, setIsInTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Get current journey step data
  const journeyStep = COACH_JOURNEY_STEPS[currentStep] || COACH_JOURNEY_STEPS[0];
  
  // Get tutorial mechanics for current page
  const pageTutorials = getTutorialsForPage(currentPage);
  const shouldShowTutorial = enableTutorial && 
                            pageTutorials.length > 0 && 
                            !tutorialCompletedPages.includes(currentPage);

  // Mark as hydrated after initial render to ensure state has loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-start tutorial when landing on new page - ONLY after hydration and respecting minimize/dismiss state
  useEffect(() => {
    if (isHydrated && shouldShowTutorial && !isInTutorial && !isMinimized) {
      setIsInTutorial(true);
      setTutorialStep(0);
    }
  }, [isHydrated, shouldShowTutorial, currentPage, isMinimized]);

  // Highlight current tutorial element
  useEffect(() => {
    if (isInTutorial && pageTutorials[tutorialStep]) {
      const selector = pageTutorials[tutorialStep].selector;
      const element = document.querySelector(selector) as HTMLElement;
      
      if (element) {
        element.classList.add('tutorial-highlight');
        setHighlightedElement(element);
        
        // Scroll into view smoothly
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        
        // Cleanup: capture element in closure to avoid stale reference
        return () => {
          element.classList.remove('tutorial-highlight');
        };
      }
    }
    
    // If not in tutorial or no element found, cleanup any previous highlight
    return () => {
      const allHighlighted = document.querySelectorAll('.tutorial-highlight');
      allHighlighted.forEach(el => el.classList.remove('tutorial-highlight'));
    };
  }, [isInTutorial, tutorialStep, pageTutorials]);

  // Tutorial navigation
  const nextTutorialStep = () => {
    if (tutorialStep < pageTutorials.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      // Complete tutorial
      completeTutorial();
    }
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    if (highlightedElement) {
      highlightedElement.classList.remove('tutorial-highlight');
    }
    setIsInTutorial(false);
    setTutorialStep(0);
    onTutorialComplete?.(currentPage);
    // Auto-minimize after tutorial completion to avoid showing journey steps
    onMinimize();
  };

  // Journey navigation
  const handleAction = () => {
    if (journeyStep.route) {
      setLocation(journeyStep.route);
    }
    onStepAction(journeyStep.id);
  };

  const handleCompleteStep = () => {
    onStepComplete(journeyStep.id);
  };

  // Calculate progress
  const progress = (completedSteps.length / COACH_JOURNEY_STEPS.length) * 100;

  // Get personalized message based on score
  const getPersonalizedMessage = (): string => {
    if (journeyStep.scoreThreshold) {
      if (proofScore < (journeyStep.scoreThreshold.low?.max || 0)) {
        return journeyStep.scoreThreshold.low?.message || journeyStep.coachGuidance.intro;
      } else if (proofScore >= (journeyStep.scoreThreshold.high?.min || 100)) {
        return journeyStep.scoreThreshold.high?.message || journeyStep.coachGuidance.intro;
      } else if (journeyStep.scoreThreshold.medium) {
        return journeyStep.scoreThreshold.medium.message;
      }
    }
    return journeyStep.coachGuidance.intro;
  };

  // Render minimized state
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={onExpand}
          size="lg"
          className="rounded-full w-16 h-16 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          data-testid="button-expand-coach"
        >
          <div className="relative">
            <Sparkles className="h-6 w-6" />
            {isInTutorial && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {tutorialStep + 1}
              </Badge>
            )}
            {!isInTutorial && completedSteps.length < COACH_JOURNEY_STEPS.length && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-500 text-white text-xs">
                {currentStep + 1}
              </Badge>
            )}
          </div>
        </Button>
      </motion.div>
    );
  }

  // Tutorial mode UI
  if (isInTutorial && pageTutorials[tutorialStep]) {
    const tutorial = pageTutorials[tutorialStep];
    const Icon = tutorial.order === 1 ? Sparkles : ArrowRight;

    return (
      <>
        {/* Dark overlay */}
        <div className="tutorial-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        
        {/* Tutorial coach card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-50 w-[420px]"
        >
          <Card className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 border-purple-500/50 shadow-2xl backdrop-blur-md">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Tutorial Mode</h3>
                    <p className="text-purple-300 text-xs">
                      Step {tutorialStep + 1} of {pageTutorials.length}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMinimize}
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    data-testid="button-minimize-tutorial"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipTutorial}
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    data-testid="button-skip-tutorial"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tutorial content */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-white font-semibold mb-1">{tutorial.title}</h4>
                  <p className="text-gray-300 text-sm">{tutorial.description}</p>
                </div>

                {tutorial.tips && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-200 text-xs">
                      <span className="font-semibold">Tip:</span> {tutorial.tips}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-purple-300">
                  <span className="font-semibold">Location:</span>
                  <span>{tutorial.location}</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevTutorialStep}
                  disabled={tutorialStep === 0}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  data-testid="button-tutorial-prev"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <Button
                  size="sm"
                  onClick={nextTutorialStep}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-tutorial-next"
                >
                  {tutorialStep === pageTutorials.length - 1 ? 'Got it!' : 'Next'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </>
    );
  }

  // Journey coaching mode UI
  const StepIcon = journeyStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50 w-[420px]"
    >
      <Card className="bg-gradient-to-br from-card/95 to-card/90 border-border shadow-2xl backdrop-blur-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${journeyStep.color}/20 flex items-center justify-center`}>
                <StepIcon className={`h-5 w-5 text-${journeyStep.color.replace('bg-', '')}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <h3 className="text-foreground font-semibold">ProofCoach</h3>
                </div>
                <p className="text-muted-foreground text-xs">
                  Your validation guide
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMinimize}
                className="h-8 w-8"
                data-testid="button-close-coach"
                title="Minimize coach"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Journey Progress</span>
              <span>{completedSteps.length}/{COACH_JOURNEY_STEPS.length} steps</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current step info */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-foreground font-semibold">{journeyStep.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {journeyStep.duration}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">{journeyStep.description}</p>
            </div>

            {/* Personalized intro message */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-foreground">
                {getPersonalizedMessage()}
              </p>
            </div>

            {/* Instruction */}
            <div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Next:</span>{' '}
                {journeyStep.coachGuidance.instruction}
              </p>
            </div>

            {/* Tip if available */}
            {journeyStep.coachGuidance.tip && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-600 dark:text-blue-400 text-xs">
                  <span className="font-semibold">Tip:</span> {journeyStep.coachGuidance.tip}
                </p>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="flex gap-2">
            <Button
              onClick={handleAction}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="button-coach-action"
            >
              {journeyStep.action}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            {!completedSteps.includes(journeyStep.id) && (
              <Button
                variant="outline"
                onClick={handleCompleteStep}
                className="px-4"
                data-testid="button-complete-step"
              >
                Mark Done
              </Button>
            )}
          </div>

          {/* Replay Tutorial Button */}
          {tutorialCompletedPages.includes(currentPage) && pageTutorials.length > 0 && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsInTutorial(true);
                  setTutorialStep(0);
                }}
                className="w-full"
                data-testid="button-replay-tutorial"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Replay {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Tutorial
              </Button>
            </div>
          )}

          {/* Step indicator */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Step {currentStep + 1} of {COACH_JOURNEY_STEPS.length}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
