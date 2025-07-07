import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { getMilestoneText } from './utils';
import type { ScoreDisplayProps } from './types';

export default function ScoreDisplay({ analysisData, proofScore, scoreBadge, badgeNumber }: ScoreDisplayProps) {
  return (
    <Card className="p-8 mb-8 bg-gradient-to-br from-primary/5 to-primary-gold/5 border-primary/10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        {/* Congratulations Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-3xl font-bold gradient-text mb-2">
            🎯 Congratulations Founder! 🚀
          </h2>
          <p className="text-lg text-muted-foreground">
            Your ProofScore is Ready
          </p>
        </motion.div>

        {/* Milestone Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-2xl font-bold gradient-text">
              {getMilestoneText(analysisData.total_score)}
            </span>
          </div>
        </motion.div>

        {/* Score and Badge Display */}
        <div className="flex items-center justify-center gap-8">
          {/* Badge on Left */}
          {scoreBadge && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="relative">
                <img
                  src={scoreBadge}
                  alt={`Score Badge ${badgeNumber}`}
                  className="w-28 h-28 drop-shadow-lg"
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.1 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 0.5,
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Score Display on Right */}
          <div className="text-center ml-4">
            <motion.div
              className="text-4xl font-black gradient-text mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {proofScore.total}
            </motion.div>
            <p className="text-lg text-muted-foreground">out of 100</p>
          </div>
        </div>
      </motion.div>
    </Card>
  );
}