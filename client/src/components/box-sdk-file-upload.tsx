import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertTriangle } from "lucide-react";

interface BoxSDKFileUploadProps {
  title: string;
  description: string;
  accept?: string;
  allowedTypes?: string[];
  userId?: string;
  category?: string;
  startupName?: string;
  disabled?: boolean;
  onFileUploaded?: (fileData: { id: string; name: string; category: string; sessionFolder?: string }) => void;
}

export default function BoxSDKFileUpload({ 
  title,
  description,
  accept = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx",
  allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'],
  userId,
  category,
  startupName,
  disabled = false,
  onFileUploaded
}: BoxSDKFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    if (!startupName) {
      setUploadError('Startup name is required');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');

      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && !allowedTypes.includes(fileExtension)) {
        throw new Error(`File type .${fileExtension} not allowed. Please upload: ${allowedTypes.join(', ')}`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('startupName', startupName);
      formData.append('category', category || 'document');
      if (userId) formData.append('userId', userId);

      const response = await fetch('/api/box/sdk/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadedFile(result.file);
      
      if (onFileUploaded) {
        onFileUploaded({
          id: result.file.id,
          name: result.file.name,
          category: category || 'document',
          sessionFolder: result.sessionFolder
        });
      }

    } catch (error) {
      console.error('Box SDK upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  if (uploadedFile) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">{uploadedFile.name}</p>
              <p className="text-sm text-green-600">Uploaded to Box successfully</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-colors ${
      isDragging ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled || isUploading ? 'pointer-events-none' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !isUploading && document.getElementById(`file-input-${category}`)?.click()}
        >
          <input
            id={`file-input-${category}`}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Uploading to Box SDK...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports: {allowedTypes.map(type => `.${type}`).join(', ')}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                disabled={disabled || isUploading}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById(`file-input-${category}`)?.click();
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          )}
        </div>

        {uploadError && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {uploadError}
            </AlertDescription>
          </Alert>
        )}

        {!startupName && (
          <Alert className="mt-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Please complete the startup information before uploading files.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}