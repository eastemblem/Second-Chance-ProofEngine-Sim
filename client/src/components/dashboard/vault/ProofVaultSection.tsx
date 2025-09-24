import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, Lock, CreditCard } from "lucide-react";
import { VaultOverview } from "./VaultOverview";
import { VaultFileListing } from "./VaultFileListing";
import { VaultUploadArea } from "./VaultUploadArea";
import VaultScoreDisplay from "./VaultScoreDisplay";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { useUploadedArtifacts } from "@/hooks/use-uploaded-artifacts";

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
  artifactType?: string;
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
  onFileUpload: (files: File[], folderId: string, artifactType?: string, description?: string, onSuccess?: () => void) => Promise<void>;
  onFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRetryFailed: () => Promise<void>;
  onClearQueue: () => void;
  getFolderDisplayName: (folderId: string) => string;
  getAvailableFolders: () => Array<{ id: string; name: string; count: number }>;
  
  // External tab control
  externalActiveTab?: string;
  onTabChange?: (tab: string) => void;
  
  // Payment gating
  hasDealRoomAccess?: boolean;
  onPaymentModalOpen?: () => void;
  validationData?: { proofScore: number; vaultScore?: number } | null;
  priceDisplay?: string;
  
  // Growth stage filtering
  growthStage?: string;
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
  getAvailableFolders,
  externalActiveTab,
  onTabChange,
  hasDealRoomAccess = false,
  onPaymentModalOpen,
  validationData,
  priceDisplay = '$99 USD',
  growthStage
}: ProofVaultSectionProps) {
  const [internalActiveTab, setInternalActiveTab] = useState("overview");
  
  // NEW: State management for ProofVault enhancement fields
  const [selectedArtifact, setSelectedArtifact] = useState("");
  const [description, setDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // NEW: Fetch uploaded artifacts for filtering
  const { data: uploadedArtifactsData, isLoading: uploadedArtifactsLoading } = useUploadedArtifacts();
  
  // Clear artifact and description when folder changes
  const handleFolderChange = (folderId: string) => {
    onFolderChange(folderId);
    setSelectedArtifact(""); // Reset artifact when folder changes
    setDescription(""); // Reset description when folder changes
    setValidationErrors([]); // Clear validation errors
  };
  
  const handleArtifactChange = (artifactId: string) => {
    setSelectedArtifact(artifactId);
    setValidationErrors([]); // Clear validation errors when artifact changes
  };
  
  const handleDescriptionChange = (desc: string) => {
    setDescription(desc);
    setValidationErrors([]); // Clear validation errors when description changes
  };
  
  const handleClearValidation = () => {
    setValidationErrors([]);
  };
  
  // Use external tab control if provided, otherwise use internal state
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  const { toast } = useToast();

  // Handle viewing parent folder
  const handleViewParentFolder = () => {
    // Check score requirement first
    const proofScore = validationData?.proofScore || 0;
    if (proofScore < 70) {
      toast({
        title: "Access Restricted",
        description: "You have to achieve more than 70 in order to access deal room",
        variant: "destructive",
      });
      return;
    }

    if (!hasDealRoomAccess) {
      if (onPaymentModalOpen) {
        trackEvent('payment', 'deal_room', 'box_access_payment_prompt');
        onPaymentModalOpen();
      }
      toast({
        title: "Payment Required",
        description: "Unlock Box folder access with Deal Room subscription",
        variant: "destructive",
      });
      return;
    }
    
    const parentFolderUrl = proofVaultData?.folderUrls?.['root'];
    if (parentFolderUrl) {
      trackEvent('folder_view', 'document_management', 'view_parent_folder');
      
      window.open(parentFolderUrl, '_blank');
      toast({
        title: "Opening Parent Folder",
        description: "Opening your main Proof Vault folder",
        variant: "success",
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
    <Card className="border-gray-800" style={{ backgroundColor: '#0E0E12' }}>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Title and Description */}
          <div className="lg:col-span-3">
            <div className="text-white mb-4">
              <h2 className="text-3xl font-bold">ProofVault Management</h2>
            </div>
            
            <p className="text-gray-400 text-base leading-relaxed mb-6">
              Manage and organise your validation documents here
            </p>

            {/* VaultScore Display */}
            <div className="mb-6">
              <VaultScoreDisplay vaultScore={validationData?.vaultScore || 0} />
            </div>


          </div>

          {/* Center Column: Tabs and Content */}
          <div className="lg:col-span-9">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Overview</TabsTrigger>
                <TabsTrigger value="files" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Files</TabsTrigger>
                <TabsTrigger value="upload" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <VaultOverview 
                  proofVaultData={proofVaultData} 
                  hasDealRoomAccess={hasDealRoomAccess}
                  onPaymentModalOpen={onPaymentModalOpen}
                  priceDisplay={priceDisplay}
                  onViewParentFolder={handleViewParentFolder}
                />
              </TabsContent>

              <TabsContent value="files" className="mt-6">
                <VaultFileListing
                  files={paginatedFiles}
                  totalFiles={totalFiles}
                  isLoading={filesLoading}
                  isLoadingMore={filesLoadingMore}
                  hasMore={hasMoreFiles}
                  onScroll={onFilesScroll}
                  hasDealRoomAccess={hasDealRoomAccess}
                  onPaymentModalOpen={onPaymentModalOpen}
                  validationData={validationData}
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-6">
                <VaultUploadArea
                  selectedFolder={selectedFolder}
                  onFolderChange={handleFolderChange}
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
                  selectedArtifact={selectedArtifact}
                  onArtifactChange={handleArtifactChange}
                  description={description}
                  onDescriptionChange={handleDescriptionChange}
                  validationErrors={validationErrors}
                  onClearValidation={handleClearValidation}
                  growthStage={growthStage}
                  uploadedArtifacts={uploadedArtifactsData?.data?.uploadedArtifacts || []}
                  isLoadingUploadedArtifacts={uploadedArtifactsLoading}
                />
              </TabsContent>
            </Tabs>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}