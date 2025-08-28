import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface AnimatedCounterProps {
  value: string;
  duration?: number;
  delay?: number;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 2, 
  delay = 0,
  className = ""
}: AnimatedCounterProps) {
  const count = useMotionValue(0);

  // Extract number from value string (e.g., "87%" -> 87, "$2.4M" -> 2.4)
  const numericValue = parseFloat(value.replace(/[^\d.]/g, '')) || 0;
  const suffix = value.replace(/[\d.]/g, '');

  const rounded = useTransform(count, (latest) => {
    if (value.includes('.')) {
      return latest.toFixed(1) + suffix;
    }
    return Math.round(latest) + suffix;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      animate(count, numericValue, { duration });
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [count, numericValue, duration, delay]);

  return (
    <motion.div className={className}>
      {rounded}
    </motion.div>
  );
}