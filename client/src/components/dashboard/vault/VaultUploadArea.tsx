import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, FolderPlus, Plus, Folder, AlertCircle, RefreshCw, X } from "lucide-react";

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
  onFileUpload: (files: File[], folderId: string) => Promise<void>;
  onFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRetryFailed: () => Promise<void>;
  onClearQueue: () => void;
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
  onClearQueue
}: VaultUploadAreaProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!isCreatingFolders && !isUploading) {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await onFileUpload(files, selectedFolder);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onFileUpload(Array.from(files), selectedFolder);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Folder Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Select Folder</label>
        <div className="flex gap-2">
          <Select value={selectedFolder} onValueChange={onFolderChange}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white flex-1">
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

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isCreatingFolders
            ? 'border-blue-500 bg-blue-500/5'
            : isUploading 
              ? 'border-purple-500 bg-purple-500/5' 
              : dragOver
                ? 'border-purple-400 bg-purple-500/10'
                : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isCreatingFolders && !isUploading) {
            setDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={handleDrop}
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
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-300 mb-2">Drag and drop files here or click to browse</p>
            <p className="text-gray-500 text-sm mb-4">
              Files will be uploaded to: <span className="text-purple-400 font-medium">{getFolderDisplayName(selectedFolder)}</span>
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.bmp,.png,.jpg,.jpeg,.gif,.tif,.tiff,.svg,.webp,.mp4,.mov,.avi,.webm,.3gp,.flv,.wmv,.mp3,.wav,.ogg,.aac,.m4a,.txt,.ods,.xltx,.csv,.xlsb,.xlsm,.xml,.eml,.mpp,.msg,.rtf,.odt,.ppsx,.vsd,.vsdx,.xps,.dwg,.dwf"
              className="hidden"
              id="file-upload"
              onChange={handleFileSelect}
            />
            <input
              type="file"
              multiple
              {...({ webkitdirectory: "" } as any)}
              className="hidden"
              id="folder-upload"
              onChange={onFolderUpload}
            />
            <div className="flex gap-2 flex-wrap justify-center">
              <Button 
                onClick={() => document.getElementById('file-upload')?.click()} 
                className="bg-gradient-to-r from-purple-500 to-yellow-500 text-white hover:from-purple-600 hover:to-yellow-600"
                disabled={isCreatingFolders || isUploading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
              <Button 
                onClick={() => document.getElementById('folder-upload')?.click()} 
                variant="outline"
                className="border-purple-400 text-purple-400 hover:bg-purple-500 hover:text-white"
                disabled={isCreatingFolders || isUploading}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                {isCreatingFolders ? 'Creating Folders...' : 'Upload Folder'}
              </Button>
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

      {/* Upload Guidelines */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-300">Upload Guidelines</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Supported formats: PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, MP4, MOV</li>
          <li>• Maximum file size: 10 MB per file</li>
          <li>• Select multiple files at once or drag & drop for batch upload</li>
          <li>• Files process sequentially to ensure reliable uploads</li>
          <li>• Upload high-quality documents to maximize your ProofScore</li>
          <li>• Folder upload: Organizes your files into the selected category folder</li>
          <li>• Failed uploads can be retried individually or cleared from the interface</li>
        </ul>
      </div>
    </div>
  );
}