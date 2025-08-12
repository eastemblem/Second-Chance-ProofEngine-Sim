import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface BadgeWithIconProps {
  text: string;
  icon?: LucideIcon;
  variant?: "default" | "secondary" | "outline" | "gradient";
  delay?: number;
  className?: string;
}

export function BadgeWithIcon({ 
  text, 
  icon: Icon, 
  variant = "default",
  delay = 0,
  className = ""
}: BadgeWithIconProps) {
  const variantClasses = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border-border text-foreground",
    gradient: "bg-gradient-to-r from-primary-gold to-orange-500 text-white border-0"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
    >
      <Badge className={`px-6 py-2 text-sm font-medium backdrop-blur-sm ${variantClasses[variant]} ${className}`}>
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        {text}
      </Badge>
    </motion.div>
  );
}