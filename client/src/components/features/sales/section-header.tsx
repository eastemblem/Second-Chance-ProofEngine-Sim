import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: boolean;
  delay?: number;
}

export function SectionHeader({
  title,
  subtitle,
  gradient = false,
  delay = 0,
}: SectionHeaderProps) {
  return (
    <motion.div
      className="text-center mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <h2
        className={`text-4xl md:text-5xl font-bold mb-6 ${
          gradient
            ? "bg-gradient-to-r from-blue-500 via-green-500 to-blue-600 bg-clip-text text-transparent"
            : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
