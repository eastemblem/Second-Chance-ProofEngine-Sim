import { motion } from "framer-motion";

interface CompanyLogoGridProps {
  companies: string[];
  delay?: number;
}

export function CompanyLogoGrid({
  companies,
  delay = 0,
}: CompanyLogoGridProps) {
  return (
    <motion.div
      className="flex flex-wrap justify-center items-center gap-8 opacity-60"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 0.6, y: 0 }}
      transition={{ duration: 0.8, delay }}
    >
      {companies.map((company, index) => (
        <motion.div
          key={company}
          className="text-muted-foreground font-semibold text-lg hover:text-blue-500 transition-colors cursor-default"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: delay + index * 0.1 }}
          whileHover={{ scale: 1.1 }}
        >
          {company}
        </motion.div>
      ))}
    </motion.div>
  );
}
