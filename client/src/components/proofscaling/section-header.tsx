import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  titleGradient?: boolean;
  className?: string;
  textAlign?: "left" | "center";
}

export function SectionHeader({ 
  title, 
  subtitle, 
  titleGradient = false,
  className = "",
  textAlign = "center"
}: SectionHeaderProps) {
  const textAlignClass = textAlign === "center" ? "text-center" : "text-left";
  const titleClass = titleGradient 
    ? "bg-gradient-to-r from-primary via-primary-gold to-primary bg-clip-text text-transparent"
    : "text-foreground";

  return (
    <div className={`${textAlignClass} ${className}`}>
      <motion.h2 
        className={`text-4xl md:text-5xl font-bold mb-6 ${titleClass}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p 
          className="text-lg text-muted-foreground max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}