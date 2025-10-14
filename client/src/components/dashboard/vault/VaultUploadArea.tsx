import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, FolderPlus, Plus, Folder, AlertCircle, RefreshCw, X, Info } from "lucide-react";
import { PROOF_VAULT_ARTIFACTS, getArtifactsForStage } from "../../../../../shared/config/artifacts";
import { FileValidator } from "../../../../../shared/utils/fileValidation";
import { useUploadConsent } from "@/hooks/useUploadConsent";
import { UploadConsentModal } from "@/components/shared/UploadConsentModal";
import { useToast } from "@/hooks/use-toast";

interface VaultUploadAreaProps {
  selectedFolder: string;
  onFolderChange: (folderId: string) => void;
  availableFolders: Array<{ id: string; name: string; count: number }>;
  getFolderDisplayName: (folderId: string) => string;
  uploadQueue: Array<{
    file: File;
    folderId: string;
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }>;
  currentUploadIndex: number;
  isUploading: boolean;
  isCreatingFolders: boolean;
  folderCreationStatus: string;
  onFileUpload: (files: File[], folderId: string, artifactType?: string, description?: string, onSuccess?: () => void) => Promise<void>;
  onFolderUpload: (event: React.ChangeEvent<HTMLInputElement>, artifactType?: string, description?: string, onSuccess?: () => void) => Promise<void>;
  onRetryFailed: () => Promise<void>;
  onClearQueue: () => void;
  // NEW: Required fields for ProofVault enhancement
  selectedArtifact: string;
  onArtifactChange: (artifactId: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  validationErrors: string[];
  onClearValidation: () => void;
  growthStage?: string;
  // NEW: For artifact filtering
  uploadedArtifacts?: string[];
  isLoadingUploadedArtifacts?: boolean;
}

export function VaultUploadArea({
  selectedFolder,
  onFolderChange,
  availableFolders,
  getFolderDisplayName,
  uploadQueue,
  currentUploadIndex,
  isUploading,
  isCreatingFolders,
  folderCreationStatus,
  onFileUpload,
  onFolderUpload,
  onRetryFailed,
  onClearQueue,
  selectedArtifact,
  onArtifactChange,
  description,
  onDescriptionChange,
  validationErrors,
  onClearValidation,
  growthStage,
  uploadedArtifacts = [],
  isLoadingUploadedArtifacts = false
}: VaultUploadAreaProps) {
  const [dragOver, setDragOver] = useState(false);
  const [pendingUploadType, setPendingUploadType] = useState<'file' | 'folder' | null>(null);
  const [hasAttemptedUpload, setHasAttemptedUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { 
    showConsentModal, 
    consentConfirmed, 
    setConsentConfirmed, 
    requestConsent, 
    handleConsentConfirm, 
    handleConsentCancel 
  } = useUploadConsent();

  // Helper functions for artifact handling
  const getCurrentArtifact = () => {
    if (!selectedArtifact || !selectedFolder) return null;
    return (PROOF_VAULT_ARTIFACTS as any)[selectedFolder]?.artifacts[selectedArtifact];
  };

  const getArtifactsForFolder = (folderId: string) => {
    let artifacts = [];
    
    // If no growth stage provided, return all artifacts (fallback)
    if (!growthStage) {
      artifacts = FileValidator.getArtifactsForCategory(folderId);
    } else {
      // Get filtered artifacts based on growth stage
      const filteredConfig = getArtifactsForStage(growthStage as any);
      const category = filteredConfig[folderId];
      
      if (!category) {
        return [];
      }
      
      // Convert to FileValidator format with priority for sorting
      artifacts = Object.entries(category.artifacts).map(([artifactKey, artifact]) => ({
        id: artifactKey,
        name: artifact.name,
        description: artifact.description,
        required: artifact.mandatory || false,
        acceptedFormats: artifact.allowedFormats || ['.pdf', '.doc', '.docx'],
        maxSizeMB: Math.round(artifact.maxSizeBytes / (1024 * 1024)) || 10,
        score: artifact.score || 0,
        proofScoreContribution: artifact.proofScoreContribution || 0,
        priority: artifact.priority || 'low',
        mandatory: artifact.mandatory || false
      }));
    }
    
    // NEW: Filter out uploaded artifacts (Option 1 - hide completely)
    if (!isLoadingUploadedArtifacts && uploadedArtifacts.length > 0) {
      artifacts = artifacts.filter(artifact => !uploadedArtifacts.includes(artifact.id));
    }
    
    // NEW: Sort by priority (critical → high → medium → low)
    const priorityOrder: Record<string, number> = {
      'critical': 1,
      'high': 2,
      'medium': 3,
      'low': 4
    };
    
    artifacts.sort((a, b) => {
      const aPriority = priorityOrder[a.priority || 'low'] || 4;
      const bPriority = priorityOrder[b.priority || 'low'] || 4;
      return aPriority - bPriority;
    });
    
    return artifacts;
  };

  // Helper function to check if folder has no artifacts required
  const hasNoArtifactsRequired = (folderId: string) => {
    if (!growthStage) {
      const allArtifacts = FileValidator.getArtifactsForCategory(folderId);
      return allArtifacts.length === 0;
    }
    
    const filteredConfig = getArtifactsForStage(growthStage as any);
    const category = filteredConfig[folderId];
    
    return !category || !category.artifacts || Object.keys(category.artifacts).length === 0;
  };

  // Helper function to check if all artifacts are uploaded (not counting empty categories)
  const areAllArtifactsUploaded = (folderId: string) => {
    if (isLoadingUploadedArtifacts) return false;
    
    // First check if there are any artifacts required
    if (hasNoArtifactsRequired(folderId)) {
      return false; // Don't show "All uploaded" for folders with no artifacts
    }
    
    // Check if all artifacts are uploaded (no available artifacts left = all uploaded)
    const availableArtifacts = getArtifactsForFolder(folderId);
    return availableArtifacts.length === 0;
  };

  // Helper function to check if folder is complete (all uploaded or no artifacts required)
  const isFolderComplete = (folderId: string) => {
    return hasNoArtifactsRequired(folderId) || areAllArtifactsUploaded(folderId);
  };

  const validateRequirements = () => {
    const errors: string[] = [];
    
    if (!selectedArtifact) {
      errors.push("Please select a document type");
    }
    
    if (!description || description.trim().length < 1) {
      errors.push("Please provide a description");
    }
    
    if (description && description.length > 500) {
      errors.push("Description must be 500 characters or less");
    }
    
    return errors;
  };

  const canUpload = selectedArtifact && description && description.trim().length > 0 && description.length <= 500;

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!isCreatingFolders && !isUploading) {
      setHasAttemptedUpload(true);
      const errors = validateRequirements();
      if (errors.length > 0) {
        toast({
          title: "Upload Requirements Missing",
          description: errors.join(", "),
          variant: "destructive",
        });
        return;
      }
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        // Pass success callback to clear form after successful upload
        await onFileUpload(files, selectedFolder, selectedArtifact, description, () => {
          // Clear form fields on successful upload
          onArtifactChange("");
          onDescriptionChange("");
          onClearValidation();
          setHasAttemptedUpload(false);
        });
      }
    }
  };

  const showConsentDialog = (uploadType: 'file' | 'folder') => {
    setPendingUploadType(uploadType);
    requestConsent(() => {
      if (uploadType === 'file') {
        fileInputRef.current?.click();
      } else if (uploadType === 'folder') {
        folderInputRef.current?.click();
      }
      setPendingUploadType(null);
    });
  };

  // Handle folder upload with artifact metadata
  const handleFolderUploadWithMetadata = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setHasAttemptedUpload(true);
    await onFolderUpload(event, selectedArtifact, description, () => {
      // Clear form fields on successful upload
      onArtifactChange("");
      onDescriptionChange("");
      onClearValidation();
      setHasAttemptedUpload(false);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setHasAttemptedUpload(true);
      const errors = validateRequirements();
      if (errors.length > 0) {
        toast({
          title: "Upload Requirements Missing",
          description: errors.join(", "),
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      
      // Pass success callback to clear form after successful upload
      await onFileUpload(Array.from(files), selectedFolder, selectedArtifact, description, () => {
        // Clear form fields on successful upload
        onArtifactChange("");
        onDescriptionChange("");
        onClearValidation();
        setHasAttemptedUpload(false);
      });
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isCreatingFolders && !isUploading && canUpload) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-6">
      {/* Folder Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Select Folder</label>
        <div className="flex gap-2">
          <Select value={selectedFolder} onValueChange={onFolderChange} disabled={isUploading}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white flex-1" disabled={isUploading}>
              <SelectValue placeholder="Choose a folder...">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  {getFolderDisplayName(selectedFolder)} ({availableFolders.find(f => f.id === selectedFolder)?.count || 0} files)
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {availableFolders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id} className="text-white hover:bg-gray-700">
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {folder.name}
                    </span>
                    <span className="text-gray-400 text-sm">({folder.count} files)</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* NEW: REQUIRED Document Type Selector with Info Tooltip */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-300">
            Document Type <span className="text-red-400">*</span>
          </label>
          
          {/* Info Tooltip - Shows artifact description from config */}
          {selectedArtifact && getCurrentArtifact() && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-blue-400 hover:text-blue-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">{getCurrentArtifact()?.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* NEW: Show completion states based on actual upload status */}
        {hasNoArtifactsRequired(selectedFolder) ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-green-400 font-medium">
                  No Documents Required
                </h4>
                <p className="text-green-300 text-sm">
                  Folder complete - no artifacts required for your growth stage
                </p>
              </div>
            </div>
          </div>
        ) : areAllArtifactsUploaded(selectedFolder) ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-green-400 font-medium">
                  All Documents Uploaded
                </h4>
                <p className="text-green-300 text-sm">
                  All required artifacts for this folder have been uploaded
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Select value={selectedArtifact} onValueChange={onArtifactChange} required disabled={isUploading}>
              <SelectTrigger className={`bg-gray-800 border-gray-600 text-white ${
                hasAttemptedUpload && !selectedArtifact ? 'border-red-500' : ''
              }`} disabled={isUploading}>
                <SelectValue placeholder={
                  isLoadingUploadedArtifacts 
                    ? "Loading artifacts..." 
                    : getArtifactsForFolder(selectedFolder).length === 0 
                      ? "No artifacts available" 
                      : "Select document type (required)"
                } />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {getArtifactsForFolder(selectedFolder).map((artifact: any) => {
                  // Priority badge colors
                  const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
                    'critical': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'CRITICAL' },
                    'high': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'HIGH' },
                    'medium': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'MED' },
                    'low': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'LOW' }
                  };
                  
                  const priority = priorityColors[artifact.priority] || priorityColors['low'];
                  
                  return (
                    <SelectItem key={artifact.id} value={artifact.id} className="text-white hover:bg-gray-700">
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          {artifact.mandatory && (
                            <span className="text-red-400 text-xs font-bold" title="Required">*</span>
                          )}
                          <span className="flex-1">{artifact.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority.bg} ${priority.text}`}>
                            {priority.label}
                          </span>
                          <span className="text-green-400 text-sm">+{artifact.proofScoreContribution}pts</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {hasAttemptedUpload && !selectedArtifact && getArtifactsForFolder(selectedFolder).length > 0 && (
              <p className="text-red-400 text-xs">Please select a document type</p>
            )}
          </>
        )}
      </div>

      {/* NEW: REQUIRED Description Input */}
      {!isFolderComplete(selectedFolder) && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea 
            className={`w-full p-3 bg-gray-800 border rounded-lg text-white resize-none ${
              hasAttemptedUpload && (!description || description.length < 1) ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Describe what this document contains (required)..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            maxLength={500}
            rows={3}
            required
            disabled={isUploading || getArtifactsForFolder(selectedFolder).length === 0}
          />
          <div className="flex justify-between text-xs">
            <span className={hasAttemptedUpload && !description ? 'text-red-400' : 'text-gray-400'}>
              {hasAttemptedUpload && !description ? 'Description is required' : ''}
            </span>
            <span className="text-gray-400">{description.length}/500</span>
          </div>
        </div>
      )}

      {/* Upload Area with Validation */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${canUpload ? 'border-gray-600 hover:border-purple-500' : 'border-red-500'}
          ${dragOver && canUpload ? 'border-purple-500 bg-purple-500/10' : ''}
          ${!canUpload ? 'opacity-60' : ''}
          ${isCreatingFolders ? 'border-blue-500 bg-blue-500/5' : ''}
          ${isUploading ? 'border-purple-500 bg-purple-500/5' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isCreatingFolders ? (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
              <FolderPlus className="w-8 h-8 text-white animate-pulse" />
            </div>
            
            <div className="space-y-3">
              <p className="text-blue-400 font-medium">
                Creating Folder Structure...
              </p>
              
              {folderCreationStatus && (
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    {folderCreationStatus}
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isUploading ? (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center">
              <Upload className="w-8 h-8 text-white animate-pulse" />
            </div>
            
            <div className="space-y-3">
              <p className="text-purple-400 font-medium">
                Uploading {currentUploadIndex + 1} of {uploadQueue.length} files...
              </p>
              
              {uploadQueue[currentUploadIndex] && (
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    {uploadQueue[currentUploadIndex].file.name}
                  </p>
                  <Progress value={uploadQueue[currentUploadIndex].progress} className="h-2 bg-gray-700" />
                  <p className="text-gray-400 text-xs">{uploadQueue[currentUploadIndex].progress}% complete</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 max-w-xs mx-auto">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Completed: {uploadQueue.filter(item => item.status === 'completed').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>Failed: {uploadQueue.filter(item => item.status === 'failed').length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : isFolderComplete(selectedFolder) ? (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold text-green-400">
                {hasNoArtifactsRequired(selectedFolder) ? 'No Documents Required' : 'Folder Complete!'}
              </h3>
              <p className="text-gray-300 max-w-md mx-auto">
                {hasNoArtifactsRequired(selectedFolder) 
                  ? <>Folder complete - <span className="text-purple-400">{getFolderDisplayName(selectedFolder)}</span> has no required artifacts for your growth stage.</>
                  : <>All required documents for <span className="text-purple-400">{getFolderDisplayName(selectedFolder)}</span> have been uploaded successfully.</>
                }
              </p>
              <p className="text-sm text-gray-400">
                Switch to another folder to continue uploading additional documents.
              </p>
            </div>
          </div>
        ) : (
          <>
            <Upload className={`w-12 h-12 mx-auto mb-4 ${canUpload ? 'text-gray-400' : 'text-red-400'}`} />
            <p className="text-lg font-medium text-white mb-2">
              {canUpload ? 'Drag and drop files here or click to browse' : 'Complete requirements above to upload'}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Files will be uploaded to: <span className="text-purple-400">{getFolderDisplayName(selectedFolder)}</span>
            </p>
            
            {/* Upload Buttons - Conditional based on artifact fileFolder parameter */}
            <div className="flex gap-3 justify-center">
              {/* Show Choose Files button only for File or Both types */}
              {(!getCurrentArtifact()?.fileFolder || getCurrentArtifact()?.fileFolder === "File") && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept={getCurrentArtifact()?.allowedFormats.join(',') || '*'}
                    disabled={!canUpload}
                  />
                  
                  <Button 
                    onClick={() => showConsentDialog('file')}
                    disabled={!canUpload || isUploading}
                    className="bg-gradient-to-r from-purple-500 to-yellow-500 text-white hover:from-purple-600 hover:to-yellow-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {canUpload ? "Choose Files" : "Complete Requirements First"}
                  </Button>
                </>
              )}
              
              {/* Show Upload Folder button only for Folder or Both types */}
              {(!getCurrentArtifact()?.fileFolder || getCurrentArtifact()?.fileFolder === "Folder") && (
                <>
                  <input
                    type="file"
                    ref={folderInputRef}
                    onChange={handleFolderUploadWithMetadata}
                    className="hidden"
                    multiple
                    {...({ webkitdirectory: "" } as any)}
                    disabled={!canUpload}
                  />
                  
                  <Button 
                    onClick={() => showConsentDialog('folder')}
                    disabled={!canUpload || isUploading}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-700"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Upload Folder
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Failed Files Section */}
      {uploadQueue.some(item => item.status === 'failed') && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <h4 className="text-red-400 font-medium">Failed Uploads</h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearQueue}
              className="text-gray-400 hover:text-white h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {uploadQueue.filter(item => item.status === 'failed').map((item, index) => (
              <div key={index} className="text-sm bg-red-500/5 rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-300 font-medium">{item.file.name}</span>
                  <span className="text-gray-500 text-xs">({(item.file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
                {item.error && (
                  <p className="text-xs text-red-400">{item.error}</p>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onRetryFailed}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isUploading}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry Failed
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClearQueue}
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* NEW: Dynamic Upload Guidelines */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          Upload Guidelines
          {getCurrentArtifact() && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
              {getCurrentArtifact()!.name} (+{getCurrentArtifact()!.score}pts)
            </span>
          )}
        </h4>
        
        {getCurrentArtifact() ? (
          // Artifact-specific guidelines
          <div className="space-y-3">
            {/* Artifact description */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
              <p className="text-sm text-blue-300 mb-2">
                <strong>Document Type:</strong> {getCurrentArtifact()!.name}
              </p>
              <p className="text-xs text-blue-200">
                {getCurrentArtifact()!.description}
              </p>
            </div>
            
            {/* Specific requirements */}
            <ul className="text-xs text-gray-400 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>
                  <strong>Allowed formats:</strong> {getCurrentArtifact()!.allowedFormats.join(', ')}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>
                  <strong>Maximum size:</strong> {Math.round(getCurrentArtifact()!.maxSizeBytes / (1024 * 1024))}MB
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">⭐</span>
                <span>
                  <strong>ProofScore value:</strong> +{getCurrentArtifact()!.score} points
                </span>
              </li>
              {getCurrentArtifact()!.mandatory && (
                <li className="flex items-start gap-2">
                  <span className="text-red-400">!</span>
                  <span className="text-red-300">
                    <strong>Required document</strong> for this category
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Upload high-quality documents to maximize scoring potential</span>
              </li>
            </ul>
          </div>
        ) : (
          // General guidelines when no artifact selected
          <ul className="text-xs text-gray-400 space-y-1">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>
                <strong>General formats:</strong> PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, MP4, MOV
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>
                <strong>Typical size limit:</strong> 10-50 MB depending on document type
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Select a document type above to see specific requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Each document type has different scoring potential</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Files process sequentially to ensure reliable uploads</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Folder upload: Organizes your files into the selected category folder</span>
            </li>
          </ul>
        )}
      </div>

      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
          <h4 className="text-red-400 font-medium mb-2">Upload Requirements:</h4>
          <ul className="text-red-400 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Consent Modal */}
      <UploadConsentModal
        isOpen={showConsentModal}
        onConfirm={handleConsentConfirm}
        onCancel={handleConsentCancel}
        consentConfirmed={consentConfirmed}
        setConsentConfirmed={setConsentConfirmed}
      />
    </div>
  );
}