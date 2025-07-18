import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FounderOnboarding from "./onboarding/founder";
import VentureOnboarding from "./onboarding/venture";
import TeamOnboarding from "./onboarding/team";
import DocumentUpload from "./onboarding/upload";
import ProcessingScreen from "./onboarding/processing";
import Analysis from "./onboarding/analysis";
import ProgressBar from "@/components/progress-bar";

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

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize session on component mount
  const initSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/onboarding/session/init", {});
      return await res.json();
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        console.log(`🎯 Initialized session:`, response);
        
        // Extract session data from API response format
        const sessionData = {
          sessionId: response.data.sessionId,
          currentStep: response.data.currentStep,
          stepData: response.data.stepData,
          completedSteps: response.data.completedSteps,
          isComplete: response.data.isComplete
        };
        
        setSessionData(sessionData);
        // Find current step index
        const stepIndex = steps.findIndex(step => step.key === sessionData.currentStep);
        setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
        
        // Store session in localStorage for persistence
        try {
          localStorage.setItem('onboardingSession', JSON.stringify(sessionData));
          console.log(`💾 Initial session stored in localStorage`);
        } catch (error) {
          console.error(`❌ Failed to store initial session:`, error);
        }
      }
    },
    onError: (error) => {
      console.error("Failed to initialize session:", error);
      toast({
        title: "Session Error",
        description: "Failed to initialize onboarding session",
        variant: "destructive",
      });
    }
  });

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = localStorage.getItem('onboardingSession');
    if (existingSession) {
      try {
        const parsedSession = JSON.parse(existingSession);
        if (!parsedSession.isComplete) {
          setSessionData(parsedSession);
          const stepIndex = steps.findIndex(step => step.key === parsedSession.currentStep);
          setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
          return;
        }
      } catch (error) {
        console.error("Invalid session data in localStorage");
      }
    }
    
    // Initialize new session
    initSessionMutation.mutate();
  }, []);

  // Navigate to next step
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      
      if (sessionData) {
        const updatedSession = {
          ...sessionData,
          currentStep: steps[nextIndex].key,
          currentStepIndex: nextIndex
        };
        setSessionData(updatedSession);
        localStorage.setItem('onboardingSession', JSON.stringify(updatedSession));
        console.log(`Navigated to step ${nextIndex}: ${steps[nextIndex].key}`);
      }
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
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
      console.error('No sessionId available for refresh');
      return;
    }

    try {
      console.log(`Refreshing session data from server...`);
      const response = await fetch(`/api/onboarding/session/${sessionData.sessionId}`);
      
      if (response.ok) {
        const serverSession = await response.json();
        console.log(`Server session retrieved:`, serverSession.session);
        
        // Update local state with server data
        const updatedSession = {
          ...sessionData,
          ...serverSession.session,
          stepData: serverSession.session.stepData || {},
          completedSteps: serverSession.session.completedSteps || []
        };
        
        setSessionData(updatedSession);
        localStorage.setItem('onboardingSession', JSON.stringify(updatedSession));
        
        console.log(`Local session synchronized with server`);
        return updatedSession;
      } else {
        console.error(`Failed to fetch session: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error refreshing session:`, error);
    }
  };

  // Simplified update - just trigger server refresh
  const updateSessionData = (stepKey: string, data: any) => {
    console.log(`Updating session data for step ${stepKey}:`, data);
    
    if (!sessionData) {
      console.error('No sessionData available for update');
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
    
    console.log('Session updated:', updatedSession);
    
    // Update both state and localStorage atomically
    setSessionData(updatedSession);
    try {
      localStorage.setItem('onboardingSession', JSON.stringify(updatedSession));
      console.log('Successfully saved to localStorage');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  const handleComplete = () => {
    // Clear session from localStorage
    localStorage.removeItem('onboardingSession');
    onComplete();
  };

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-foreground text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Initializing onboarding session...</p>
        </div>
      </div>
    );
  }

  // Additional validation for sessionId
  if (!sessionData.sessionId) {
    console.error('OnboardingFlow: sessionData exists but sessionId is missing', sessionData);
    
    // Try to fix the session data structure if it's in API response format
    if (sessionData.success && sessionData.data && sessionData.data.sessionId) {
      const fixedSessionData = {
        sessionId: sessionData.data.sessionId,
        currentStep: sessionData.data.currentStep,
        stepData: sessionData.data.stepData,
        completedSteps: sessionData.data.completedSteps,
        isComplete: sessionData.data.isComplete
      };
      setSessionData(fixedSessionData);
      localStorage.setItem('onboardingSession', JSON.stringify(fixedSessionData));
      return null; // Re-render with fixed data
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
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
    );
  }

  const currentStep = steps[currentStepIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
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
                onDataUpdate={updateSessionData}
              />
            )}
            
            {currentStep.key === "venture" && (
              <VentureOnboarding
                sessionId={sessionData.sessionId}
                initialData={sessionData.stepData?.venture}
                onNext={nextStep}
                onPrev={prevStep}
                onDataUpdate={(data: any) => {
                  console.log("VentureOnboarding onDataUpdate called with:", data);
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
                onDataUpdate={updateSessionData}
              />
            )}
            
            {currentStep.key === "upload" && (
              <DocumentUpload
                sessionId={sessionData.sessionId}
                onNext={nextStep}
                onPrev={prevStep}
                onDataUpdate={updateSessionData}
              />
            )}
            
            {currentStep.key === "processing" && (
              <ProcessingScreen
                sessionId={sessionData.sessionId}
                onNext={nextStep}
                onDataUpdate={updateSessionData}
              />
            )}
            
            {currentStep.key === "analysis" && (
              <Analysis
                sessionId={sessionData.sessionId}
                sessionData={{
                  ...sessionData,
                  scoringResult: sessionData?.stepData?.processing?.scoringResult
                }}
                onComplete={handleComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}