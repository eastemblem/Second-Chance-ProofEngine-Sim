import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { trackEvent, trackPageView } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Brain, BarChart3, CheckCircle, RefreshCw, AlertCircle, Upload, Mail } from "lucide-react";

interface ProcessingScreenProps {
  sessionId: string;
  onNext: () => void;
  onDataUpdate: (data: any) => void;
  onBack?: () => void; // Add navigation back function
  sessionData?: any; // Add session data to access retry count
}

const processingSteps = [
  {
    id: "upload",
    label: "Document Upload",
    description: "Processing your pitch deck",
    icon: FileText,
  },
  {
    id: "analysis",
    label: "AI Analysis",
    description: "Analyzing content and structure",
    icon: Brain,
  },
  {
    id: "scoring",
    label: "ProofScore Calculation",
    description: "Generating your investment readiness score",
    icon: BarChart3,
  },
  {
    id: "complete",
    label: "Analysis Complete",
    description: "Preparing your results",
    icon: CheckCircle,
  },
];

export default function ProcessingScreen({ 
  sessionId, 
  onNext, 
  onDataUpdate,
  onBack,
  sessionData
}: ProcessingScreenProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // Get retry count from session data, default to 0
  const initialRetryCount = sessionData?.stepData?.processing?.retryCount || 0;
  const [retryCount, setRetryCount] = useState(initialRetryCount);
  
  // Sync retry count when session data changes
  useEffect(() => {
    const sessionRetryCount = sessionData?.stepData?.processing?.retryCount || 0;
    setRetryCount(sessionRetryCount);
  }, [sessionData?.stepData?.processing?.retryCount]);

  // GA tracking for processing step
  useEffect(() => {
    trackPageView('/onboarding/processing');
    trackEvent('funnel_onboarding_processing_viewed', 'onboarding', 'processing_step');
  }, []);
  const [documentsNotified, setDocumentsNotified] = useState({
    certificate: false,
    report: false
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Ref to prevent duplicate scoring calls
  const scoringTriggeredRef = useRef(false);

  const MAX_RETRIES = 3;

  // Validation function to check if scoring response has sufficient venture and founder data
  const validateScoringResponse = (data: any) => {


    const missingData = [];
    
    // Check for venture_name in processing output (where the actual data is)
    const processingOutput = data.data?.session?.stepData?.processing?.output;
    const ventureName = processingOutput?.venture_name;
    
    
    if (!ventureName) {
      missingData.push('venture');
    }
    
    // Check for team array with name field in processing output
    const teamData = processingOutput?.team;
    
    
    const hasFounderData = teamData && Array.isArray(teamData) && teamData.length > 0 && 
                          teamData.some(member => {
                            return member?.name;
                          });
    
    if (!hasFounderData) {
      missingData.push('team');
    }


    return {
      isValid: missingData.length === 0,
      missingData
    };
  };

  // Generate error message based on missing data and retry count
  const getValidationErrorMessage = (missingData: string[], attempt: number) => {
    const messages = {
      1: "Please upload a file with venture and team details.",
      2: "Please ensure your file includes both business information and founder profiles.",
      3: "Your file should contain company details and team member information. Try uploading a pitch deck or business plan."
    };

    const baseMessage = messages[Math.min(attempt, 3) as keyof typeof messages];
    
    if (missingData.length === 2) {
      return `Analysis failed: We couldn't find venture and team details in your document. ${baseMessage}`;
    } else if (missingData.includes('venture')) {
      return `Analysis failed: We couldn't find venture details in your document. ${baseMessage}`;
    } else if (missingData.includes('team')) {
      return `Analysis failed: We couldn't find team details in your document. ${baseMessage}`;
    }
    
    return `Analysis failed: We couldn't process your document. ${baseMessage}`;
  };

  const submitForScoringMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/v1/onboarding/submit-for-scoring", {
        sessionId
      });
      
      const text = await res.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }
    },
    onError: (error: any) => {
      // Track processing error
      trackEvent('onboarding_processing_error', 'user_journey', 'ai_analysis_failed');
      
      const errorMsg = error.message || "Failed to process your submission";
      setHasError(true);
      setErrorMessage(errorMsg);
      setCurrentStep(processingSteps.length - 2); // Set to scoring step to show where it failed
      
      // Increment retry count for any processing error and update session
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      // Update session data with new retry count
      onDataUpdate({ 
        retryCount: newRetryCount,
        hasError: true,
        errorMessage: errorMsg
      });
    },
    onSuccess: async (data) => {
      // Check if the response contains an error (like user action required)
      const processingData = data.data?.session?.stepData?.processing || data.data?.scoringResult;
      
      if (processingData?.hasError || processingData?.errorType === 'user_action_required') {
        // Track processing error for user action required cases
        trackEvent('onboarding_processing_error', 'user_journey', 'user_action_required');
        
        setHasError(true);
        setErrorMessage(processingData.errorMessage || "Unable to process the file");
        setCurrentStep(processingSteps.length - 2);
        
        // Increment retry count for any processing error and update session
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        // Update session data with new retry count
        onDataUpdate({ 
          ...processingData, 
          retryCount: newRetryCount,
          hasError: true,
          errorMessage: processingData.errorMessage || "Unable to process the file"
        });
        return; // Don't proceed with normal success flow
      }

      if (data?.success) {

        // Validate if response contains sufficient venture and founder data
        const validation = validateScoringResponse(data);
        
        if (!validation.isValid) {
          // Validation failed - increment retry count and show error
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          
          if (newRetryCount >= MAX_RETRIES) {
            const maxRetryMessage = "Maximum retry attempts reached. Please contact support if you continue having issues.";
            setValidationError(maxRetryMessage);
            setHasError(true);
            setErrorMessage(maxRetryMessage);
            
            return;
          }
          
          const errorMessage = getValidationErrorMessage(validation.missingData, newRetryCount);
          setValidationError(errorMessage);
          setShowFileUpload(true);
          setHasError(true);
          setErrorMessage(errorMessage);
          

          // Update session with retry count and error state
          onDataUpdate({ 
            retryCount: newRetryCount,
            hasError: true,
            errorMessage,
            validationError: errorMessage
          });
          
          return; // Don't proceed with normal success flow
        }

        // Validation passed - proceed with normal success flow

        // Track processing completion
        trackEvent('onboarding_processing_complete', 'user_journey', 'ai_analysis_complete');
        
        
        // Update session data with processing results - use data.data structure
        onDataUpdate(processingData || data.data);
        setProcessingComplete(true);
        
        // Check for certificate and report ready
        const processingInfo = data.data?.session?.stepData?.processing;
        if (processingInfo?.certificateUrl && !documentsNotified.certificate) {
          setDocumentsNotified(prev => ({ ...prev, certificate: true }));
        }
        
        if (processingInfo?.reportUrl && !documentsNotified.report) {
          setDocumentsNotified(prev => ({ ...prev, report: true }));
        }
        
        // Only proceed to next step if the processing was actually successful (not an error case)
        // Check multiple conditions to ensure no errors occurred
        const hasProcessingError = data.data?.hasError || processingData?.hasError || data.data?.errorMessage;
        if (data.data?.isComplete !== false && !hasProcessingError) {
          setTimeout(() => {
            onNext();
          }, 2000);
        } else if (hasProcessingError) {
        }
      }
    }
  });

  const handleRetry = () => {
    // Check if maximum retries reached
    if (retryCount >= MAX_RETRIES) {
      return;
    }
    
    // For retry attempts on processing errors (not validation errors which use Upload New File button)
    setHasError(false);
    setErrorMessage("");
    setValidationError(null);
    setProcessingComplete(false);
    setCurrentStep(0); // Start from beginning for retry
    
    // Immediately trigger scoring without waiting for step animation
    setTimeout(() => {
      submitForScoringMutation.mutate();
    }, 1000);
  };

  // Polling for document completion
  useEffect(() => {
    let documentCheckInterval: NodeJS.Timeout;
    
    if (processingComplete && !hasError) {
      // Start polling for document completion every 3 seconds
      documentCheckInterval = setInterval(async () => {
        try {
          const res = await apiRequest("GET", `/api/onboarding/session/${sessionId}`);
          const data = await res.json();
          
          if (data.success) {
            const processingInfo = data.data?.stepData?.processing;
            
            // Check for certificate completion
            if (processingInfo?.certificateUrl && !documentsNotified.certificate) {
              setDocumentsNotified(prev => ({ ...prev, certificate: true }));
            }
            
            // Check for report completion
            if (processingInfo?.reportUrl && !documentsNotified.report) {
              setDocumentsNotified(prev => ({ ...prev, report: true }));
            }
            
            // Stop polling if both documents are ready
            if (processingInfo?.certificateUrl && processingInfo?.reportUrl) {
              clearInterval(documentCheckInterval);
            }
          }
        } catch (error) {
        }
      }, 3000);
    }
    
    return () => {
      if (documentCheckInterval) {
        clearInterval(documentCheckInterval);
      }
    };
  }, [processingComplete, hasError, sessionId, documentsNotified]);

  useEffect(() => {
    // Check if maximum retries have been reached before starting processing
    if (retryCount >= MAX_RETRIES) {
      setHasError(true);
      setErrorMessage("Maximum retry attempts reached. Please upload a different file or start over.");
      return;
    }

    // Reset the scoring triggered flag when retry count changes (new attempt)
    scoringTriggeredRef.current = false;

    // Start processing automatically when component mounts
    
    // Simulate processing steps
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < processingSteps.length - 2) {
          return prev + 1;
        } else if (prev === processingSteps.length - 2 && !submitForScoringMutation.isPending && !hasError) {
          // Double-check retry limit before triggering API call
          if (retryCount >= MAX_RETRIES) {
            clearInterval(stepInterval);
            setHasError(true);
            setErrorMessage("Maximum retry attempts reached. Please upload a different file or start over.");
            return prev;
          }
          
          // Prevent duplicate scoring calls using ref
          if (scoringTriggeredRef.current) {
            clearInterval(stepInterval);
            return prev;
          }
          
          // Mark scoring as triggered before calling mutate
          scoringTriggeredRef.current = true;
          
          // Start actual processing when we reach the last step
          clearInterval(stepInterval);
          submitForScoringMutation.mutate();
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(stepInterval);
  }, [retryCount, hasError]); // Add hasError dependency to properly re-evaluate

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto text-center"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Processing Your Submission
        </h2>
        <p className="text-muted-foreground">
          Our AI is analyzing your pitch deck and generating your ProofScore
        </p>
      </div>

      <div className="space-y-6" data-testid="processing-status">
        {processingSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStep;
          const isComplete = index < currentStep || processingComplete;
          const isCurrent = index === currentStep && !processingComplete;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-colors ${
                isActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-muted'
              }`}
            >
              <div className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isComplete 
                  ? 'bg-primary-gold text-background' 
                  : isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground'
              }`}>
                {isCurrent && !processingComplete ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              
              <div className="text-left flex-1">
                <h3 className={`font-medium ${
                  isActive ? 'text-card-foreground' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </h3>
                <p className={`text-sm ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.description}
                </p>
              </div>

              {isComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0"
                >
                  <CheckCircle className="w-6 h-6 text-primary-gold" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-gradient-to-r from-destructive/10 to-destructive/20 border-2 border-destructive/50 rounded-lg"
        >
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">
            Processing Failed
          </h3>
          <p className="text-muted-foreground mb-4">
            {errorMessage.includes('timeout') || errorMessage.includes('taking longer than expected') 
              ? "The analysis is taking longer than expected. This may be due to high server load or a large file size."
              : errorMessage.includes('service unavailable') || errorMessage.includes('524')
                ? "The analysis service is temporarily unavailable. This is usually resolved within a few minutes."
                : errorMessage
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* For validation errors (missing venture/team details) or image-based PDF errors, show "Upload New File" button */}
            {validationError || 
             errorMessage.includes('venture and team details') ||
             errorMessage.includes('venture details') ||
             errorMessage.includes('team details') ||
             errorMessage.includes('business information') ||
             errorMessage.includes('founder profiles') ||
             errorMessage.includes('image-based') || 
             errorMessage.includes('couldn\'t score it') ? (
              retryCount >= MAX_RETRIES ? (
                <Button 
                  onClick={() => {
                    const subject = encodeURIComponent("Need Support - Document Analysis Issue");
                    const body = encodeURIComponent("Hi Support Team,\n\nI'm experiencing issues with document analysis on Second Chance platform. After multiple attempts, my document couldn't be processed successfully.\n\nSession ID: " + sessionId + "\n\nPlease help me resolve this issue.\n\nBest regards");
                    window.open(`mailto:info@get-secondchance.com?subject=${subject}&body=${body}`, '_blank');
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              ) : (
                <Button 
                  onClick={() => onBack && onBack()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New File
                </Button>
              )
            ) : (
              /* For other errors, show "Try Again" button */
              <Button 
                onClick={handleRetry}
                disabled={submitForScoringMutation.isPending || retryCount >= MAX_RETRIES}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {submitForScoringMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : retryCount >= MAX_RETRIES ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Max Retries Reached
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again {retryCount > 0 && `(${retryCount}/${MAX_RETRIES})`}
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => {
              // Clear all localStorage data
              localStorage.clear();
              
              // Clear browser cache if supported
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => {
                    caches.delete(name);
                  });
                });
              }
              
              // Reload the page
              window.location.reload();
            }}>
              Start Over
            </Button>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Retry attempts: {Math.min(retryCount, MAX_RETRIES)}/{MAX_RETRIES} 
              {retryCount >= MAX_RETRIES && " - Maximum retries reached"}
            </p>
          )}
        </motion.div>
      )}

      {processingComplete && !hasError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-primary-gold/10 border-2 border-primary rounded-lg"
        >
          <CheckCircle className="w-12 h-12 text-primary-gold mx-auto mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">
            Analysis Complete!
          </h3>
          <p className="text-foreground">
            Your ProofScore and detailed analysis are ready. Redirecting to results...
          </p>
        </motion.div>
      )}

      {!hasError && (
        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            This process typically takes 2-3 minutes. We're analyzing your pitch deck against 
            10+ key investment criteria used by top-tier VCs.
          </p>
          {submitForScoringMutation.isPending && (
            <div className="mt-4 flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing... This may take a few minutes</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}