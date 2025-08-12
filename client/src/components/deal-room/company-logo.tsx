import { motion } from "framer-motion";

interface CompanyLogoProps {
  name: string;
  delay?: number;
  className?: string;
}

export function CompanyLogo({ name, delay = 0, className = "" }: CompanyLogoProps) {
  return (
    <motion.div
      className={`flex items-center justify-center p-4 bg-card/50 rounded-lg border border-border hover:bg-card/80 transition-colors ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-sm font-semibold text-muted-foreground">{name}</span>
    </motion.div>
  );
}

interface CompanyLogoGridProps {
  companies: string[];
  className?: string;
  startDelay?: number;
}

export function CompanyLogoGrid({ companies, className = "", startDelay = 0 }: CompanyLogoGridProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 ${className}`}>
      {companies.map((company, index) => (
        <CompanyLogo
          key={company}
          name={company}
          delay={startDelay + index * 0.1}
        />
      ))}
    </div>
  );
}