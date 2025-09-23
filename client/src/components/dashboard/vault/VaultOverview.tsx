import { MetricCard } from "../shared";
import { Button } from "@/components/ui/button";
import { ExternalLink, Lock } from "lucide-react";

interface ProofVaultData {
  overviewCount: number;
  problemProofCount: number;
  solutionProofCount: number;
  demandProofCount: number;
  credibilityProofCount: number;
  commercialProofCount: number;
  investorPackCount: number;
  folderUrls?: Record<string, string>;
}

interface VaultOverviewProps {
  proofVaultData: ProofVaultData | null;
  hasDealRoomAccess?: boolean;
  onPaymentModalOpen?: () => void;
  priceDisplay?: string;
  onViewParentFolder?: () => void;
}

export function VaultOverview({ 
  proofVaultData, 
  hasDealRoomAccess = false,
  onPaymentModalOpen,
  priceDisplay = '$99 USD',
  onViewParentFolder
}: VaultOverviewProps) {
  return (
    <>
      {/* Access Box Folder Button - Right aligned above cards */}
      <div className="flex justify-end mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onViewParentFolder}
          className={`p-0 h-auto font-normal ${hasDealRoomAccess 
            ? 'text-purple-400 hover:text-purple-300 hover:bg-gray-800' 
            : 'text-gray-500 hover:text-purple-400 hover:bg-gray-800'}`}
          disabled={!hasDealRoomAccess && !onPaymentModalOpen}
          title={hasDealRoomAccess ? "View parent folder in Proof Vault" : "Payment required for Box folder access"}
        >
          {hasDealRoomAccess ? (
            <><ExternalLink className="w-4 h-4 mr-2" />Access Box Folder</>
          ) : (
            <><Lock className="w-4 h-4 mr-2" />Unlock Box Access - {priceDisplay}</>
          )}
        </Button>
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