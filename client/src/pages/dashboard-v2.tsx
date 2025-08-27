import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { PaymentModal } from '@/components/ui/payment-modal';
import { usePaginatedActivities } from "@/hooks/use-paginated-activities";
import { usePaginatedFiles } from "@/hooks/use-paginated-files";
import { trackEvent } from "@/lib/analytics";
import Navbar from "@/components/navbar";
import { DashboardLayout } from "@/components/layout";
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading";

// Import all the extracted components
import {
  DashboardHeader,
  ValidationOverview,
  DealRoomSection,
  DocumentDownloads,
  ActivityFeed,
  LeaderboardPanel
} from "@/components/dashboard/core";
import { ProofVaultSection } from "@/components/dashboard/vault";
import {
  useDashboardData,
  useAuthentication,
  useDocumentDownloads,
  useFileUpload
} from "@/components/dashboard/hooks";

export default function DashboardV2Page() {
  const [, setLocation] = useLocation();
  const [selectedFolder, setSelectedFolder] = useState<string>("0_Overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("0_Overview");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [vaultActiveTab, setVaultActiveTab] = useState("overview");
  
  // Ref for scrolling to ProofVault section
  const proofVaultRef = useRef<HTMLDivElement>(null);

  // Use extracted hooks
  const { user, isLoading: authLoading, checkAuthStatus } = useAuthentication();
  const {
    validationData,
    proofVaultData,
    leaderboardData,
    hasDealRoomAccess,
    isLoading: dataLoading,
    loadDashboardData,
    setHasDealRoomAccess
  } = useDashboardData();

  // Document downloads
  const { handleDownloadCertificate, handleDownloadReport } = useDocumentDownloads(user, validationData);

  // Paginated data hooks
  const {
    activities: recentActivity,
    totalActivities,
    isLoading: isActivitiesLoading,
    loadMore,
    hasMore,
    isLoadingMore
  } = usePaginatedActivities();

  const { 
    files: paginatedFiles, 
    totalFiles, 
    isLoading: filesLoading, 
    isLoadingMore: filesLoadingMore, 
    loadMore: loadMoreFiles, 
    hasMore: hasMoreFiles 
  } = usePaginatedFiles();

  // File upload functionality
  const {
    uploadQueue,
    currentUploadIndex,
    isUploading,
    isCreatingFolders,
    folderCreationStatus,
    setUploadQueue,
    setIsCreatingFolders,
    setFolderCreationStatus,
    getFolderDisplayName,
    getAvailableFolders,
    createFolder,
    handleMultipleFileUpload,
    retryFailedUploads
  } = useFileUpload(user, () => loadDashboardData(true));

  // Initialize on mount
  useEffect(() => {
    checkAuthStatus();
    loadDashboardData();
  }, [checkAuthStatus, loadDashboardData]);

  // Handle scroll-based pagination for activities
  const handleActivityScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  // Handle scroll-based pagination for files
  const handleFilesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreFiles && !filesLoadingMore) {
      loadMoreFiles();
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setHasDealRoomAccess(true);
    trackEvent('payment', 'deal_room', 'payment_success');
  };

  // Handle payment modal open
  const handlePaymentModalOpen = () => {
    trackEvent('payment', 'deal_room', 'payment_modal_opened');
    setIsPaymentModalOpen(true);
  };

  // Handle folder uploads with precise workflow
  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    
    // Start folder creation loading state
    setIsCreatingFolders(true);
    setFolderCreationStatus('Analyzing folder structure...');
    
    try {
      // Analyze folder structure from file paths
      const folderStructure = analyzeFolderStructure(fileList);
      
      setFolderCreationStatus(`Found ${Object.keys(folderStructure.folders).length} folders with ${fileList.length} files. Organizing files...`);
      
      // Create main folder
      const mainFolderId = await createFolder(folderStructure.rootFolderName, selectedCategory);
      
      if (!mainFolderId) {
        throw new Error('Failed to create main folder');
      }

      // Create subfolders and upload files
      const folderIdMap = new Map<string, string>();
      folderIdMap.set('root', mainFolderId);

      // Create subfolders in order (parent folders first)
      const sortedFolderPaths = Object.keys(folderStructure.folders).sort((a, b) => {
        const depthA = a.split('/').length;
        const depthB = b.split('/').length;
        return depthA - depthB;
      });

      for (const folderPath of sortedFolderPaths) {
        if (folderPath === 'root') continue;

        const folderName = folderPath.split('/').pop() || folderPath;
        const parentPath = folderPath.includes('/') ? folderPath.substring(0, folderPath.lastIndexOf('/')) : 'root';
        const parentFolderId = folderIdMap.get(parentPath) || mainFolderId;

        try {
          const subFolderId = await createFolder(folderName, parentFolderId);
          if (subFolderId) {
            folderIdMap.set(folderPath, subFolderId);
          } else {
            folderIdMap.set(folderPath, parentFolderId);
          }
        } catch (error) {
          console.error(`Error creating subfolder "${folderPath}":`, error);
          folderIdMap.set(folderPath, parentFolderId);
        }
      }

      // End folder creation loading, start file upload loading
      setIsCreatingFolders(false);
      setFolderCreationStatus('');
      
      // Upload files to their respective folders
      for (const [folderPath, files] of Object.entries(folderStructure.folders)) {
        let targetFolderId = folderIdMap.get(folderPath) || mainFolderId;

        if (!folderIdMap.get(folderPath) && folderPath !== 'root') {
          targetFolderId = selectedCategory;
        }

        await handleMultipleFileUpload(files, targetFolderId);
      }

      // Force refresh after folder upload
      await loadDashboardData(true);
      
      // Reset input
      event.target.value = '';

    } catch (error) {
      console.error('Folder upload error:', error);
      
      // Reset loading states on error
      setIsCreatingFolders(false);
      setFolderCreationStatus('');
    }
    
    event.target.value = '';
  };

  // Analyze complete folder structure from uploaded files
  const analyzeFolderStructure = (files: File[]) => {
    const folders: Record<string, File[]> = {};
    let rootFolderName = 'uploaded-folder';
    
    // Extract root folder name from first file
    if (files.length > 0) {
      const firstFilePath = files[0].webkitRelativePath;
      if (firstFilePath) {
        rootFolderName = firstFilePath.split('/')[0];
      }
    }
    
    // Group files by their complete folder paths
    files.forEach(file => {
      const pathParts = file.webkitRelativePath?.split('/') || [];
      
      if (pathParts.length <= 2) {
        // File is in root folder
        if (!folders['root']) folders['root'] = [];
        folders['root'].push(file);
      } else {
        // File is in subfolder - preserve complete path structure
        const folderPath = pathParts.slice(1, -1).join('/');
        if (!folders[folderPath]) folders[folderPath] = [];
        folders[folderPath].push(file);
      }
    });
    
    return {
      rootFolderName,
      folders
    };
  };

  // Clear upload queue
  const handleClearQueue = () => {
    setUploadQueue([]);
  };

  // Handle scroll to ProofVault and open upload tab
  const handleScrollToVault = () => {
    setVaultActiveTab("upload");
    if (proofVaultRef.current) {
      proofVaultRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
    }
  };

  if (authLoading || dataLoading || !user) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <DashboardLayout>
      <Navbar showSignOut />
      
      {/* Header Section */}
      <DashboardHeader user={user} validationData={validationData} />

      {/* Main Dashboard Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full bg-black text-white">
        <div className="space-y-6">
          
          {/* Validation Overview */}
          <ValidationOverview 
            validationData={validationData} 
            proofVaultData={proofVaultData} 
            onScrollToVault={handleScrollToVault}
          />

          {/* Deal Room Section */}
          <DealRoomSection 
            validationData={validationData}
          />

          {/* Your Proof Vault */}
          <div ref={proofVaultRef}>
            <ProofVaultSection
              proofVaultData={proofVaultData}
              paginatedFiles={paginatedFiles}
              totalFiles={totalFiles}
              filesLoading={filesLoading}
              filesLoadingMore={filesLoadingMore}
              hasMoreFiles={hasMoreFiles}
              onFilesScroll={handleFilesScroll}
              selectedFolder={selectedFolder}
              onFolderChange={(value) => {
                setSelectedFolder(value);
                setSelectedCategory(value);
              }}
              uploadQueue={uploadQueue}
              currentUploadIndex={currentUploadIndex}
              isUploading={isUploading}
              isCreatingFolders={isCreatingFolders}
              folderCreationStatus={folderCreationStatus}
              onFileUpload={handleMultipleFileUpload}
              onFolderUpload={handleFolderUpload}
              onRetryFailed={retryFailedUploads}
              onClearQueue={handleClearQueue}
              getFolderDisplayName={getFolderDisplayName}
              getAvailableFolders={() => getAvailableFolders(proofVaultData)}
              externalActiveTab={vaultActiveTab}
              onTabChange={setVaultActiveTab}
            />
          </div>

          {/* Certificate & Report Downloads */}
          <DocumentDownloads
            user={user}
            validationData={validationData}
            onDownloadCertificate={handleDownloadCertificate}
            onDownloadReport={handleDownloadReport}
          />

          {/* Leaderboard */}
          <LeaderboardPanel leaderboardData={leaderboardData} />

          {/* Recent Activity */}
          <ActivityFeed
            activities={recentActivity}
            totalActivities={totalActivities}
            isLoading={isActivitiesLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
        </div>
      </div>
      
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        amount={99}
        currency="USD"
        description="Deal Room Access - Connect with verified investors"
        customerEmail={user?.email || ''}
        customerName={user?.fullName || ''}
        metadata={{
          purpose: 'Access Deal Room',
          founderId: user?.founderId || '',
          ventureId: user?.venture?.ventureId || ''
        }}
      />
    </DashboardLayout>
  );
}