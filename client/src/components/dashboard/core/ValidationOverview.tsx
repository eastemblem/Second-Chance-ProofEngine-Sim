import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, FileText, Award } from "lucide-react";
import { MetricCard } from "../shared";

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
}

export function ValidationOverview({ validationData, proofVaultData }: ValidationOverviewProps) {
  return (
    <Card className="bg-black/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Validation Overview</CardTitle>
        <CardDescription className="text-gray-400">
          Your current ProofScore and validation progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ProofScore Circle */}
          <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/30 p-6 hover:border-purple-400/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center shadow-lg">
                <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{validationData?.proofScore || 0}</span>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-1">ProofScore</h3>
              <p className="text-gray-400 text-sm">Current validation score</p>
            </div>
          </div>

          {/* ProofTags */}
          <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30 p-6 hover:border-blue-400/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative text-center">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20 mx-auto">
                  <Trophy className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-400 mb-2">{validationData?.proofTagsUnlocked || 0}</div>
              <h3 className="text-white font-semibold mb-1">ProofTags Unlocked</h3>
              <Progress value={((validationData?.proofTagsUnlocked || 0) / (validationData?.totalProofTags || 21)) * 100} className="h-2 mb-2" />
              <p className="text-gray-400 text-sm">of {validationData?.totalProofTags || 21} total</p>
            </div>
          </div>

          {/* Files Uploaded */}
          <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-600/20 border border-yellow-500/30 p-6 hover:border-yellow-400/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative text-center">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-yellow-500/20 mx-auto">
                  <FileText className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-400 mb-2">{validationData?.filesUploaded || proofVaultData?.totalFiles || 0}</div>
              <h3 className="text-white font-semibold mb-1">Files Uploaded</h3>
              <p className="text-gray-400 text-sm">Documents in Proof Vault</p>
            </div>
          </div>
        </div>

        {validationData?.status && (
          <div className="mt-6 group relative overflow-hidden rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-600/20 border border-green-500/30 p-6 hover:border-green-400/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-green-300 font-semibold text-sm mb-2">Excellent! You are {validationData.status}.</h4>
                <p className="text-gray-300 text-sm">
                  To access the Deal Room and Pass Due Diligence, please upload your Data Room into the Proof Vault.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}