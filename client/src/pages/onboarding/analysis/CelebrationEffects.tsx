import { motion } from "framer-motion";
import type { CelebrationState } from './types';

interface CelebrationEffectsProps {
  celebration: CelebrationState;
}

export default function CelebrationEffects({ celebration }: CelebrationEffectsProps) {
  if (!celebration.showCelebration) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
    >
      {/* Confetti particles */}
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            rotate: 0,
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: 360,
            x: Math.random() * window.innerWidth,
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            ease: "linear",
            delay: Math.random() * 2,
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: [
              "#8B5CF6", // Purple
              "#F59E0B", // Gold
              "#10B981", // Green
              "#3B82F6", // Blue
              "#F97316", // Orange
            ][Math.floor(Math.random() * 5)],
          }}
        />
      ))}
    </motion.div>
  );
}