import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ValidationOverviewSectionProps {
  proofScore: number;
  completedCount: number;
  totalCount: number;
  status: string;
  onUploadClick: () => void;
}

export function ValidationOverviewSection({
  proofScore,
  completedCount,
  totalCount,
  status,
  onUploadClick
}: ValidationOverviewSectionProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 -mt-8 mb-8">
      <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">Validation Overview</h2>
            <div className="flex items-center gap-8 text-gray-300">
              <div>
                <p className="text-sm text-gray-400">Upload your ProofVault files to increase your ProofScore and access</p>
                <p className="text-sm text-gray-400">the Deal Room. Required +70 score to unlock access.</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Founders with complete uploads are 3x more likely to secure their first investor meeting.
            </p>
            <Button 
              onClick={onUploadClick}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-upload-files"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${totalCount > 0 ? (completedCount / totalCount) * 351.858 : 0} 351.858`}
                  className="text-purple-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{proofScore}</span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-white">ProofScore</p>
              <p className="text-xs text-gray-400">Status: {status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
