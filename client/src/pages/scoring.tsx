import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle, Clock, Loader } from "lucide-react";
import { Card } from "@/components/ui/card";
import ProgressBar from "@/components/progress-bar";
import { analysisSteps } from "@/lib/data";

interface ScoringPageProps {
  onNext: () => void;
  onStartAnalysis: () => number;
  analysisProgress: number;
  isAnalyzing: boolean;
}

export default function ScoringPage({ 
  onNext, 
  onStartAnalysis, 
  analysisProgress, 
  isAnalyzing 
}: ScoringPageProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = onStartAnalysis();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [onStartAnalysis]);

  useEffect(() => {
    setCurrentStep(Math.floor((analysisProgress / 100) * analysisSteps.length));
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
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Brain className="text-white text-2xl w-8 h-8" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-4">Analyzing Your Venture</h2>
              <p className="text-muted-foreground mb-8">
                Our AI is evaluating your pitch deck and venture data across 5 key validation dimensions
              </p>
            </div>

            {/* Analysis Steps */}
            <div className="space-y-4 mb-8">
              {analysisSteps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep && isAnalyzing;
                const isPending = index > currentStep;

                return (
                  <motion.div
                    key={step.id}
                    className={`flex items-center justify-between p-4 bg-background rounded-lg transition-all duration-500 ${
                      isPending ? "opacity-50" : "opacity-100"
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: isPending ? 0.5 : 1, x: 0 }}
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
                      <span className="text-sm">{step.label}</span>
                    </span>
                    {isCompleted ? (
                      <CheckCircle className="text-primary w-5 h-5" />
                    ) : isCurrent ? (
                      <Loader className="text-primary-gold w-5 h-5 animate-spin" />
                    ) : (
                      <Clock className="text-muted-foreground w-5 h-5" />
                    )}
                  </motion.div>
                );
              })}
            </div>

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
