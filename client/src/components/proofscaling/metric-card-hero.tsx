import { MetricCard } from "./metric-card";
import { TrendingUp, Target, Award } from "lucide-react";

export function MetricCardsHero() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
      <MetricCard
        icon={TrendingUp}
        value="89%"
        label="Success Rate"
      />
      <MetricCard
        icon={Target}
        value="4.2x"
        label="Time to Market"
      />
      <MetricCard
        icon={Award}
        value="+45"
        label="ProofScore"
      />
    </div>
  );
}