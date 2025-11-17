import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minimize2, Maximize2, Sparkles, ChevronLeft, ChevronRight, ArrowRight, BookOpen, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import type { JourneyStep, TutorialMechanic } from "../../../shared/config/coach-journey";
import { COACH_JOURNEY_STEPS, getTutorialsForPage } from "../../../shared/config/coach-journey";
import { useProofCoach } from "@/contexts/ProofCoachContext";
import { Checkbox } from "@/components/ui/checkbox";

export interface ProofCoachProps {
  // Journey system
  currentStep: number;
  completedSteps: number[];
  onStepAction: (stepId: number) => void;
  onStepComplete: (stepId: number) => void;
  
  // Tutorial system
  enableTutorial?: boolean;
  forceStart?: boolean; // Bypass completion check for manual tutorial restart
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
  forceStart = false,
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
  const [isCompletingTutorial, setIsCompletingTutorial] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const lastConfettiStep = useRef<string | null>(null);
  
  // Get context functions
  const { isStepCriteriaMetByBackend } = useProofCoach();
  
  // Get current journey step data
  const journeyStep = COACH_JOURNEY_STEPS[currentStep] || COACH_JOURNEY_STEPS[0];
  
  // Get tutorial mechanics for current page
  const pageTutorials = getTutorialsForPage(currentPage);
  const shouldShowTutorial = enableTutorial && 
                            pageTutorials.length > 0 && 
                            (forceStart || !tutorialCompletedPages.includes(currentPage));

  // Mark as hydrated after initial render to ensure state has loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // ESC key handler to minimize/close ProofCoach
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isInTutorial) {
          // If in tutorial, complete it and minimize
          completeTutorial();
        } else if (!isMinimized) {
          // If expanded, minimize
          onMinimize();
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isInTutorial, isMinimized]);

  // Auto-start tutorial when landing on new page - ONLY after hydration and respecting minimize/dismiss state
  useEffect(() => {
    if (isHydrated && shouldShowTutorial && !isInTutorial && !isMinimized) {
      setIsInTutorial(true);
      setTutorialStep(0);
    }
  }, [isHydrated, shouldShowTutorial, currentPage, isMinimized]);

  // Trigger confetti animation when displaying congratulations steps
  useEffect(() => {
    if (isInTutorial && pageTutorials[tutorialStep]) {
      const currentTutorial = pageTutorials[tutorialStep];
      const isCongratulationsStep = currentTutorial.title.includes('🎉') || 
                                    currentTutorial.id.includes('congratulations');
      
      // Only trigger once per unique congratulations step
      if (isCongratulationsStep && lastConfettiStep.current !== currentTutorial.id) {
        lastConfettiStep.current = currentTutorial.id;
        
        // Delay confetti slightly to ensure modal is visible
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#9333ea', '#c026d3', '#8b5cf6', '#fbbf24', '#f59e0b']
          });
        }, 300);
      }
    }
  }, [isInTutorial, tutorialStep, pageTutorials]);

  // Highlight current tutorial element
  useEffect(() => {
    if (isInTutorial && pageTutorials[tutorialStep]) {
      const selector = pageTutorials[tutorialStep].selector;
      const element = document.querySelector(selector) as HTMLElement;
      
      if (element) {
        // Smart parent detection for form controls
        // If element is a form input/control, find parent container that includes the label
        let targetElement = element;
        
        const isFormControl = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(element.tagName) ||
                             element.hasAttribute('role') && ['combobox', 'switch'].includes(element.getAttribute('role') || '');
        
        if (isFormControl) {
          // Look for parent div that contains a label
          let parent = element.parentElement;
          let searchDepth = 0;
          
          while (parent && searchDepth < 3) {
            // Check if this parent contains a label element
            const hasLabel = parent.querySelector('label') !== null;
            
            if (hasLabel) {
              targetElement = parent;
              break;
            }
            
            parent = parent.parentElement;
            searchDepth++;
          }
        }
        
        targetElement.classList.add('tutorial-highlight');
        setHighlightedElement(targetElement);
        
        // Scroll into view smoothly
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        
        // Cleanup: capture element in closure to avoid stale reference
        return () => {
          targetElement.classList.remove('tutorial-highlight');
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
    // Set transient flag to force minimized state during transition
    setIsCompletingTutorial(true);
    
    // Minimize FIRST to prevent showing journey UI during transition
    onMinimize();
    
    // Clean up tutorial state
    if (highlightedElement) {
      highlightedElement.classList.remove('tutorial-highlight');
    }
    setIsInTutorial(false);
    setTutorialStep(0);
    onTutorialComplete?.(currentPage);
    
    // Clear transient flag after brief delay (by then isMinimized should have updated)
    setTimeout(() => setIsCompletingTutorial(false), 200);
  };

  // Journey navigation - navigate to todo route
  const handleTodoClick = (step: JourneyStep) => {
    if (step.route) {
      setLocation(step.route);
    }
    onStepAction(step.id);
  };

  // Get dynamic message based on ProofScore
  const getDynamicMessage = (): string => {
    if (proofScore < 65) {
      return "Founders with a complete ProofVault are 50% more likely to match with investors.";
    } else if (proofScore >= 65 && proofScore < 70) {
      return "You're 80% match with investors in our Deal Room. Upload into your ProofVault to get access and connect.";
    } else if (proofScore >= 70 && proofScore <= 80) {
      return "You've got a high enough ProofScore to access the Deal Room. Investors typically look for a ProofScore of 85+ for an introduction.";
    } else {
      return "You're ready for investor introductions — unlock the Deal Room and get connected to investors.";
    }
  };

  // Filter Coach Mode steps (IDs 10-30)
  const coachModeSteps = COACH_JOURNEY_STEPS.filter(step => step.id >= 10 && step.id <= 30);
  
  // Categorize todos by completion status
  const completedTodos = coachModeSteps.filter(step => isStepCriteriaMetByBackend(step.id));
  const upcomingTodos = coachModeSteps.filter(step => !isStepCriteriaMetByBackend(step.id)).slice(0, 3);
  
  // Find current active step (first incomplete todo)
  const activeStep = coachModeSteps.find(step => !isStepCriteriaMetByBackend(step.id));

  // Render minimized state
  // Also minimize if tutorial is completing (transient flag prevents journey UI flash)
  // During onboarding (enableTutorial mode), keep minimized when tutorial is not active
  // UNLESS there's a tutorial to auto-start (shouldShowTutorial)
  const shouldBeMinimized = isMinimized || isCompletingTutorial || (enableTutorial && !isInTutorial && !shouldShowTutorial);
  
  if (shouldBeMinimized) {
    // During onboarding, clicking minimized button restarts tutorial instead of showing journey UI
    const handleMinimizedClick = () => {
      if (enableTutorial && pageTutorials.length > 0) {
        // Clear minimized state first so tutorial overlay can appear
        onExpand();
        setIsInTutorial(true);
        setTutorialStep(0);
      } else {
        onExpand();
      }
    };

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={handleMinimizedClick}
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
            {!isInTutorial && upcomingTodos.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-500 text-white text-xs">
                {upcomingTodos.length}
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
        {/* Dark overlay - higher z-index to appear above modals */}
        <div className="tutorial-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
        
        {/* Tutorial coach card - highest z-index */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-[70] w-[420px]"
        >
          <Card className="bg-gradient-to-br from-purple-700/95 via-fuchsia-600/90 to-indigo-700/95 border-purple-500/50 shadow-2xl backdrop-blur-md">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-sm">Proof Coach</h3>
                      <Badge className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-xs px-2 py-0.5 border-0">
                        Tutorial
                      </Badge>
                    </div>
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
                  className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all"
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

  // Coach Mode - Milestone-based Todo List UI
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[80vh] overflow-hidden"
    >
      <Card className="bg-gradient-to-br from-purple-700/95 via-fuchsia-600/90 to-indigo-700/95 border-purple-500/50 shadow-2xl backdrop-blur-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Proof Coach</h3>
                <p className="text-purple-300 text-xs">
                  Your validation milestones
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMinimize}
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                data-testid="button-minimize-coach"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                data-testid="button-close-coach"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Dynamic Message based on ProofScore */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-3 mb-4">
            <p className="text-white text-sm leading-relaxed">
              {getDynamicMessage()}
            </p>
          </div>

          {/* Todo List Container */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.3) transparent' }}>
            {/* Completed Tasks - Collapsed */}
            {completedTodos.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowAllCompleted(!showAllCompleted)}
                  className="flex items-center gap-2 text-xs text-purple-300 hover:text-white transition-colors mb-2 w-full"
                  data-testid="button-toggle-completed"
                >
                  <ChevronRight className={`h-3 w-3 transition-transform ${showAllCompleted ? 'rotate-90' : ''}`} />
                  <span>{completedTodos.length} completed task{completedTodos.length !== 1 ? 's' : ''}</span>
                </button>
                
                <AnimatePresence>
                  {showAllCompleted && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {completedTodos.map((step) => {
                        const StepIcon = step.icon;
                        return (
                          <div
                            key={step.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 opacity-60"
                            data-testid={`todo-item-completed-${step.id}`}
                          >
                            <div className="mt-0.5">
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <StepIcon className="h-4 w-4 text-purple-300" />
                                <h4 className="text-white/70 text-sm font-medium line-through">
                                  {step.title}
                                </h4>
                              </div>
                              <p className="text-purple-200/50 text-xs line-clamp-1">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Upcoming Tasks (Next 3) */}
            <div className="space-y-2">
              {upcomingTodos.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = activeStep?.id === step.id;
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-600/40 via-fuchsia-500/30 to-indigo-600/40 border border-purple-400/50 shadow-lg' 
                        : 'bg-white/10 hover:bg-white/15 border border-transparent'
                    }`}
                    onClick={() => handleTodoClick(step)}
                    data-testid={`todo-item-${step.id}`}
                  >
                    <div className="mt-0.5">
                      <Circle className={`h-5 w-5 ${isActive ? 'text-purple-300' : 'text-purple-400/50'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StepIcon className={`h-4 w-4 ${isActive ? 'text-purple-200' : 'text-purple-300'}`} />
                        <h4 className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/90'}`}>
                          {step.title}
                        </h4>
                      </div>
                      <p className={`text-xs line-clamp-2 mb-2 ${isActive ? 'text-purple-100' : 'text-purple-200/70'}`}>
                        {step.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs border-white/30 text-white/80">
                          {step.duration}
                        </Badge>
                        {isActive && (
                          <ArrowRight className="h-3 w-3 text-purple-300" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* All Completed Message */}
            {upcomingTodos.length === 0 && completedTodos.length > 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <h4 className="text-white font-semibold mb-1">All Milestones Complete!</h4>
                <p className="text-purple-200 text-sm">
                  You've completed all validation milestones. Keep building proof!
                </p>
              </div>
            )}
          </div>

          {/* Replay Tutorial Button */}
          {tutorialCompletedPages.includes(currentPage) && pageTutorials.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsInTutorial(true);
                  setTutorialStep(0);
                }}
                className="w-full border-white/30 text-white hover:bg-white/10"
                data-testid="button-replay-tutorial"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Replay {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Tutorial
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
