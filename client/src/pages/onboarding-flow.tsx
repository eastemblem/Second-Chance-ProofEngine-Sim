import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
// Removed encryption dependency
import FounderOnboarding from "./onboarding/founder";
import VentureOnboarding from "./onboarding/venture";
import TeamOnboarding from "./onboarding/team";
import DocumentUpload from "./onboarding/upload";
import ProcessingScreen from "./onboarding/processing";
import Analysis from "./onboarding/analysis";
// PaymentOnboarding removed - no longer part of flow
import ProgressBar from "@/components/progress-bar";
import Navbar from "@/components/navbar";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface SessionData {
  sessionId: string;
  currentStep: string;
  stepData: any;
  completedSteps: string[];
  isComplete: boolean;
}

const steps = [
  { key: "founder", name: "Founder Details", description: "Personal information and experience" },
  { key: "venture", name: "Venture Info", description: "Company details and market information" },
  { key: "team", name: "Team Members", description: "Add up to 4 team members (optional)" },
  { key: "upload", name: "Pitch Deck", description: "Upload your pitch deck" },
  { key: "processing", name: "Processing", description: "Analyzing your submission" },
  { key: "analysis", name: "Analysis", description: "Your ProofScore analysis results" }
];

// Helper function to determine the correct current step index
const determineCurrentStepIndex = (completedSteps: string[] = [], currentStep?: string, sessionData?: any): number => {
  // If no completed steps, start at step 0
  if (!completedSteps || completedSteps.length === 0) {
    return 0;
  }
  
  // Find the last completed step index
  let lastCompletedIndex = -1;
  for (let i = steps.length - 1; i >= 0; i--) {
    if (completedSteps.includes(steps[i].key)) {
      lastCompletedIndex = i;
      break;
    }
  }
  
  // The current step should be the next step after the last completed one
  let nextStepIndex = lastCompletedIndex + 1;
  
  // Special validation for analysis step
  if (nextStepIndex >= 5) { // analysis step index
    const processingData = sessionData?.stepData?.processing;
    
    // Check if processing is actually complete with valid results
    const hasValidScore = processingData && 
                         processingData.proofScore && 
                         processingData.proofScore > 0 &&
                         !processingData.hasError;
    
    // Also check if analysis step is already marked as completed (user has been on analysis page)
    const analysisCompleted = completedSteps.includes('analysis');
    
    // If trying to access analysis but processing isn't complete AND analysis wasn't already completed
    if (!hasValidScore && !analysisCompleted) {
      // Analysis access blocked - redirect to processing
      if (import.meta.env.MODE === 'development') {
        console.log(`Analysis access blocked: processing incomplete or has errors`, processingData);
      }
      return 4; // Force back to processing step
    }
    
    // If analysis was already completed (user was on analysis page before), allow them to stay
    if (analysisCompleted) {
      return 5; // Keep them on analysis step
    }
  }
  
  // Make sure we don't go beyond the available steps
  const targetIndex = Math.min(nextStepIndex, steps.length - 1);
  
  // Step determination logic for debugging
  if (import.meta.env.MODE === 'development') {
    console.log(`Step determination: completed=[${completedSteps.join(',')}], lastCompleted=${lastCompletedIndex}, target=${targetIndex}, currentStep=${currentStep}`);
  }
  
  return targetIndex;
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize session on component mount
  const initSessionMutation = useMutation({
    mutationFn: async () => {
      // Standard API request for onboarding flow
      
      const res = await apiRequest("POST", "/api/onboarding/session/init", {});
      return await res.json();
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        if (import.meta.env.MODE === 'development') {
          console.log(`Initialized session:`, response);
        }
        
        // Track onboarding start event
        trackEvent('onboarding_start', 'user_journey', 'session_initialized');
        
        // Extract session data from API response format
        const sessionData = {
          sessionId: response.data.sessionId,
          currentStep: response.data.currentStep,
          stepData: response.data.stepData,
          completedSteps: response.data.completedSteps,
          isComplete: response.data.isComplete
        };
        
        setSessionData(sessionData);
        // Determine the correct step index based on completed steps
        const stepIndex = determineCurrentStepIndex(sessionData.completedSteps, sessionData.currentStep, sessionData);
        setCurrentStepIndex(stepIndex);
        
        // Store session in localStorage for persistence
        try {
          localStorage.setItem('onboardingSession', JSON.stringify(sessionData));
          if (import.meta.env.MODE === 'development') {
            console.log(`Initial session stored in localStorage`);
          }
        } catch (error) {
          if (import.meta.env.MODE === 'development') {
            console.error(`❌ Failed to store initial session:`, error);
          }
        }
      }
    },
    onError: (error) => {
      if (import.meta.env.MODE === 'development') {
        console.error("Failed to initialize session:", error);
      }
      toast({
        title: "Session Error",
        description: "Failed to initialize onboarding session",
        variant: "destructive",
      });
    }
  });

  // Check for existing session on mount
  useEffect(() => {
    const initializeOnboarding = async () => {
      // Standard onboarding initialization
      
      const existingSession = localStorage.getItem('onboardingSession');
      if (existingSession) {
        try {
          const parsedSession = JSON.parse(existingSession);
          if (!parsedSession.isComplete) {
            setSessionData(parsedSession);
            const stepIndex = determineCurrentStepIndex(parsedSession.completedSteps, parsedSession.currentStep, parsedSession);
            setCurrentStepIndex(stepIndex);
            return;
          }
        } catch (error) {
          if (import.meta.env.MODE === 'development') {
            console.error("Invalid session data in localStorage");
          }
        }
      }
      
      // Initialize new session
      initSessionMutation.mutate();
    };
    
    initializeOnboarding();
  }, []);

  // Navigate to next step
  const nextStep = async () => {
    if (currentStepIndex < steps.length - 1) {
      const currentStep = steps[currentStepIndex];
      const nextIndex = currentStepIndex + 1;
      const nextStep = steps[nextIndex];
      
      // Track step completion
      trackEvent('onboarding_step_complete', 'user_journey', currentStep.key, currentStepIndex + 1);
      
      // Refresh session data if needed before proceeding
      if (currentStep.key === "processing") {
        if (import.meta.env.MODE === 'development') {
          console.log("Refreshing session data after processing...");
        }
        await refreshSessionFromServer();
      }
      
      // Track step progression
      trackEvent('onboarding_step_start', 'user_journey', nextStep.key, nextIndex + 1);
      
      setCurrentStepIndex(nextIndex);
      
      if (sessionData) {
        const updatedSession = {
          ...sessionData,
          currentStep: steps[nextIndex].key,
          currentStepIndex: nextIndex
        };
        setSessionData(updatedSession);
        localStorage.setItem('onboardingSession', JSON.stringify(updatedSession));
        if (import.meta.env.MODE === 'development') {
          console.log(`Navigated to step ${nextIndex}: ${steps[nextIndex].key}`);
        }
      }
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (currentStepIndex > 0) {
      const currentStep = steps[currentStepIndex];
      const prevIndex = currentStepIndex - 1;
      const prevStep = steps[prevIndex];
      
      // Track step back navigation
      trackEvent('onboarding_step_back', 'user_journey', `${currentStep.key}_to_${prevStep.key}`, prevIndex + 1);
      
      setCurrentStepIndex(prevIndex);
      
      if (sessionData) {
        const updatedSession = {
          ...sessionData,
          currentStep: steps[prevIndex].key
        };
        setSessionData(updatedSession);
        localStorage.setItem('onboardingSession', JSON.stringify(updatedSession));
      }
    }
  };

  // Refresh session data from server API
  const refreshSessionFromServer = async () => {
    if (!sessionData?.sessionId) {
      if (import.meta.env.MODE === 'development') {
        console.error('No sessionId available for refresh');
      }
      return;
    }

    try {
      if (import.meta.env.MODE === 'development') {
        // Session refresh (logged in development mode only)
      }
      const response = await fetch(`/api/onboarding/session/${sessionData.sessionId}`);
      
      if (response.ok) {
        const serverSession = await response.json();
        if (import.meta.env.MODE === 'development') {
          // Server session retrieved successfully
        }
        
        // Update local state with server data
        const updatedSession = {
          ...sessionData,
          ...serverSession.session,
          stepData: serverSession.session.stepData || {},
          completedSteps: serverSession.session.completedSteps || []
        };
        
        setSessionData(updatedSession);
        
        // Update current step index based on completed steps
        const stepIndex = determineCurrentStepIndex(updatedSession.completedSteps, updatedSession.currentStep, updatedSession);
        setCurrentStepIndex(stepIndex);
        
        localStorage.setItem('onboardingSession', JSON.stringify(updatedSession));
        
        if (import.meta.env.MODE === 'development') {
          // Local session synchronized with server
        }
        return updatedSession;
      } else {
        if (import.meta.env.MODE === 'development') {
          console.error(`Failed to fetch session: ${response.status}`);
        }
      }
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error(`Error refreshing session:`, error);
      }
    }
  };

  // Simplified update - just trigger server refresh
  const updateSessionData = (stepKey: string, data: any) => {
    if (import.meta.env.MODE === 'development') {
      // Updating session data for current step
    }
    
    if (!sessionData) {
      if (import.meta.env.MODE === 'development') {
        console.error('No sessionData available for update');
      }
      return;
    }

    // Ensure we don't overwrite existing step data
    const currentStepData = sessionData.stepData?.[stepKey] || {};
    const mergedStepData = { ...currentStepData, ...data };
    
    // Ensure completedSteps is an array and add current step if not already present
    const currentCompleted = Array.isArray(sessionData.completedSteps) ? sessionData.completedSteps : [];
    const updatedCompleted = currentCompleted.includes(stepKey) 
      ? currentCompleted 
      : [...currentCompleted, stepKey];

    const updatedSession = {
      ...sessionData,
      stepData: {
        ...sessionData.stepData,
        [stepKey]: mergedStepData
      },
      completedSteps: updatedCompleted,
      lastUpdated: new Date().toISOString()
    };
    
    if (import.meta.env.MODE === 'development') {
      // Session updated successfully
    }
    
    // Update both state and localStorage atomically
    setSessionData(updatedSession);
    try {
      localStorage.setItem('onboardingSession', JSON.stringify(updatedSession));
      if (import.meta.env.MODE === 'development') {
        console.log('Successfully saved to localStorage');
      }
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('Failed to save to localStorage:', error);
      }
    }
  };

  const handleComplete = () => {
    // Track onboarding completion
    trackEvent('onboarding_complete', 'user_journey', 'full_analysis_complete');
    
    // Clear session from localStorage
    localStorage.removeItem('onboardingSession');
    onComplete();
  };

  if (!sessionData) {
    return (
      <Layout>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Navbar logoOnly={true} />
        </div>
        
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <div className="text-foreground text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Initializing onboarding session...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Additional validation for sessionId
  if (!sessionData.sessionId) {
    if (import.meta.env.MODE === 'development') {
      // Error: Session data missing required sessionId
    }
    
    // Try to fix the session data structure if it's in API response format
    if ((sessionData as any).success && (sessionData as any).data && (sessionData as any).data.sessionId) {
      const apiResponse = sessionData as any;
      const fixedSessionData = {
        sessionId: apiResponse.data.sessionId,
        currentStep: apiResponse.data.currentStep,
        stepData: apiResponse.data.stepData,
        completedSteps: apiResponse.data.completedSteps,
        isComplete: apiResponse.data.isComplete
      };
      setSessionData(fixedSessionData);
      localStorage.setItem('onboardingSession', JSON.stringify(fixedSessionData));
      return null; // Re-render with fixed data
    }
    
    return (
      <Layout>
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Navbar logoOnly={true} />
        </div>
        
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <div className="text-foreground text-center text-red-600">
            <p>Session initialization error. Please refresh the page.</p>
            <button 
              onClick={() => {
                localStorage.removeItem('onboardingSession');
                window.location.reload();
              }}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Restart Onboarding
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentStep = steps[currentStepIndex];

  return (
    <Layout>
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Navbar logoOnly={true} />
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Progress Bar */}
        <div className="mb-8 mx-4 sm:mx-8">
          <ProgressBar 
            currentStep={currentStepIndex + 1} 
            totalSteps={steps.length} 
            stepName={currentStep.name}
          />
          
          {/* Step Indicator */}
          <div className="flex justify-between items-center mt-4 px-4">
            {steps.map((step, index) => {
              const isCompleted = sessionData.completedSteps?.includes(step.key) || index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isActive = index <= currentStepIndex;
              
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent
                      ? 'bg-white text-purple-900 border-2 border-purple-500'
                      : isActive
                      ? 'bg-white text-purple-900' 
                      : 'bg-purple-800 text-white'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs mt-1 ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-xl p-8 mx-4 sm:mx-8 lg:mx-12 shadow-2xl border"
          >
            {currentStep.key === "founder" && (
              <FounderOnboarding
                sessionId={sessionData.sessionId}
                initialData={sessionData.stepData?.founder}
                onNext={nextStep}
                onDataUpdate={(data) => updateSessionData("founder", data)}
              />
            )}
            

            
            {currentStep.key === "venture" && (
              <VentureOnboarding
                sessionId={sessionData.sessionId}
                initialData={sessionData.stepData?.venture}
                onNext={nextStep}
                onPrev={prevStep}
                onDataUpdate={(data: any) => {
                  if (import.meta.env.MODE === 'development') {
                    // Venture data updated
                  }
                  updateSessionData("venture", data);
                }}
              />
            )}
            
            {currentStep.key === "team" && (
              <TeamOnboarding
                sessionId={sessionData?.sessionId || ''}
                initialData={sessionData?.stepData?.team}
                onNext={nextStep}
                onPrev={prevStep}
                onDataUpdate={(data) => updateSessionData("team", data)}
              />
            )}
            
            {currentStep.key === "upload" && (
              <DocumentUpload
                sessionId={sessionData.sessionId}
                onNext={nextStep}
                onPrev={prevStep}
                onDataUpdate={(data) => updateSessionData("upload", data)}
              />
            )}
            
            {currentStep.key === "processing" && (
              <ProcessingScreen
                sessionId={sessionData.sessionId}
                sessionData={sessionData}
                onNext={nextStep}
                onBack={prevStep}
                onDataUpdate={(data) => {
                  // Processing data received and session updated
                  updateSessionData("processing", data);
                }}
              />
            )}
            
            {currentStep.key === "analysis" && (() => {
              // Mark analysis step as completed when user lands on it (for reload persistence)
              if (sessionData && !sessionData.completedSteps?.includes('analysis')) {
                const updatedSession = {
                  ...sessionData,
                  completedSteps: [...(sessionData.completedSteps || []), 'analysis']
                };
                setSessionData(updatedSession);
                localStorage.setItem('onboardingSession', JSON.stringify(updatedSession));
                // Analysis step marked as completed for reload persistence
              }
              
              return (
                <Analysis
                  sessionId={sessionData.sessionId}
                  sessionData={{
                    ...sessionData,
                    scoringResult: sessionData?.stepData?.processing?.scoringResult
                  }}
                  onNext={handleComplete}
                  onComplete={handleComplete}
                />
              );
            })()}
            
            {/* Payment step removed - users go directly from analysis to completion */}

            

          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}