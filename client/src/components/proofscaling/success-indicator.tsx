import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp } from "lucide-react";

interface SuccessIndicatorProps {
  metric: string;
  description: string;
  delay?: number;
}

export function SuccessIndicator({ metric, description, delay = 0 }: SuccessIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay }}
      className="flex items-center space-x-3 mb-4"
    >
      <motion.div
        className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
      >
        <CheckCircle2 className="w-5 h-5 text-green-500" />
      </motion.div>
      <div>
        <div className="text-lg font-bold text-primary-gold">{metric}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <TrendingUp className="w-5 h-5 text-green-500" />
      </motion.div>
    </motion.div>
  );
}