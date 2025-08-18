import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface TimelineCardProps {
  week: number;
  title: string;
  description: string;
  icon: LucideIcon;
  isLeft: boolean;
  delay?: number;
  weekColor?: string;
}

export function TimelineCard({ 
  week, 
  title, 
  description, 
  icon: Icon, 
  isLeft, 
  delay = 0,
  weekColor = "bg-blue-500"
}: TimelineCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.3 }
      }}
      className={`flex items-center gap-8 mb-16 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Card */}
      <div className="flex-1 max-w-md">
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg hover:border-border/80 transition-all duration-300">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            {/* Content */}
            <div className="flex-1">
              {/* Week Badge */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-xs font-medium mb-3 ${weekColor}`}>
                Week {week}
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
        </div>
      </div>
    </motion.div>
  );
}