import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface GradientButtonProps {
  children: ReactNode;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

export function GradientButton({ 
  children, 
  leftIcon: LeftIcon, 
  rightIcon: RightIcon,
  size = "lg",
  className = "",
  onClick,
  animate = true
}: GradientButtonProps) {
  const sizeClasses = {
    sm: "text-sm px-6 py-3",
    md: "text-base px-8 py-4", 
    lg: "text-lg px-12 py-4",
    xl: "text-xl px-12 py-6"
  };

  const buttonContent = (
    <Button
      size="lg"
      className={`bg-gradient-to-r from-primary via-primary-gold to-orange-500 hover:from-primary/90 hover:via-primary-gold/90 hover:to-orange-500/90 text-white font-semibold h-auto rounded-full shadow-lg ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {LeftIcon && <LeftIcon className="w-5 h-5 mr-3" />}
      {children}
      {RightIcon && <RightIcon className="w-5 h-5 ml-3" />}
    </Button>
  );

  if (!animate) return buttonContent;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {buttonContent}
    </motion.div>
  );
}