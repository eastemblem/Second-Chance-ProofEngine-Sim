import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FolderOpen, ExternalLink } from "lucide-react";
import { VaultOverview } from "./VaultOverview";
import { VaultFileListing } from "./VaultFileListing";
import { VaultUploadArea } from "./VaultUploadArea";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

interface ProofVaultData {
  overviewCount: number;
  problemProofCount: number;
  solutionProofCount: number;
  demandProofCount: number;
  credibilityProofCount: number;
  commercialProofCount: number;
  investorPackCount: number;
  totalFiles: number;
  files: any[];
  folders?: any[];
  folderUrls?: Record<string, string>;
}

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

interface ProofVaultSectionProps {
  proofVaultData: ProofVaultData | null;
  paginatedFiles: FileItem[];
  totalFiles: number;
  filesLoading: boolean;
  filesLoadingMore: boolean;
  hasMoreFiles: boolean;
  onFilesScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  
  // Upload props
  selectedFolder: string;
  onFolderChange: (folderId: string) => void;
  uploadQueue: any[];
  currentUploadIndex: number;
  isUploading: boolean;
  isCreatingFolders: boolean;
  folderCreationStatus: string;
  onFileUpload: (files: File[], folderId: string) => Promise<void>;
  onFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRetryFailed: () => Promise<void>;
  onClearQueue: () => void;
  getFolderDisplayName: (folderId: string) => string;
  getAvailableFolders: () => Array<{ id: string; name: string; count: number }>;
}

export function ProofVaultSection({
  proofVaultData,
  paginatedFiles,
  totalFiles,
  filesLoading,
  filesLoadingMore,
  hasMoreFiles,
  onFilesScroll,
  selectedFolder,
  onFolderChange,
  uploadQueue,
  currentUploadIndex,
  isUploading,
  isCreatingFolders,
  folderCreationStatus,
  onFileUpload,
  onFolderUpload,
  onRetryFailed,
  onClearQueue,
  getFolderDisplayName,
  getAvailableFolders
}: ProofVaultSectionProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Handle viewing parent folder
  const handleViewParentFolder = () => {
    const parentFolderUrl = proofVaultData?.folderUrls?.['root'];
    if (parentFolderUrl) {
      trackEvent('folder_view', 'document_management', 'view_parent_folder');
      
      window.open(parentFolderUrl, '_blank');
      toast({
        title: "Opening Parent Folder",
        description: "Opening your main Proof Vault folder",
      });
    } else {
      toast({
        title: "Folder Not Available",
        description: "Parent folder hasn't been created yet.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-black/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FolderOpen className="w-5 h-5" />
          Your Proof Vault
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleViewParentFolder}
            className="ml-auto text-purple-400 hover:text-purple-300 hover:bg-gray-800"
            disabled={!proofVaultData?.folderUrls?.['root']}
            title="View parent folder in Proof Vault"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </CardTitle>
        <CardDescription className="text-gray-400">
          Manage and organize your validation documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="files" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Files</TabsTrigger>
            <TabsTrigger value="upload" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <VaultOverview proofVaultData={proofVaultData} />
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <VaultFileListing
              files={paginatedFiles}
              totalFiles={totalFiles}
              isLoading={filesLoading}
              isLoadingMore={filesLoadingMore}
              hasMore={hasMoreFiles}
              onScroll={onFilesScroll}
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <VaultUploadArea
              selectedFolder={selectedFolder}
              onFolderChange={onFolderChange}
              availableFolders={getAvailableFolders()}
              getFolderDisplayName={getFolderDisplayName}
              uploadQueue={uploadQueue}
              currentUploadIndex={currentUploadIndex}
              isUploading={isUploading}
              isCreatingFolders={isCreatingFolders}
              folderCreationStatus={folderCreationStatus}
              onFileUpload={onFileUpload}
              onFolderUpload={onFolderUpload}
              onRetryFailed={onRetryFailed}
              onClearQueue={onClearQueue}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}