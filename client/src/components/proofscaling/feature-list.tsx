import { motion } from "framer-motion";
import { CheckCircle2, LucideIcon } from "lucide-react";

interface FeatureItemProps {
  text: string;
  icon?: LucideIcon;
  iconColor?: string;
  delay?: number;
}

export function FeatureItem({ 
  text, 
  icon: Icon = CheckCircle2, 
  iconColor = "text-green-500",
  delay = 0 
}: FeatureItemProps) {
  return (
    <motion.li 
      className="flex items-center space-x-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
      <span className="text-foreground">{text}</span>
    </motion.li>
  );
}

interface FeatureListProps {
  features: string[];
  className?: string;
  startDelay?: number;
  iconColor?: string;
  icon?: LucideIcon;
}

export function FeatureList({ 
  features, 
  className = "",
  startDelay = 0,
  iconColor = "text-green-500",
  icon
}: FeatureListProps) {
  return (
    <ul className={`space-y-4 ${className}`}>
      {features.map((feature, index) => (
        <FeatureItem
          key={index}
          text={feature}
          icon={icon}
          iconColor={iconColor}
          delay={startDelay + index * 0.05}
        />
      ))}
    </ul>
  );
}