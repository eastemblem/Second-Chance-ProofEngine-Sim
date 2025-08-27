import { MetricCard } from "../shared";

interface ProofVaultData {
  overviewCount: number;
  problemProofCount: number;
  solutionProofCount: number;
  demandProofCount: number;
  credibilityProofCount: number;
  commercialProofCount: number;
  investorPackCount: number;
}

interface VaultOverviewProps {
  proofVaultData: ProofVaultData | null;
}

// Custom folder card component for the new design
function FolderCard({ title, value, color }: { title: string; value: number; color: string }) {
  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: "bg-purple-900/40 border-purple-700/60 text-purple-100",
      blue: "bg-blue-900/40 border-blue-700/60 text-blue-100", 
      green: "bg-green-900/40 border-green-700/60 text-green-100",
      orange: "bg-orange-900/40 border-orange-700/60 text-orange-100",
      red: "bg-red-900/40 border-red-700/60 text-red-100",
      teal: "bg-teal-900/40 border-teal-700/60 text-teal-100",
      indigo: "bg-indigo-900/40 border-indigo-700/60 text-indigo-100"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.purple;
  };

  return (
    <div className={`rounded-xl border p-6 text-center transition-all duration-200 hover:scale-105 hover:shadow-lg ${getColorClasses(color)}`}>
      <div className="text-5xl font-bold mb-3">{value}</div>
      <div className="text-sm font-medium opacity-90">{title}</div>
    </div>
  );
}

export function VaultOverview({ proofVaultData }: VaultOverviewProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Top Row */}
      <FolderCard
        title="Overview"
        value={proofVaultData?.overviewCount || 3}
        color="purple"
      />
      <FolderCard
        title="Problem Proofs"
        value={proofVaultData?.problemProofCount || 0}
        color="blue"
      />
      <FolderCard
        title="Solution Proofs"
        value={proofVaultData?.solutionProofCount || 0}
        color="green"
      />
      
      {/* Bottom Row */}
      <FolderCard
        title="Demand Proofs"
        value={proofVaultData?.demandProofCount || 0}
        color="orange"
      />
      <FolderCard
        title="Credibility Proofs"
        value={proofVaultData?.credibilityProofCount || 0}
        color="red"
      />
      <FolderCard
        title="Commercial Proofs"
        value={proofVaultData?.commercialProofCount || 0}
        color="teal"
      />
      
      {/* Third Row for Investor Pack */}
      <FolderCard
        title="Investor Pack"
        value={proofVaultData?.investorPackCount || 0}
        color="indigo"
      />
    </div>
  );
}