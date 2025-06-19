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
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        console.log("Scoring completed, passing data to analysis:", data.session);
        
        onDataUpdate(data.session);
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
                  ? 'border-purple-200 bg-purple-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isComplete 
                  ? 'bg-green-600 text-white' 
                  : isActive 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {isCurrent && !processingComplete ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              
              <div className="text-left flex-1">
                <h3 className={`font-medium ${
                  isActive ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {step.label}
                </h3>
                <p className={`text-sm ${
                  isActive ? 'text-gray-700' : 'text-gray-500'
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
                  <CheckCircle className="w-6 h-6 text-green-600" />
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
          className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-green-50 border-2 border-purple-200 rounded-lg"
        >
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-purple-900 mb-2">
            Analysis Complete!
          </h3>
          <p className="text-purple-700">
            Your ProofScore and detailed analysis are ready. Redirecting to results...
          </p>
        </motion.div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <p>
          This process typically takes 2-3 minutes. We're analyzing your pitch deck against 
          10+ key investment criteria used by top-tier VCs.
        </p>
      </div>
    </motion.div>
  );
}