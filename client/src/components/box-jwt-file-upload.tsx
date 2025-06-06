import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BoxJWTFileUploadProps {
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

export default function BoxJWTFileUpload({ 
  title, 
  description, 
  accept = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx",
  allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  userId,
  category = "document",
  startupName,
  disabled = false,
  onFileUploaded
}: BoxJWTFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadedFileData, setUploadedFileData] = useState<any>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `Please select a valid file type: ${allowedTypes.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !startupName) {
      toast({
        title: "Missing information",
        description: "Please complete the form and select a file before uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('startupName', startupName);
      formData.append('category', category);
      if (userId) formData.append('userId', userId);

      console.log('Uploading file via Box JWT service...');
      
      const response = await fetch('/api/box/jwt/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Upload failed');
      }

      console.log('Box JWT upload successful:', result);
      
      setUploadStatus('success');
      setUploadedFileData(result);
      
      toast({
        title: "Upload successful",
        description: `${selectedFile.name} has been uploaded to Box.com`,
      });

      // Notify parent component
      if (onFileUploaded) {
        onFileUploaded({
          id: result.file.id,
          name: result.file.name,
          category: category,
          sessionFolder: result.sessionFolder
        });
      }

    } catch (error) {
      console.error('Box JWT upload failed:', error);
      setUploadStatus('error');
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload file to Box.com',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <Card className={`transition-all ${getStatusColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="file"
            id={`file-upload-${category}`}
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
          />
          <label
            htmlFor={`file-upload-${category}`}
            className={`flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              disabled || isUploading
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
            }`}
          >
            <Upload className="h-5 w-5" />
            <span>
              {selectedFile ? selectedFile.name : 'Choose file'}
            </span>
          </label>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            
            <Button
              onClick={handleUpload}
              disabled={disabled || isUploading || uploadStatus === 'success'}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : uploadStatus === 'success' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Uploaded
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload to Box
                </>
              )}
            </Button>
          </div>
        )}

        {uploadStatus === 'success' && uploadedFileData && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">File uploaded successfully</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Stored in Box.com with automatic shareable link generation
            </p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Upload failed</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Please try again or contact support if the issue persists
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}