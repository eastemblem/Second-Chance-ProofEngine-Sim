import { motion } from "framer-motion";

interface TimelineLineProps {
  totalSteps: number;
}

export function TimelineLine({ totalSteps }: TimelineLineProps) {
  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 flex flex-col items-center">
      {/* Animated line */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ duration: 2, delay: 0.5 }}
        className="w-full bg-gradient-to-b from-purple-500 via-blue-500 to-green-500 rounded-full relative"
      >
        {/* Timeline dots */}
        {Array.from({ length: totalSteps }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8 + index * 0.2 }}
            className="absolute w-4 h-4 bg-white border-4 border-purple-500 rounded-full shadow-lg"
            style={{
              top: `${(index / (totalSteps - 1)) * 100}%`,
              left: "50%",
              transform: "translateX(-50%)"
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}