import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  animation?: "fadeUp" | "fadeIn" | "scale";
}

const animations = {
  fadeUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 }
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 }
  }
};

export function AnimatedSection({ 
  children, 
  delay = 0, 
  duration = 0.8, 
  className = "",
  animation = "fadeUp" 
}: AnimatedSectionProps) {
  const selectedAnimation = animations[animation];
  
  return (
    <motion.div
      initial={selectedAnimation.initial}
      animate={selectedAnimation.animate}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}