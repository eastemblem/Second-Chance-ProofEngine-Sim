import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, CheckCircle, Clock, Loader } from "lucide-react";

interface ProcessingScreenProps {
  sessionId: string;
  onNext: () => void;
  onDataUpdate: (data: any) => void;
}

const processingSteps = [
  {
    title: "Analyzing Pitch Deck",
    description: "Reading and extracting content from your pitch deck",
    duration: 3000,
  },
  {
    title: "Evaluating Business Model",
    description: "Assessing market opportunity and business viability",
    duration: 4000,
  },
  {
    title: "Scoring Framework",
    description: "Applying ProofScore methodology to your venture",
    duration: 3000,
  },
  {
    title: "Generating Insights",
    description: "Creating personalized recommendations and feedback",
    duration: 5000,
  },
  {
    title: "Finalizing Results",
    description: "Preparing your comprehensive analysis report",
    duration: 2000,
  },
];

export default function ProcessingScreen({
  sessionId,
  onNext,
  onDataUpdate
}: ProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const { toast } = useToast();

  // Submit for scoring mutation
  const scoringMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/submit-for-scoring", {
        sessionId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onDataUpdate({ 
          scoringResult: data.scoringResult,
          folderStructure: data.folderStructure,
          completedAt: new Date()
        });
        
        // Show completion message
        toast({
          title: "Analysis Complete!",
          description: "Your ProofScore analysis is ready",
        });
        
        // Move to next step after brief delay
        setTimeout(() => {
          onNext();
        }, 1500);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Processing Error", 
        description: error.message || "Failed to process your submission",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  // Auto-advance through processing steps
  useEffect(() => {
    if (currentStep < processingSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, processingSteps[currentStep].duration);

      return () => clearTimeout(timer);
    } else {
      // Start actual processing when visual steps complete
      const processingTimer = setTimeout(() => {
        scoringMutation.mutate();
      }, processingSteps[currentStep].duration);

      return () => clearTimeout(processingTimer);
    }
  }, [currentStep, scoringMutation]);

  // Calculate overall progress
  const overallProgress = scoringMutation.isPending 
    ? 95 // Almost complete during actual processing
    : Math.min(((currentStep + 1) / processingSteps.length) * 90, 90); // 90% when visual steps complete

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Brain className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Analyzing Your Venture</h2>
        <p className="text-gray-600">
          Our AI is processing your information to generate your ProofScore
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-medium text-purple-600">{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Processing Steps */}
      <div className="space-y-4 mb-8">
        {processingSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep || scoringMutation.isSuccess;
          const isPending = index > currentStep && !scoringMutation.isSuccess;

          return (
            <Card
              key={index}
              className={`transition-all duration-500 ${
                isActive
                  ? "border-purple-500 shadow-md scale-[1.02]"
                  : isCompleted
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className={`mr-4 flex-shrink-0 ${
                    isCompleted 
                      ? "text-green-600" 
                      : isActive 
                      ? "text-purple-600" 
                      : "text-gray-400"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : isActive ? (
                      <div className="animate-spin">
                        <Loader className="h-6 w-6" />
                      </div>
                    ) : (
                      <Clock className="h-6 w-6" />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className={`font-semibold ${
                      isActive ? "text-purple-900" : isCompleted ? "text-green-900" : "text-gray-700"
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm ${
                      isActive ? "text-purple-700" : isCompleted ? "text-green-700" : "text-gray-500"
                    }`}>
                      {step.description}
                    </p>
                  </div>

                  {isActive && (
                    <div className="ml-4">
                      <div className="flex space-x-1">
                        {[0, 1, 2].map((dot) => (
                          <div
                            key={dot}
                            className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"
                            style={{
                              animationDelay: `${dot * 0.2}s`,
                              animationDuration: "1s"
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Final Processing Status */}
      {scoringMutation.isPending && (
        <Card className="border-purple-500 shadow-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="font-semibold text-purple-900 mb-2">
              Processing Your Submission...
            </h3>
            <p className="text-purple-700 text-sm">
              This may take a few moments as we analyze your pitch deck and generate insights
            </p>
          </CardContent>
        </Card>
      )}

      {scoringMutation.isSuccess && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-green-900 mb-2">
              Analysis Complete!
            </h3>
            <p className="text-green-700 text-sm">
              Your ProofScore analysis is ready. Redirecting to results...
            </p>
          </CardContent>
        </Card>
      )}

      {scoringMutation.isError && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">⚠️</div>
            <h3 className="font-semibold text-red-900 mb-2">
              Processing Failed
            </h3>
            <p className="text-red-700 text-sm mb-4">
              There was an error processing your submission. Please try again.
            </p>
            <button
              onClick={() => scoringMutation.mutate()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry Processing
            </button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}