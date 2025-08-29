import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Lock } from "lucide-react";
import { FileIcon, LoadingSpinner, EmptyState, PaginationLoading, EndIndicator } from "../shared";
import { useToast } from "@/hooks/use-toast";

interface FileItem {
  id: string;
  name: string;
  category: string;
  categoryName?: string;
  uploadDate: string;
  size: string;
  downloadUrl: string;
  type?: string;
}

interface VaultFileListingProps {
  files: FileItem[];
  totalFiles: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  hasDealRoomAccess?: boolean;
  onPaymentModalOpen?: () => void;
  validationData?: { proofScore: number } | null;
}

// Format file size helper function
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Format time ago helper
function formatTimeAgo(timestamp: string) {
  const now = new Date();
  const fileTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - fileTime.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return fileTime.toLocaleDateString();
}

export function VaultFileListing({ 
  files, 
  totalFiles, 
  isLoading, 
  isLoadingMore, 
  hasMore, 
  onScroll,
  hasDealRoomAccess = false,
  onPaymentModalOpen,
  validationData
}: VaultFileListingProps) {
  const { toast } = useToast();

  // Check score and trigger payment/error flow
  const checkScoreAndTriggerPayment = () => {
    const proofScore = validationData?.proofScore || 0;
    if (proofScore < 70) {
      toast({
        title: "Access Restricted",
        description: "You have to achieve more than 70 in order to access deal room",
        variant: "destructive",
      });
      return;
    }
    onPaymentModalOpen?.();
  };
  // Get file category color based on categoryName
  const getCategoryColor = (categoryName: string) => {
    const categoryColors = {
      'Overview': 'gray',
      'Problem Proofs': 'blue',
      'Solution Proofs': 'green',
      'Demand Proofs': 'orange',
      'Credibility Proofs': 'red',
      'Commercial Proofs': 'teal',
      'Investor Pack': 'purple'
    };
    return categoryColors[categoryName as keyof typeof categoryColors] || 'gray';
  };

  const colorClasses = {
    gray: "text-gray-400 bg-gray-400/20 border-gray-400/30",
    blue: "text-blue-400 bg-blue-400/20 border-blue-400/30",
    green: "text-green-400 bg-green-400/20 border-green-400/30",
    orange: "text-orange-400 bg-orange-400/20 border-orange-400/30",
    red: "text-red-400 bg-red-400/20 border-red-400/30",
    teal: "text-teal-400 bg-teal-400/20 border-teal-400/30",
    purple: "text-purple-400 bg-purple-400/20 border-purple-400/30"
  };

  return (
    <div 
      className="space-y-3 max-h-80 overflow-y-auto"
      onScroll={onScroll}
    >
      {isLoading && files.length === 0 ? (
        <LoadingSpinner text="Loading files..." />
      ) : files.length > 0 ? (
        files.map((file) => {
          const categoryColor = getCategoryColor(file.categoryName || 'Overview');
          const colorClass = colorClasses[categoryColor as keyof typeof colorClasses] || colorClasses.gray;
          const timeAgo = formatTimeAgo(file.uploadDate);
          
          return (
            <div key={file.id} className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-800/30 to-gray-900/50 border border-gray-700/50 p-3 hover:border-gray-600/70 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start gap-3">
                <FileIcon fileName={file.name} mimeType={file.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
                          {file.categoryName || 'Overview'}
                        </span>
                        <span className="text-gray-500 text-xs">{file.size}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{timeAgo}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={hasDealRoomAccess ? () => window.open(file.downloadUrl, '_blank') : checkScoreAndTriggerPayment}
                        className={`h-8 w-8 p-0 ${hasDealRoomAccess ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-400'}`}
                        title={hasDealRoomAccess ? "Download file" : "Payment required for file download"}
                        disabled={!hasDealRoomAccess && !onPaymentModalOpen}
                      >
                        {hasDealRoomAccess ? <Download className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={hasDealRoomAccess ? () => window.open(file.downloadUrl, '_blank') : checkScoreAndTriggerPayment}
                        className={`h-8 w-8 p-0 ${hasDealRoomAccess ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-400'}`}
                        title={hasDealRoomAccess ? "View file" : "Payment required for file access"}
                        disabled={!hasDealRoomAccess && !onPaymentModalOpen}
                      >
                        {hasDealRoomAccess ? <ExternalLink className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <EmptyState
          title="No files yet"
          description="Upload your first document to get started"
        />
      )}
      
      {/* Loading indicator for pagination */}
      {isLoadingMore && (
        <PaginationLoading text="Loading more files..." />
      )}
      
      {/* End of files indicator */}
      {!hasMore && files && files.length > 0 && (
        <EndIndicator totalCount={totalFiles} itemName="files" />
      )}
    </div>
  );
}