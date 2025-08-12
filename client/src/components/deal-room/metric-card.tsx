import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  value: string;
  label: string;
  icon?: LucideIcon;
  delay?: number;
  className?: string;
}

export function MetricCard({ 
  value, 
  label, 
  icon: Icon, 
  delay = 0,
  className = "" 
}: MetricCardProps) {
  return (
    <motion.div
      className={`text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05 }}
    >
      {Icon && (
        <Icon className="w-8 h-8 text-primary-gold mx-auto mb-3" />
      )}
      <div className="text-3xl md:text-4xl font-bold text-primary-gold mb-2">
        {value}
      </div>
      <div className="text-sm text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
}