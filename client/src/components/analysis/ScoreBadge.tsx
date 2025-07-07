import { motion } from "framer-motion";
import { getScoreBadge } from "@/utils/scoreUtils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export const ScoreBadge = ({ score, className = "" }: ScoreBadgeProps) => {
  const scoreBadge = getScoreBadge(score);

  if (!scoreBadge) return null;

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.3,
      }}
    >
      <img
        src={scoreBadge}
        alt={`Score Badge ${score}`}
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
    </motion.div>
  );
};