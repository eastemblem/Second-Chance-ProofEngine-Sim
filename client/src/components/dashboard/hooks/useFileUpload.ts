import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

interface User {
  founderId: string;
  email: string;
  isAuthenticated: boolean;
  fullName?: string;
  venture?: {
    name: string;
    ventureId?: string;
  };
}

interface UploadQueueItem {
  file: File;
  folderId: string;
  artifactType?: string;
  description?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export function useFileUpload(user: User | null, onUploadComplete?: (updatedVaultScore?: number) => void) {
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingFolders, setIsCreatingFolders] = useState(false);
  const [folderCreationStatus, setFolderCreationStatus] = useState<string>('');
  const { toast } = useToast();

  // Helper function to get folder display names
  const getFolderDisplayName = useCallback((folderId: string) => {
    const folderMap: Record<string, string> = {
      '0_Overview': 'Overview',
      '1_Problem_Proof': 'Problem Proofs',
      '2_Solution_Proof': 'Solution Proofs', 
      '3_Demand_Proof': 'Demand Proofs',
      '4_Credibility_Proof': 'Credibility Proofs',
      '5_Commercial_Proof': 'Commercial Proofs',
      '6_Investor_Pack': 'Investor Pack'
    };
    return folderMap[folderId] || folderId;
  }, []);

  // Get available folders for dropdown
  const getAvailableFolders = useCallback((proofVaultData: any) => [
    { id: '0_Overview', name: 'Overview', count: proofVaultData?.overviewCount || 0 },
    { id: '1_Problem_Proof', name: 'Problem Proofs', count: proofVaultData?.problemProofCount || 0 },
    { id: '2_Solution_Proof', name: 'Solution Proofs', count: proofVaultData?.solutionProofCount || 0 },
    { id: '3_Demand_Proof', name: 'Demand Proofs', count: proofVaultData?.demandProofCount || 0 },
    { id: '4_Credibility_Proof', name: 'Credibility Proofs', count: proofVaultData?.credibilityProofCount || 0 },
    { id: '5_Commercial_Proof', name: 'Commercial Proofs', count: proofVaultData?.commercialProofCount || 0 },
    { id: '6_Investor_Pack', name: 'Investor Pack', count: proofVaultData?.investorPackCount || 0 }
  ], []);

  // Create folder using EastEmblem API
  const createFolder = useCallback(async (folderName: string, parentFolderId: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('folderName', folderName);
      formData.append('folder_id', parentFolderId);
      
      // Add ventureId from user data for proof_vault mapping
      if (user?.venture?.ventureId) {
        formData.append('ventureId', user.venture.ventureId);
        console.log(`🔍 Creating folder with ventureId: ${user.venture.ventureId}`);
      } else {
        console.log(`⚠️ No ventureId available in user data:`, user);
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required for folder creation');
      }

      const response = await fetch('/api/v1/vault/create-folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const newFolderId = result.data?.folderId || result.folderId || result.data?.id || result.id;
        
        console.log('📁 Folder created successfully:', {
          folderName,
          parentFolderId,
          newFolderId,
          fullResult: result
        });
        
        if (!newFolderId) {
          throw new Error('Folder creation succeeded but no folder ID returned');
        }
        
        toast({
          title: "Folder Created",
          description: `Folder "${folderName}" created successfully with ID: ${newFolderId}`,
        });
        
        return newFolderId;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Folder creation failed');
      }
    } catch (error) {
      console.error('Folder creation error:', error);
      throw error;
    }
  }, [user, toast]);

  // Handle single file upload
  const handleSingleFileUpload = useCallback(async (
    queueItem: UploadQueueItem, 
    index: number, 
    isBatchUpload = false, 
    isLastInBatch = false
  ): Promise<{ success: boolean; responseData?: any; error?: string }> => {
    try {
      setUploadQueue(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'uploading', error: undefined } : item
      ));

      const formData = new FormData();
      formData.append('file', queueItem.file);
      formData.append('folder_id', queueItem.folderId);
      
      // Add ProofVault enhancement fields
      if (queueItem.artifactType) {
        formData.append('artifactType', queueItem.artifactType);
      }
      if (queueItem.description) {
        formData.append('description', queueItem.description);
      }
      
      // Add batch upload flags
      if (isBatchUpload) {
        formData.append('isBatchUpload', 'true');
        formData.append('isLastInBatch', isLastInBatch ? 'true' : 'false');
      }

      // Simulate upload progress for current file
      const progressInterval = setInterval(() => {
        setUploadQueue(prev => prev.map((item, i) => 
          i === index ? { ...item, progress: Math.min(item.progress + 15, 80) } : item
        ));
      }, 300);

      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Determine if this is a category upload or direct folder ID
      const isDirectFolderUpload = /^\d+$/.test(queueItem.folderId);
      const uploadEndpoint = isDirectFolderUpload ? '/api/v1/vault/upload-file-direct' : '/api/v1/vault/upload-file';

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      clearInterval(progressInterval);

      setUploadQueue(prev => prev.map((item, i) => 
        i === index ? { ...item, progress: 100 } : item
      ));

      if (response.ok) {
        const responseData = await response.json();
        
        setUploadQueue(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'completed', error: undefined } : item
        ));
        
        trackEvent('upload', 'proofvault', `file_upload_${queueItem.folderId}`);
        
        toast({
          title: "File Uploaded",
          description: `${queueItem.file.name} uploaded successfully to ${getFolderDisplayName(queueItem.folderId)}.`,
          variant: "success",
        });
        
        // Return response data including updated VaultScore
        return { success: true, responseData };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      // Better error logging to capture serialization issues
      console.error('File upload error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        statusText: (error as any)?.statusText,
        status: (error as any)?.status,
        response: (error as any)?.response,
        rawError: error
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setUploadQueue(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'failed', error: errorMessage } : item
      ));
      
      trackEvent('upload_failed', 'proofvault', `file_upload_error_${queueItem.folderId}`);
      
      return { success: false, error: errorMessage };
    }
  }, [getFolderDisplayName, toast]);

  // Handle multiple file uploads with queue processing
  // Standard 5-parameter signature to match VaultUploadArea expectations
  const handleMultipleFileUpload = useCallback(async (
    files: File[], 
    folderId: string, 
    artifactType?: string, 
    description?: string, 
    onSuccess?: () => void
  ) => {
    const isRetry = false; // For new uploads, always false
    const successCallback = onSuccess;
    const newQueue = Array.from(files).map(file => ({
      file,
      folderId,
      artifactType,
      description,
      status: 'pending' as const,
      progress: 0,
      error: undefined
    }));
    
    if (!isRetry) {
      setUploadQueue(newQueue);
    } else {
      setUploadQueue(prev => prev.map(item => 
        files.some(f => f.name === item.file.name) 
          ? { ...item, status: 'pending' as const, progress: 0, error: undefined }
          : item
      ));
    }
    
    setCurrentUploadIndex(0);
    setIsUploading(true);
    
    const uploadResults: Array<{file: File, status: 'completed' | 'failed', error?: string, responseData?: any}> = [];
    let latestVaultScore: number | undefined;
    
    // Process files sequentially with batch upload flags
    const isBatchUpload = newQueue.length > 1;
    for (let i = 0; i < newQueue.length; i++) {
      setCurrentUploadIndex(i);
      const isLastInBatch = isBatchUpload && (i === newQueue.length - 1);
      const result = await handleSingleFileUpload(newQueue[i], i, isBatchUpload, isLastInBatch);
      
      // Extract VaultScore from successful uploads (only the last one should have it for batch uploads)
      if (result.success && result.responseData?.data?.vaultScore !== undefined) {
        latestVaultScore = result.responseData.data.vaultScore;
      }
      
      uploadResults.push({
        file: newQueue[i].file,
        status: result.success ? 'completed' : 'failed',
        error: result.success ? undefined : (result.error || 'Upload failed'),
        responseData: result.success ? result.responseData : undefined
      });
    }
    
    const failedUploads = uploadResults.filter(result => result.status === 'failed');
    const successfulUploads = uploadResults.filter(result => result.status === 'completed');
    
    if (failedUploads.length > 0) {
      toast({
        title: "Some Uploads Failed",
        description: `${failedUploads.length} file(s) failed to upload. You can retry them below.`,
        variant: "destructive",
      });
    }
    
    // Show success message and trigger success callback if any files were uploaded successfully
    if (successfulUploads.length > 0) {
      toast({
        title: "Files Uploaded Successfully",
        description: `${successfulUploads.length} file(s) uploaded successfully.`,
      });
      
      // Call success callback to clear form
      if (successCallback) {
        successCallback();
      }
    }
    
    setIsUploading(false);
    setCurrentUploadIndex(0);
    
    // Call completion callback with updated VaultScore if available
    if (onUploadComplete) {
      onUploadComplete(latestVaultScore);
    }
  }, [handleSingleFileUpload, onUploadComplete, toast]);

  // Retry failed uploads
  const retryFailedUploads = useCallback(async () => {
    const failedFiles = uploadQueue.filter(item => item.status === 'failed');
    if (failedFiles.length === 0) return;
    
    // For retry, we don't need a success callback since it's internal
    await handleMultipleFileUpload(
      failedFiles.map(item => item.file), 
      failedFiles[0].folderId, 
      failedFiles[0].artifactType,
      failedFiles[0].description
    );
  }, [uploadQueue, handleMultipleFileUpload]);

  return {
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
  };
}