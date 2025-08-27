import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ValidationData {
  proofScore: number;
  proofTagsUnlocked: number;
  totalProofTags: number;
  filesUploaded: number;
  status: string;
  certificateUrl?: string;
  reportUrl?: string;
}

interface ProofVaultData {
  totalFiles: number;
}

interface ValidationOverviewProps {
  validationData: ValidationData | null;
  proofVaultData: ProofVaultData | null;
  onScrollToVault?: () => void;
}

export function ValidationOverview({ validationData, proofVaultData, onScrollToVault }: ValidationOverviewProps) {
  const proofScore = validationData?.proofScore || 0;
  const isInvestorReady = proofScore >= 70;

  // Get status text based on score
  const getStatusText = () => {
    if (proofScore >= 85) return "Status: Investor Ready";
    if (proofScore >= 75) return "Status: Near Ready";
    if (proofScore >= 60) return "Status: Emerging Proof";
    if (proofScore >= 40) return "Status: Early Signals";
    return "Status: Building Validation";
  };

  // Get conditional text based on score
  const getPrimaryText = () => {
    if (proofScore >= 70) {
      return "Founders with complete ProofVault uploads are 3x more likely to secure their first investor meeting.";
    }
    return "Upload your ProofVault files to increase your ProofScore and access the Deal Room. Required +70 score to unlock access.";
  };

  const getSecondaryText = () => {
    if (proofScore >= 70) {
      return "Your ProofVault makes investor due diligence 50% faster.";
    }
    return "Founders with complete uploads are 3x more likely to secure their first investor meeting.";
  };

  // Calculate progress percentage for circular indicator
  const progressPercentage = Math.min(proofScore, 100);

  return (
    <div className="rounded-xl border border-gray-700/50 p-6" style={{ backgroundColor: '#0E0E12' }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Column: Title and Upload Button */}
        <div className="lg:col-span-3">
          <h2 className="text-3xl font-bold text-white mb-6">
            Validation
            <br />
            Overview
          </h2>
          
          <Button 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
            onClick={onScrollToVault}
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </Button>
        </div>

        {/* Center Column: Text Content */}
        <div className="lg:col-span-6 space-y-4">
          <p className="text-gray-300 text-lg font-bold leading-relaxed">
            {getPrimaryText()}
          </p>
          
          <p className="text-gray-400 text-sm leading-relaxed">
            {getSecondaryText()}
          </p>
        </div>

        {/* Right Column: ProofScore Circle */}
        <div className="lg:col-span-3 flex flex-col items-center">
          {/* Circular Progress Indicator */}
          <div className="relative w-32 h-32 mb-4">
            {/* Background Circle */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-700"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${progressPercentage * 2.51} 251`}
                className="transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
              {/* Gradient Definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center Score */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {proofScore}
              </span>
            </div>
          </div>

          {/* ProofScore Label */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-1">Proofscore</h3>
            <p className="text-sm text-gray-400">
              {getStatusText()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}