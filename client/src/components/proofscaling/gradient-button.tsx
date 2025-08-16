import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

export function GradientButton({
  children,
  onClick,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  size = "md",
  className = "",
  animate = true
}: GradientButtonProps) {
  const sizeClasses = {
    sm: "text-sm px-6 py-2",
    md: "text-base px-8 py-3",
    lg: "text-lg px-12 py-4",
    xl: "text-xl px-12 py-6"
  };

  const buttonContent = (
    <Button
      size="lg"
      className={`relative bg-gradient-to-r from-blue-500 via-green-500 to-blue-600 hover:from-blue-500/90 hover:via-green-500/90 hover:to-blue-600/90 text-white font-semibold h-auto rounded-full shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 overflow-hidden ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {/* Animated background shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out" />
      
      <div className="relative flex items-center justify-center">
        {LeftIcon && (
          <motion.div
            whileHover={{ x: -2 }}
            transition={{ duration: 0.2 }}
          >
            <LeftIcon className="w-5 h-5 mr-3" />
          </motion.div>
        )}
        {children}
        {RightIcon && (
          <motion.div
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <RightIcon className="w-5 h-5 ml-3" />
          </motion.div>
        )}
      </div>
    </Button>
  );

  if (!animate) return buttonContent;

  return (
    <motion.div
      whileHover={{ 
        scale: 1.05,
        y: -2,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      className="inline-block"
    >
      {buttonContent}
    </motion.div>
  );
}