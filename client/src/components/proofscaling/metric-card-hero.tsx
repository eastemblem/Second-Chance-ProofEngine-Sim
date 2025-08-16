import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Star } from "lucide-react";

interface MetricCardHeroProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay?: number;
  gradientColors?: string;
}

export function MetricCardHero({ icon, value, label, delay = 0, gradientColors }: MetricCardHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="flex items-center gap-4">
        {/* Icon with gradient background */}
        <div className={`p-4 rounded-xl ${gradientColors || 'bg-gradient-to-br from-purple-500 to-orange-400'} flex items-center justify-center`}>
          <div className="text-white text-2xl">
            {icon}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-gray-500 bg-clip-text text-transparent mb-1">
            {value}
          </div>
          <div className="text-gray-500 text-lg font-medium">
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function MetricCardsHero() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <MetricCardHero
        icon={<Star size={24} />}
        value="1,200+"
        label="founders enrolled"
        delay={0.1}
        gradientColors="bg-gradient-to-br from-purple-500 to-orange-400"
      />
      <MetricCardHero
        icon={<TrendingUp size={24} />}
        value="+22"
        label="Avg ProofScore lift"
        delay={0.2}
        gradientColors="bg-gradient-to-br from-pink-500 to-purple-500"
      />
      <MetricCardHero
        icon={<DollarSign size={24} />}
        value="$68m"
        label="raised after completion"
        delay={0.3}
        gradientColors="bg-gradient-to-br from-green-500 to-blue-500"
      />
    </div>
  );
}