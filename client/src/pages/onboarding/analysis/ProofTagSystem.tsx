import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getProofTagJustification, getProofTagIcon } from './utils';
import type { ProofTagSystemProps } from './types';

export default function ProofTagSystem({ extractedProofTags, proofScore, scoringResult }: ProofTagSystemProps) {
  return (
    <Card className="p-8 mb-6 border-border bg-card">
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
              {proofScore.prooTags.unlocked < proofScore.prooTags.total && (
                <span className="text-sm text-muted-foreground">
                  -{" "}
                  {proofScore.prooTags.total - proofScore.prooTags.unlocked}{" "}
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

      {/* ProofTags Grid - Unlocked and Locked */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <TooltipProvider>
          {/* Unlocked Tags */}
          {proofScore.prooTags.tags.map((tag: string, index: number) => (
            <motion.div
              key={`unlocked-${index}`}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: 0.6 + index * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="group"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative bg-gradient-to-br from-primary/10 to-primary-gold/10 border border-primary/20 rounded-lg p-3 hover:border-primary/40 transition-all duration-300 cursor-pointer hover:shadow-md">
                    {/* Achievement icon */}
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <div className="text-lg">{getProofTagIcon(tag)}</div>
                      </div>
                    </div>

                    {/* Tag text */}
                    <p className="relative text-center text-xs font-medium text-foreground leading-tight">
                      {tag}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm p-3">
                  <p className="text-sm">{getProofTagJustification(tag, scoringResult)}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ))}

          {/* Locked Tags */}
          {extractedProofTags.lockedTags.map((lockedTag, index) => (
            <motion.div
              key={`locked-${index}`}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: 0.6 + (proofScore.prooTags.tags.length + index) * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="group"
            >
              <div className="relative bg-background border border-primary/10 rounded-lg p-3 hover:border-primary/20 transition-all duration-300 opacity-60">
                {/* Locked overlay */}
                <div className="absolute inset-0 bg-background/80 rounded-lg" />

                {/* Achievement icon */}
                <div className="relative flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-muted/50 rounded-full flex items-center justify-center">
                    <div className="text-lg opacity-40">
                      {lockedTag.emoji}
                    </div>
                  </div>
                </div>

                {/* Tag text */}
                <p className="relative text-center text-xs font-medium text-foreground/60 leading-tight mb-1">
                  {lockedTag.name}
                </p>
              </div>
            </motion.div>
          ))}
        </TooltipProvider>
      </div>
    </Card>
  );
}