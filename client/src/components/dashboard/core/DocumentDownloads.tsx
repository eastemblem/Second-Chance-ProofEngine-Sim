import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Award, FileText, Lock, CreditCard } from "lucide-react";

interface User {
  founderId: string;
  email: string;
  isAuthenticated: boolean;
  fullName?: string;
  venture?: {
    name: string;
    ventureId?: string;
    certificateUrl?: string;
    reportUrl?: string;
  };
}

interface ValidationData {
  proofScore: number;
  proofTagsUnlocked: number;
  totalProofTags: number;
  filesUploaded: number;
  status: string;
  certificateUrl?: string;
  reportUrl?: string;
}

interface DocumentDownloadsProps {
  user: User | null;
  validationData: ValidationData | null;
  onDownloadCertificate: () => void;
  onDownloadReport: () => void;
  hasDealRoomAccess?: boolean;
  onPaymentModalOpen?: () => void;
}

export function DocumentDownloads({ 
  user, 
  validationData, 
  onDownloadCertificate, 
  onDownloadReport,
  hasDealRoomAccess = false,
  onPaymentModalOpen
}: DocumentDownloadsProps) {
  const hasFiles = (user?.venture?.certificateUrl || validationData?.certificateUrl) && 
                   (user?.venture?.reportUrl || validationData?.reportUrl);
  const isDownloadEnabled = hasFiles && hasDealRoomAccess;
  
  return (
    <Card className="border-gray-800" style={{ backgroundColor: '#0E0E12' }}>
      <CardHeader>
        <CardTitle className="text-white text-3xl font-bold">
          {hasDealRoomAccess ? "Ready for Download" : "Downloads Available"}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {hasDealRoomAccess ? 
            "Access your validation certificate and analysis report" : 
            "Unlock your validation certificate and analysis report with Deal Room access"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Certificate Download */}
          <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/30 p-6 hover:border-purple-400/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">ProofScore Certificate</h3>
                  <p className="text-gray-400 text-sm">Official validation document</p>
                </div>
              </div>
              <Button 
                onClick={hasDealRoomAccess ? onDownloadCertificate : onPaymentModalOpen}
                className={`w-full ${hasDealRoomAccess 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-purple-600 hover:to-purple-700 text-white'} border-0 shadow-lg hover:shadow-purple-500/25 transition-all duration-300`}
                disabled={!hasFiles}
              >
                {hasDealRoomAccess ? (
                  <><Download className="w-4 h-4 mr-2" />Download Certificate</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" />Unlock Download - $99</>
                )}
              </Button>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  {!hasFiles ? 'Generating certificate...' :
                   hasDealRoomAccess ? 'Ready for download' : 'Payment required for download'}
                </p>
              </div>
            </div>
          </div>

          {/* Report Download */}
          <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-600/20 border border-yellow-500/30 p-6 hover:border-yellow-400/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <FileText className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Analysis Report</h3>
                  <p className="text-gray-400 text-sm">Detailed breakdown & insights</p>
                </div>
              </div>
              <Button 
                onClick={hasDealRoomAccess ? onDownloadReport : onPaymentModalOpen}
                className={`w-full ${hasDealRoomAccess 
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-yellow-600 hover:to-amber-700 text-white'} border-0 shadow-lg hover:shadow-yellow-500/25 transition-all duration-300`}
                disabled={!hasFiles}
              >
                {hasDealRoomAccess ? (
                  <><Download className="w-4 h-4 mr-2" />Download Report</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" />Unlock Download - $99</>
                )}
              </Button>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  {!hasFiles ? 'Generating report...' :
                   hasDealRoomAccess ? 'Ready for download' : 'Payment required for download'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}