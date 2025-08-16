import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign } from "lucide-react";

interface MetricCardHeroProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay?: number;
}

export function MetricCardHero({ icon, value, label, delay = 0 }: MetricCardHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center hover:bg-white/15 transition-all duration-300"
    >
      <div className="flex justify-center mb-3 text-blue-400">
        {icon}
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {value}
      </div>
      <div className="text-sm text-blue-200">
        {label}
      </div>
    </motion.div>
  );
}

export function MetricCardsHero() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <MetricCardHero
        icon={<Users size={32} />}
        value="1,200+"
        label="founders enrolled"
        delay={0.1}
      />
      <MetricCardHero
        icon={<TrendingUp size={32} />}
        value="+22"
        label="Avg ProofScore lift"
        delay={0.2}
      />
      <MetricCardHero
        icon={<DollarSign size={32} />}
        value="$68m"
        label="raised after completion"
        delay={0.3}
      />
    </div>
  );
}