export interface ProofTag {
  name: string;
  emoji: string;
  scoreThreshold: number;
  category: "desirability" | "feasibility" | "viability" | "traction" | "readiness";
}

export const ALL_PROOF_TAGS: ProofTag[] = [
  { name: "Problem Hunter", emoji: "🧠", scoreThreshold: 10, category: "desirability" },
  { name: "Target Locked", emoji: "🎯", scoreThreshold: 15, category: "desirability" },
  { name: "Signal Chaser", emoji: "🛁", scoreThreshold: 20, category: "desirability" },
  { name: "Prototype Pilot", emoji: "🛠", scoreThreshold: 25, category: "feasibility" },
  { name: "Solution Stamped", emoji: "✅", scoreThreshold: 30, category: "feasibility" },
  { name: "Builder's Blueprint", emoji: "🧱", scoreThreshold: 35, category: "feasibility" },
  { name: "Revenue Radar", emoji: "💰", scoreThreshold: 40, category: "viability" },
  { name: "Price Proven", emoji: "🧪", scoreThreshold: 45, category: "viability" },
  { name: "CAC Commander", emoji: "🎯", scoreThreshold: 50, category: "viability" },
  { name: "Traction Tracker", emoji: "📈", scoreThreshold: 55, category: "traction" },
  { name: "Channel Sniper", emoji: "🚀", scoreThreshold: 60, category: "traction" },
  { name: "Momentum Master", emoji: "⚡", scoreThreshold: 65, category: "traction" },
  { name: "Vault Ready", emoji: "📂", scoreThreshold: 70, category: "readiness" },
  { name: "Score Surged", emoji: "🔢", scoreThreshold: 75, category: "readiness" },
  { name: "Founder Fit Check", emoji: "🧠", scoreThreshold: 80, category: "readiness" },
  { name: "Metrics Ready", emoji: "📊", scoreThreshold: 82, category: "readiness" },
  { name: "Data Room Complete", emoji: "🗃️", scoreThreshold: 85, category: "desirability" },
  { name: "Vision Aligned", emoji: "🗺️", scoreThreshold: 87, category: "desirability" },
  { name: "Iteration Loop Active", emoji: "🔄", scoreThreshold: 90, category: "desirability" },
  { name: "Narrative Coherence", emoji: "🎤", scoreThreshold: 95, category: "desirability" },
  { name: "Moat Identified", emoji: "🔬", scoreThreshold: 98, category: "desirability" },
];

export const PROOF_TAG_ICONS: Record<string, string> = ALL_PROOF_TAGS.reduce(
  (acc, tag) => {
    acc[tag.name] = tag.emoji;
    return acc;
  },
  {} as Record<string, string>,
);

export const CATEGORY_COLORS = {
  desirability: "🟩 Desirability",
  feasibility: "🟦 Feasibility",
  viability: "🟧 Viability",
  traction: "🟨 Traction",
  readiness: "🟥 Readiness",
};