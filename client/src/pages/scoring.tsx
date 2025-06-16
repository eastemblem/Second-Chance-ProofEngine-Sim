import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle, Clock, Loader, Folder, FileText, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/progress-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ScoringPageProps {
  onNext: () => void;
  onStartAnalysis: () => number;
  analysisProgress: number;
  isAnalyzing: boolean;
}

const proofVaultSteps = [
  {
    title: "Checking ProofVault Status",
    description: "Verifying folder structure creation"
  },
  {
    title: "Analyzing Document Framework",
    description: "Reviewing proof organization structure"
  },
  {
    title: "Calculating Readiness Score",
    description: "Assessing investment preparation level"
  },
  {
    title: "Generating Proof Insights",
    description: "Creating personalized recommendations"
  },
  {
    title: "Finalizing ProofScore",
    description: "Completing comprehensive analysis"
  }
];

export default function ScoringPage({ 
  onNext, 
  analysisProgress, 
  isAnalyzing 
}: ScoringPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [proofScore, setProofScore] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query ProofVault session data
  const { data: sessionData } = useQuery({
    queryKey: ['/api/vault/session'],
    refetchInterval: isAnalyzing ? 2000 : false,
  });

  // Submit for scoring mutation
  const submitForScoring = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/vault/submit-for-scoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startup_name: 'SecondChanceStartup'
        })
      });
      
      if (!response.ok) {
        throw new Error('Scoring failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const score = data.data?.proofScore || data.proofScore || 0;
      setProofScore(score);
      queryClient.invalidateQueries({ queryKey: ['/api/vault/session'] });
      toast({
        title: "Scoring Complete",
        description: "Your pitch deck has been analyzed successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Scoring Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  });

  // useEffect(() => {
  //   onStartAnalysis();
  // }, [onStartAnalysis]);

  useEffect(() => {
    setCurrentStep(Math.floor((analysisProgress / 100) * proofVaultSteps.length));
  }, [analysisProgress]);

  useEffect(() => {
    if (analysisProgress >= 100 && !isAnalyzing) {
      const timer = setTimeout(() => {
        onNext();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [analysisProgress, isAnalyzing, onNext]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProgressBar currentStep={2} totalSteps={4} stepName="AI Analysis" />

          <Card className="p-12 border-border bg-card">
            <div className="mb-8">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ 
                  scale: submitForScoring.isPending ? [1, 1.1, 1] : 1,
                  rotate: submitForScoring.isPending ? [0, 5, -5, 0] : 0
                }}
                transition={{ 
                  duration: 2,
                  repeat: submitForScoring.isPending ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                {proofScore !== null ? (
                  <Target className="text-white text-2xl w-8 h-8" />
                ) : (
                  <Brain className="text-white text-2xl w-8 h-8" />
                )}
              </motion.div>
              
              {proofScore !== null ? (
                <>
                  <h2 className="text-3xl font-bold mb-4">ProofScore: {proofScore}</h2>
                  <p className="text-muted-foreground mb-8">
                    Your pitch deck has been analyzed and scored successfully
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold mb-4">Ready for Analysis</h2>
                  <p className="text-muted-foreground mb-8">
                    Submit your uploaded pitch deck for comprehensive AI evaluation across 5 key validation dimensions
                  </p>
                </>
              )}
            </div>

            {/* Submit for Scoring or Show Analysis Progress */}
            {proofScore === null && !submitForScoring.isPending ? (
              <div className="mb-8">
                <Button 
                  onClick={() => submitForScoring.mutate()}
                  className="w-full bg-gradient-to-r from-primary to-primary-gold hover:from-primary/90 hover:to-primary-gold/90 text-white font-semibold py-4 px-8 rounded-lg text-lg"
                  disabled={!sessionData?.success}
                >
                  <Brain className="mr-2 w-5 h-5" />
                  Submit for Scoring
                </Button>
                {!sessionData?.success && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Please upload a pitch deck first
                  </p>
                )}
              </div>
            ) : submitForScoring.isPending ? (
              <div className="space-y-4 mb-8">
                {proofVaultSteps.map((step, index) => {
                  const isCompleted = index < Math.floor((submitForScoring.isPending ? 60 : 0) / 100 * proofVaultSteps.length);
                  const isCurrent = index === Math.floor((submitForScoring.isPending ? 60 : 0) / 100 * proofVaultSteps.length) && submitForScoring.isPending;

                  return (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-4 bg-background rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="flex items-center">
                        {isCompleted ? (
                          <CheckCircle className="text-primary mr-3 w-5 h-5" />
                        ) : isCurrent ? (
                          <Loader className="text-primary-gold mr-3 w-5 h-5 animate-spin" />
                        ) : (
                          <Clock className="text-muted-foreground mr-3 w-5 h-5" />
                        )}
                        <span className="text-sm">{step.title}</span>
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-8">
                <div className="text-center">
                  <CheckCircle className="text-primary w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Analysis Complete</p>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="w-full bg-border rounded-full h-3 mb-4">
              <motion.div
                className="bg-gradient-to-r from-primary to-primary-gold h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${analysisProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This usually takes 30-60 seconds...
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
