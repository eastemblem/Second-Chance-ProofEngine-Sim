import { MetricCard } from "../shared";
import VaultScoreDisplay from "./VaultScoreDisplay";

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
  validationData?: { proofScore: number; vaultScore?: number } | null;
}

export function VaultOverview({ proofVaultData, validationData }: VaultOverviewProps) {
  return (
    <>
      {/* VaultScore Display - Right aligned above cards */}
      <div className="flex justify-end mb-6">
        <VaultScoreDisplay vaultScore={validationData?.vaultScore || 0} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </>
  );
}