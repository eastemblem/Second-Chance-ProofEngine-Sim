import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export function UrgencyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-6 py-3 mb-12"
    >
      <Clock size={18} className="text-orange-400" />
      <span className="text-orange-300 font-medium">
        Next cohort starts in 30 days - Limited spots available
      </span>
    </motion.div>
  );
}
