import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/progress-bar";
import { ProofScoreResult } from "@shared/schema";

// Import cleaned components
import { useAnalysisData, useProofTags, useCelebration } from './hooks';
import { getScoreBadge, getBadgeNumber } from './utils';
import ScoreDisplay from './ScoreDisplay';
import ProofTagSystem from './ProofTagSystem';
import CategoryBreakdown from './CategoryBreakdown';
import CelebrationEffects from './CelebrationEffects';
import type { AnalysisProps } from './types';

interface FeedbackPageProps {
  onNext: () => void;
  proofScore: ProofScoreResult;
}

export default function Analysis({
  sessionId,
  sessionData,
  onComplete,
}: AnalysisProps) {
  const { scoringResult, analysisData, isLoading, founderData, ventureData } = useAnalysisData(sessionId, sessionData);
  const extractedProofTags = useProofTags(scoringResult);
  const celebration = useCelebration(analysisData.total_score);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!scoringResult) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Analysis Not Available
        </h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find your analysis results. Please try the analysis process again.
        </p>
        <Button onClick={onComplete} variant="outline">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const scoreBadge = getScoreBadge(analysisData.total_score);
  const badgeNumber = getBadgeNumber(analysisData.total_score);

  // Transform analysis data to ProofScore format
  const proofScore: ProofScoreResult = {
    total: analysisData.total_score,
    dimensions: {
      desirability: scoringResult?.output?.Problem?.score || 0,
      feasibility: scoringResult?.output?.solution?.score || 0,
      viability: scoringResult?.output?.business_model?.score || 0,
      traction: scoringResult?.output?.traction_milestones?.score || 0,
      readiness: scoringResult?.output?.team?.score || 0,
    },
    prooTags: {
      unlocked: extractedProofTags.unlocked,
      total: extractedProofTags.total,
      tags: extractedProofTags.unlockedTags,
    },
    insights: {
      strengths: ["Strong market validation", "Clear value proposition"],
      improvements: ["Enhance technical roadmap", "Develop go-to-market strategy"],
      recommendations: analysisData.overall_feedback,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto p-6"
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <ProgressBar currentStep={5} totalSteps={5} />
      </div>

      {/* Celebration Effects */}
      <CelebrationEffects celebration={celebration} />

      {/* Main Score Display */}
      <ScoreDisplay 
        analysisData={analysisData}
        proofScore={proofScore}
        scoreBadge={scoreBadge}
        badgeNumber={badgeNumber}
      />

      {/* ProofTag System */}
      <ProofTagSystem 
        extractedProofTags={extractedProofTags}
        proofScore={proofScore}
        scoringResult={scoringResult}
      />

      {/* Category Breakdown */}
      <CategoryBreakdown 
        proofScore={proofScore}
        analysisData={analysisData}
      />

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="text-center"
      >
        <Button
          onClick={onComplete}
          size="lg"
          className="px-8 py-3 bg-primary hover:bg-primary/90"
        >
          Continue to Dashboard
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

function FeedbackPage({ onNext, proofScore }: FeedbackPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto text-center"
    >
      <h2 className="text-3xl font-bold gradient-text mb-6">
        Congratulations! 🎉
      </h2>
      <p className="text-xl text-muted-foreground mb-8">
        Your ProofScore analysis is complete. You've successfully validated key
        aspects of your startup.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
          <div className="text-3xl font-bold text-primary mb-2">
            {proofScore.total}
          </div>
          <div className="text-sm text-muted-foreground">Total Score</div>
        </div>
        <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
          <div className="text-3xl font-bold text-primary mb-2">
            {proofScore.prooTags.unlocked}
          </div>
          <div className="text-sm text-muted-foreground">ProofTags Unlocked</div>
        </div>
        <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
          <div className="text-3xl font-bold text-primary mb-2">5</div>
          <div className="text-sm text-muted-foreground">
            Dimensions Evaluated
          </div>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="px-8 py-3">
        View Detailed Analysis
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </motion.div>
  );
}