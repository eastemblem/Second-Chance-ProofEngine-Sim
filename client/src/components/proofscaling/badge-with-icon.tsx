import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BadgeWithIconProps {
  icon: LucideIcon;
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  delay?: number;
  className?: string;
}

export function BadgeWithIcon({ 
  icon: Icon, 
  children, 
  variant = "default", 
  delay = 0,
  className = "" 
}: BadgeWithIconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05 }}
    >
      <Badge variant={variant} className={`inline-flex items-center gap-2 px-4 py-2 ${className}`}>
        <Icon className="w-4 h-4" />
        {children}
      </Badge>
    </motion.div>
  );
}