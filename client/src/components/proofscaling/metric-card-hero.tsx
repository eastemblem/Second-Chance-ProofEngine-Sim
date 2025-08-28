import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Star } from "lucide-react";

interface MetricCardHeroProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay?: number;
  gradientColors?: string;
}

export function MetricCardHero({
  icon,
  value,
  label,
  delay = 0,
  gradientColors,
}: MetricCardHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="bg-card/30 backdrop-blur-sm rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-300 border-2 border-white/20"
    >
      <div className="flex items-center gap-3">
        {/* Icon with gradient background */}
        <div
          className={`p-2.5 rounded-lg ${gradientColors || "bg-gradient-to-br from-purple-500 to-orange-400"} flex items-center justify-center flex-shrink-0`}
        >
          <div className="text-white text-lg">{icon}</div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-foreground mb-0.5">
            {value}
          </div>
          <div className="text-muted-foreground text-sm font-medium">
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function MetricCardsHero() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
      <MetricCardHero
        icon={<Star size={20} />}
        value="1,200+"
        label="founders enrolled"
        delay={0.1}
        gradientColors="bg-gradient-to-br from-blue-500 to-green-400"
      />
      <MetricCardHero
        icon={<TrendingUp size={20} />}
        value="+22"
        label="Avg ProofScore lift"
        delay={0.2}
        gradientColors="bg-gradient-to-br from-green-500 to-blue-500"
      />
      <MetricCardHero
        icon={<DollarSign size={20} />}
        value="$68m"
        label="raised after completion"
        delay={0.3}
        gradientColors="bg-gradient-to-br from-blue-600 to-green-400"
      />
    </div>
  );
}
