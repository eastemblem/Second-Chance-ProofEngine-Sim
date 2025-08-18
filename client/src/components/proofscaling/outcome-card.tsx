import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface OutcomeCardProps {
  icon: LucideIcon;
  badge: string;
  title: string;
  description: string;
  delay?: number;
  gradientColor?: string;
}

export function OutcomeCard({ 
  icon: Icon, 
  badge, 
  title, 
  description, 
  delay = 0, 
  gradientColor = "from-blue-500 to-green-400" 
}: OutcomeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-lg bg-gradient-to-br ${gradientColor} flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium mb-3">
            {badge}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-foreground mb-2">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}