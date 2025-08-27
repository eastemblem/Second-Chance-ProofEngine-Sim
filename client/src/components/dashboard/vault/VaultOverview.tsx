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

export function VaultOverview({ proofVaultData }: VaultOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* First Column */}
      <div className="space-y-4">
        <MetricCard
          title="Overview"
          value={proofVaultData?.overviewCount || 0}
          color="purple"
        />
        <MetricCard
          title="Problem Proofs"
          value={proofVaultData?.problemProofCount || 0}
          color="blue"
        />
        <MetricCard
          title="Solution Proofs"
          value={proofVaultData?.solutionProofCount || 0}
          color="green"
        />
        <MetricCard
          title="Demand Proofs"
          value={proofVaultData?.demandProofCount || 0}
          color="orange"
        />
      </div>
      
      {/* Second Column */}
      <div className="space-y-4">
        <MetricCard
          title="Credibility Proofs"
          value={proofVaultData?.credibilityProofCount || 0}
          color="red"
        />
        <MetricCard
          title="Commercial Proofs"
          value={proofVaultData?.commercialProofCount || 0}
          color="teal"
        />
        <MetricCard
          title="Investor Pack"
          value={proofVaultData?.investorPackCount || 0}
          color="indigo"
        />
      </div>
    </div>
  );
}