import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Brain, BarChart3, CheckCircle, RefreshCw, AlertCircle, Upload } from "lucide-react";

interface ProcessingScreenProps {
  sessionId: string;
  onNext: () => void;
  onDataUpdate: (data: any) => void;
  onBack?: () => void; // Add navigation back function
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
  onBack
}: ProcessingScreenProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [documentsNotified, setDocumentsNotified] = useState({
    certificate: false,
    report: false
  });

  const submitForScoringMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/v1/onboarding/submit-for-scoring", {
        sessionId
      });
      
      const text = await res.text();
      console.log('Raw response:', text);
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
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
      
      // Increment retry count for any processing error
      setRetryCount(prev => prev + 1);
      
      toast({
        title: "Processing Failed",
        description: errorMsg,
        variant: "destructive",
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
        
        // Increment retry count for any processing error
        setRetryCount(prev => prev + 1);
        
        toast({
          title: "File Processing Issue",
          description: processingData.errorMessage || "Unable to process the file",
          variant: "destructive",
        });
        return; // Don't proceed with normal success flow
      }

      if (data?.success) {
        // Track processing completion
        trackEvent('onboarding_processing_complete', 'user_journey', 'ai_analysis_complete');
        
        console.log("Processing completed. Full response:", data);
        console.log("Session data from processing:", data.data?.session);
        console.log("Session stepData:", data.data?.session?.stepData);
        console.log("Processing step data:", data.data?.session?.stepData?.processing);
        
        // Update session data with processing results - use data.data structure
        console.log("🎯 Final processing data being sent to onboarding flow:", processingData);
        onDataUpdate(processingData || data.data);
        setProcessingComplete(true);
        
        // Show toast notifications for certificate and report when ready
        const processingInfo = data.data?.session?.stepData?.processing;
        if (processingInfo?.certificateUrl && !documentsNotified.certificate) {
          toast({
            title: "🏆 Certificate Ready!",
            description: "Your ProofScore certificate has been generated and is ready for download.",
            duration: 5000,
          });
          setDocumentsNotified(prev => ({ ...prev, certificate: true }));
        }
        
        if (processingInfo?.reportUrl && !documentsNotified.report) {
          toast({
            title: "📊 Analysis Report Ready!",
            description: "Your detailed analysis report has been generated and is ready for download.",
            duration: 5000,
          });
          setDocumentsNotified(prev => ({ ...prev, report: true }));
        }
        
        // Only proceed to next step if the processing was actually successful (not an error case)
        if (data.data?.isComplete !== false) {
          setTimeout(() => {
            onNext();
          }, 2000);
        }
      }
    }
  });

  const MAX_RETRIES = 3;

  const handleRetry = () => {
    // Check if maximum retries reached
    if (retryCount >= MAX_RETRIES) {
      toast({
        title: "Maximum Retries Reached",
        description: "Please try uploading a different file or start over.",
        variant: "destructive",
      });
      return;
    }

    // For image-based PDF errors, navigate back to upload instead of retrying
    if (errorMessage.includes('image-based') || errorMessage.includes('couldn\'t score it')) {
      onBack && onBack();
      return;
    }
    
    // For other errors, retry the processing (don't increment counter here, it's done in mutation handlers)
    setHasError(false);
    setErrorMessage("");
    setProcessingComplete(false);
    setCurrentStep(processingSteps.length - 2); // Go to scoring step
    submitForScoringMutation.mutate();
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
              toast({
                title: "🏆 Certificate Ready!",
                description: "Your ProofScore certificate has been generated and is ready for download.",
                duration: 5000,
              });
              setDocumentsNotified(prev => ({ ...prev, certificate: true }));
            }
            
            // Check for report completion
            if (processingInfo?.reportUrl && !documentsNotified.report) {
              toast({
                title: "📊 Analysis Report Ready!",
                description: "Your detailed analysis report has been generated and is ready for download.",
                duration: 5000,
              });
              setDocumentsNotified(prev => ({ ...prev, report: true }));
            }
            
            // Stop polling if both documents are ready
            if (processingInfo?.certificateUrl && processingInfo?.reportUrl) {
              clearInterval(documentCheckInterval);
            }
          }
        } catch (error) {
          console.log('Document check polling error:', error);
        }
      }, 3000);
    }
    
    return () => {
      if (documentCheckInterval) {
        clearInterval(documentCheckInterval);
      }
    };
  }, [processingComplete, hasError, sessionId, documentsNotified, toast]);

  useEffect(() => {
    // Only start automatic processing on first load, not on retries
    if (retryCount === 0) {
      // Simulate processing steps
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < processingSteps.length - 2) {
            return prev + 1;
          } else if (prev === processingSteps.length - 2) {
            // Start actual processing when we reach the last step
            clearInterval(stepInterval);
            submitForScoringMutation.mutate();
            return prev + 1;
          }
          return prev;
        });
      }, 2000);

      return () => clearInterval(stepInterval);
    }
  }, [retryCount]);

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

      <div className="space-y-6">
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
                : errorMessage.includes('image-based') || errorMessage.includes('couldn\'t score it') 
                  ? `${errorMessage} Please upload a text-based PDF file that can be processed by our AI analysis system.`
                  : errorMessage
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* For image-based PDF errors, show "Upload Different File" button */}
            {errorMessage.includes('image-based') || errorMessage.includes('couldn\'t score it') ? (
              <Button 
                onClick={() => onBack && onBack()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Different File
              </Button>
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
            <Button variant="outline" onClick={() => window.location.reload()}>
              Start Over
            </Button>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Retry attempts: {retryCount}/{MAX_RETRIES} 
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