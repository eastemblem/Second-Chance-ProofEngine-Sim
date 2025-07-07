import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";

import ProgressBar from "@/components/progress-bar";
import { useAnalysisData } from "@/hooks/useAnalysisData";
import { useCelebrationAnimation } from "@/hooks/useCelebrationAnimation";
import { useProofScore } from "@/hooks/useProofScore";
import { ScoreBadge } from "@/components/analysis/ScoreBadge";
import { ProofTagsSection } from "@/components/analysis/ProofTagsSection";
import { ScoreBreakdown } from "@/components/analysis/ScoreBreakdown";
import { CelebrationOverlay } from "@/components/analysis/CelebrationOverlay";
import { extractProofTags } from "@/utils/proofTagUtils";
import { getMilestoneText } from "@/utils/scoreUtils";
import type { AnalysisProps } from "@/types/analysis";

export default function Analysis({
  sessionId,
  sessionData,
  onComplete,
}: AnalysisProps) {
  const {
    isLoading,
    scoringResult,
    analysisData,
    founderData,
    ventureData,
    hasData
  } = useAnalysisData(sessionId, sessionData);

  const proofScore = useProofScore(analysisData, scoringResult);
  const { showCelebration } = useCelebrationAnimation(analysisData?.total_score || 0);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Analysis...</h2>
          <p className="text-muted-foreground">
            Retrieving your scoring results...
          </p>
        </div>
      </div>
    );
  }

  // Check if we have valid scoring data
  if (!hasData || !proofScore) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Analysis Not Available</h2>
          <p className="text-muted-foreground">
            Please complete the scoring process first.
          </p>
        </div>
      </div>
    );
  }

  // Extract ProofTags data using utility function
  const extractedProofTags = extractProofTags(scoringResult, analysisData?.total_score || 0);

  return (
    <TooltipProvider>
      <div className="min-h-screen py-12 relative">
        {/* Celebration Animation Component */}
        <CelebrationOverlay show={showCelebration} />

        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Score Header Card */}
            <Card className="p-8 border-border bg-card mb-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <motion.span
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                    className="text-3xl"
                  >
                    🎯
                  </motion.span>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent">
                    Congratulations Founder!
                  </h2>
                  <motion.span
                    animate={{
                      rotate: [0, -10, 10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      delay: 0.5,
                    }}
                    className="text-3xl"
                  >
                    🚀
                  </motion.span>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center mb-8"
                >
                  <span className="text-lg text-muted-foreground">You are </span>
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent">
                    {getMilestoneText(proofScore?.total || 0)}
                  </span>
                </motion.div>

                {/* Badge and Score Display */}
                <div className="flex items-center justify-center gap-12 my-8">
                  <ScoreBadge score={proofScore?.total || 0} />
                  <div className="text-center">
                    <motion.div
                      className="text-4xl font-black gradient-text mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {proofScore?.total || 0}
                    </motion.div>
                    <p className="text-lg text-muted-foreground">out of 100</p>
                  </div>
                </div>
              </motion.div>
            </Card>

            {/* ProofTags Section */}
            <ProofTagsSection
              proofScore={proofScore}
              extractedProofTags={extractedProofTags}
              scoringResult={scoringResult}
            />

            {/* Score Breakdown */}
            <ScoreBreakdown proofScore={proofScore} analysisData={analysisData} />

            {/* Founder and Venture Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Founder Details */}
              <Card className="p-6 border-border bg-card">
                <CardContent className="p-0">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    👤 Founder Profile
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {founderData?.fullName || "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">
                        {founderData?.email || "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <span className="font-medium">
                        {founderData?.positionRole || "Founder"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Venture Details */}
              <Card className="p-6 border-border bg-card">
                <CardContent className="p-0">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    🚀 Venture Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">
                        {ventureData?.companyName || founderData?.startupName || "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Industry:</span>
                      <span className="font-medium">
                        {ventureData?.industry || founderData?.industry || "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stage:</span>
                      <span className="font-medium">
                        {ventureData?.revenueStage || founderData?.stage || "Early Stage"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Next Steps */}
            <Card className="p-8 border-border bg-card text-center">
              <h3 className="text-2xl font-bold mb-4">What's Next?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Your ProofScore provides a foundation for growth. Take the next step to
                unlock your startup's full potential and accelerate your journey to success.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={onComplete}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary-gold hover:from-primary/90 hover:to-primary-gold/90 text-white px-8"
                >
                  Continue Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <ProgressBar current={6} total={6} />
        </div>
      </div>
    </TooltipProvider>
  );
}