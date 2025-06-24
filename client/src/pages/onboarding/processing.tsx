import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Brain, BarChart3, CheckCircle } from "lucide-react";

interface ProcessingScreenProps {
  sessionId: string;
  onNext: () => void;
  onDataUpdate: (data: any) => void;
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
  onDataUpdate 
}: ProcessingScreenProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);

  const submitForScoringMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/submit-for-scoring", {
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
    onSuccess: async (data) => {
      if (data?.success) {
        console.log("Processing completed. Full response:", data);
        console.log("Session data from processing:", data.session);
        console.log("Session stepData:", data.session?.stepData);
        console.log("Processing step data:", data.session?.stepData?.processing);
        
        // Update session data with processing results
        await onDataUpdate("processing", data?.session?.stepData?.processing);
        setProcessingComplete(true);
        
        setTimeout(() => {
          onNext();
        }, 2000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process your submission",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
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
  }, []);

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

      {processingComplete && (
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

      <div className="mt-8 text-sm text-muted-foreground">
        <p>
          This process typically takes 2-3 minutes. We're analyzing your pitch deck against 
          10+ key investment criteria used by top-tier VCs.
        </p>
      </div>
    </motion.div>
  );
}