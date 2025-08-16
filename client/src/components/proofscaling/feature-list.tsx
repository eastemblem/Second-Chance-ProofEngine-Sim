import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeatureListProps {
  features: Feature[];
  columns?: number;
  delay?: number;
}

export function FeatureList({ features, columns = 3, delay = 0 }: FeatureListProps) {
  const gridClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4"
  }[columns] || "md:grid-cols-3";

  return (
    <div className={`grid ${gridClass} gap-8`}>
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: delay + index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group"
          >
            <Card className="p-6 h-full bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm border border-border/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              <motion.div
                className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Icon className="w-6 h-6 text-blue-500" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-blue-500 transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}