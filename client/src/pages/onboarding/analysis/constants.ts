// ProofTag system constants and static data

export const ALL_PROOF_TAGS = [
  { name: "Problem Hunter", emoji: "🧠", scoreThreshold: 10, category: "desirability" },
  { name: "Target Locked", emoji: "🎯", scoreThreshold: 15, category: "desirability" },
  { name: "Signal Chaser", emoji: "🛁", scoreThreshold: 20, category: "desirability" },
  { name: "Prototype Pilot", emoji: "🛠", scoreThreshold: 25, category: "feasibility" },
  { name: "Solution Stamped", emoji: "⚡", scoreThreshold: 30, category: "feasibility" },
  { name: "Builder's Blueprint", emoji: "🏗️", scoreThreshold: 35, category: "feasibility" },
  { name: "Revenue Radar", emoji: "💰", scoreThreshold: 40, category: "viability" },
  { name: "Price Proven", emoji: "💎", scoreThreshold: 45, category: "viability" },
  { name: "CAC Commander", emoji: "📊", scoreThreshold: 50, category: "viability" },
  { name: "Traction Tracker", emoji: "📈", scoreThreshold: 55, category: "traction" },
  { name: "Channel Sniper", emoji: "🎪", scoreThreshold: 60, category: "traction" },
  { name: "Momentum Master", emoji: "🚀", scoreThreshold: 65, category: "traction" },
  { name: "Vault Ready", emoji: "🏛️", scoreThreshold: 70, category: "readiness" },
  { name: "Score Surged", emoji: "⭐", scoreThreshold: 75, category: "readiness" },
  { name: "Founder Fit Check", emoji: "👑", scoreThreshold: 80, category: "readiness" },
  { name: "Metrics Ready", emoji: "🔬", scoreThreshold: 82, category: "readiness" },
  { name: "Data Room Complete", emoji: "📁", scoreThreshold: 84, category: "readiness" },
  { name: "Vision Aligned", emoji: "🔮", scoreThreshold: 86, category: "readiness" },
  { name: "Iteration Loop Active", emoji: "🔄", scoreThreshold: 88, category: "readiness" },
  { name: "Narrative Coherence", emoji: "📖", scoreThreshold: 90, category: "readiness" },
  { name: "Moat Identified", emoji: "🏰", scoreThreshold: 95, category: "readiness" }
];

export const PROOF_TAG_ICONS = ALL_PROOF_TAGS.reduce(
  (acc, tag) => {
    acc[tag.name] = tag.emoji;
    return acc;
  },
  {} as Record<string, string>,
);

export const CATEGORY_TO_FIELDS_MAP: Record<string, string[]> = {
  desirability: ["Problem", "market_opportunity"],
  feasibility: ["solution", "product_technology"], 
  viability: ["business_model", "competition", "financials_projections_ask"],
  traction: ["traction_milestones", "go_to_market_strategy"],
  readiness: ["team"]
};

export const ALL_API_FIELDS = [
  "Problem", 
  "solution", 
  "market_opportunity", 
  "product_technology", 
  "team", 
  "business_model", 
  "traction_milestones", 
  "competition", 
  "go_to_market_strategy", 
  "financials_projections_ask"
];

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  desirability: "This ProofTag validates your startup's ability to solve real customer problems and create market demand.",
  feasibility: "This ProofTag confirms your technical capability to build and deliver your solution effectively.",
  viability: "This ProofTag demonstrates your ability to generate sustainable revenue and achieve profitability.",
  traction: "This ProofTag shows your success in acquiring customers and building measurable growth momentum.",
  readiness: "This ProofTag validates your preparedness to scale operations and attract investment."
};

export const DIMENSION_COLORS = {
  desirability: "bg-green-500",
  feasibility: "bg-blue-500",
  viability: "bg-orange-500",
  traction: "bg-purple-500",
  readiness: "bg-indigo-500",
};