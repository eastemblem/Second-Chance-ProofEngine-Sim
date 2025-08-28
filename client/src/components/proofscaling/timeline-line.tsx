import { motion } from "framer-motion";

interface TimelineLineProps {
  totalSteps: number;
}

export function TimelineLine({ totalSteps }: TimelineLineProps) {
  return (
    <div
      className="absolute left-1/2 transform -translate-x-1/2 top-0 w-1 z-10"
      style={{ height: "100%" }}
    >
      {/* Animated line */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ duration: 2, delay: 0.5 }}
        className="w-full bg-gradient-to-b from-purple-500 via-blue-500 to-green-500 rounded-full relative"
      >
        {/* Timeline dots positioned to align with card centers */}
        {Array.from({ length: totalSteps }).map((_, index) => {
          // Position dots at the center of each card section
          const cardHeight = 200; // min-h-[200px] from TimelineCard
          const topOffset = cardHeight / 2 + index * cardHeight;

          return (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.2 }}
              className="absolute w-4 h-4 bg-white border-4 border-purple-500 rounded-full shadow-lg z-20"
              style={{
                top: `${topOffset}px`,
                left: "50%",
                transform: "translateX(-50%)",
                marginLeft: "-8px",
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
