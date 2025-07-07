import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { ProofTagCard } from "./ProofTagCard";
import { getMilestoneText } from "@/utils/scoreUtils";
import type { ExtractedProofTags } from "@/types/analysis";

interface ProofTagsSectionProps {
  proofScore: {
    total: number;
    prooTags: {
      unlocked: number;
      total: number;
      tags: string[];
    };
  };
  extractedProofTags: ExtractedProofTags;
  scoringResult: any;
}

export const ProofTagsSection = ({ proofScore, extractedProofTags, scoringResult }: ProofTagsSectionProps) => {
  const milestoneText = getMilestoneText(proofScore.total);

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary-gold/5 rounded-xl p-8 mb-6 border border-primary/10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-6"
      >
        <h3 className="text-2xl font-bold mb-4 gradient-text">
          🏆 ProofTag Validation Progress
        </h3>

        {/* Milestones Text and Progress Bar - Side by Side */}
        <div className="flex items-center justify-center gap-8 mx-6 mb-4">
          {/* Milestones Text - Center Aligned */}
          <div className="text-center flex-1">
            <p className="text-lg text-muted-foreground mb-2">
              {proofScore.prooTags.unlocked} of{" "}
              {proofScore.prooTags.total} validation milestones unlocked
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {proofScore.prooTags.unlocked}/{proofScore.prooTags.total}{" "}
                Tags Unlocked
              </span>
              {proofScore.prooTags.unlocked <
                proofScore.prooTags.total && (
                <span className="text-sm text-muted-foreground">
                  -{" "}
                  {proofScore.prooTags.total -
                    proofScore.prooTags.unlocked}{" "}
                  to go
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24">
              <svg
                className="w-24 h-24 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-border"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{
                    strokeDashoffset:
                      2 *
                      Math.PI *
                      40 *
                      (1 -
                        proofScore.prooTags.unlocked /
                          proofScore.prooTags.total),
                  }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
                <defs>
                  <linearGradient
                    id="progressGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--primary-gold))"
                    />
                  </linearGradient>
                </defs>
              </svg>

              {/* Percentage in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {Math.round(
                    (proofScore.prooTags.unlocked /
                      proofScore.prooTags.total) *
                      100,
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dynamic Milestone Text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/10 to-primary-gold/10 rounded-full border border-primary/20">
          <span className="text-sm font-semibold gradient-text">
            {milestoneText}
          </span>
          <span className="text-sm">
            {proofScore.total >= 91 ? "🚀" : proofScore.total >= 80 ? "🎯" : "⭐"}
          </span>
        </div>
      </motion.div>

      {/* ProofTags Grid - Unlocked and Locked */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Unlocked Tags */}
        {proofScore.prooTags.tags.map((tag, index) => (
          <ProofTagCard
            key={`unlocked-${index}`}
            tag={tag}
            index={index}
            scoringResult={scoringResult}
          />
        ))}

        {/* Locked Tags */}
        {extractedProofTags.lockedTags.map((lockedTag, index) => (
          <ProofTagCard
            key={`locked-${index}`}
            tag={lockedTag.name}
            isLocked
            index={index}
            totalUnlocked={proofScore.prooTags.tags.length}
            lockedTagData={lockedTag}
          />
        ))}
      </div>
    </div>
  );
};