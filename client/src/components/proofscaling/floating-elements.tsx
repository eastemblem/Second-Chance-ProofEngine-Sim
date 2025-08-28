import { motion } from "framer-motion";
import { Brain, BookOpen, TrendingUp, Target } from "lucide-react";

export function FloatingElements() {
  const elements = [
    { icon: Brain, delay: 0, x: "10%", y: "20%" },
    { icon: TrendingUp, delay: 0.5, x: "85%", y: "15%" },
    { icon: BookOpen, delay: 1, x: "15%", y: "80%" },
    { icon: Target, delay: 1.5, x: "90%", y: "75%" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element, index) => {
        const Icon = element.icon;
        return (
          <motion.div
            key={index}
            className="absolute"
            style={{ left: element.x, top: element.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 0.1,
              scale: 1,
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              opacity: { duration: 1, delay: element.delay },
              scale: { duration: 1, delay: element.delay },
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: element.delay,
              },
              rotate: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: element.delay,
              },
            }}
          >
            <Icon className="w-12 h-12 text-blue-500" />
          </motion.div>
        );
      })}
    </div>
  );
}
