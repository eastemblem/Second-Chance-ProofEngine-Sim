import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardSimpleProps {
  title: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
  gradientFrom?: string;
  gradientTo?: string;
}

export function FeatureCardSimple({ 
  title, 
  description, 
  icon: Icon, 
  delay = 0,
  gradientFrom = "from-purple-500",
  gradientTo = "to-orange-400"
}: FeatureCardSimpleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.3 }
      }}
      className="text-center p-6 bg-card/50 backdrop-blur-sm border-2 border-white/20 rounded-xl hover:border-white/40 hover:shadow-lg transition-all duration-300"
    >
      {/* Icon */}
      <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-bold text-foreground mb-2">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}