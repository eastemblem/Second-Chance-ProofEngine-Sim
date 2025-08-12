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
      className={`text-center group cursor-pointer ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ 
        scale: 1.08,
        y: -8,
        transition: { duration: 0.3 }
      }}
    >
      <div className="p-6 rounded-2xl bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm border border-border/50 hover:border-primary-gold/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary-gold/20">
        {Icon && (
          <motion.div
            className="mb-4"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className="w-10 h-10 text-primary-gold mx-auto group-hover:text-primary transition-colors" />
          </motion.div>
        )}
        <motion.div 
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-gold to-orange-500 bg-clip-text text-transparent mb-3"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          {value}
        </motion.div>
        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {label}
        </div>
        <div className="mt-2 h-1 w-full bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-gold to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: delay + 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}