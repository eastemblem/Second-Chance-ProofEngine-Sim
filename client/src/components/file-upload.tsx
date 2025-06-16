import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Check, FileText, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  label: string;
  description: string;
  accept?: string;
  required?: boolean;
  onFileSelect?: (file: File | null) => void;
  onUploadComplete?: (uploadResult: any) => void;
}

export default function FileUpload({ 
  label, 
  description, 
  accept = ".pdf,.ppt,.pptx", 
  required = false,
  onFileSelect,
  onUploadComplete
}: FileUploadProps) {
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      // Get session data for folder structure
      const sessionResponse = await fetch('/api/vault/session');
      const sessionData = await sessionResponse.json();

      if (!sessionData.success || !sessionData.data?.folderStructure) {
        throw new Error('No folder structure found. Please complete onboarding first.');
      }

      // Use 0_Overview folder ID for pitch deck uploads
      const overviewFolderId = sessionData.data.folderStructure.folders['0_Overview'];
      
      if (!overviewFolderId) {
        throw new Error('Overview folder not found in structure');
      }

      // Upload file to EastEmblem API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder_id', overviewFolderId);

      const uploadResponse = await fetch('/api/vault/upload-file', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Score the pitch deck
      const scoreFormData = new FormData();
      scoreFormData.append('file', file);

      const scoreResponse = await fetch('/api/vault/score-pitch-deck', {
        method: 'POST',
        body: scoreFormData,
      });

      const scoreResult = await scoreResponse.json();

      setUploaded(true);
      setUploading(false);

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded and analyzed`,
      });

      if (onFileSelect) {
        onFileSelect(file);
      }

      if (onUploadComplete) {
        onUploadComplete({
          upload: uploadResult,
          score: scoreResult
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <motion.div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
          uploaded 
            ? "border-primary bg-primary/10" 
            : uploading
            ? "border-yellow-500 bg-yellow-50"
            : "border-border hover:border-primary"
        }`}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {uploading ? (
          <div className="text-yellow-600">
            <Loader className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p className="font-medium">Uploading and analyzing...</p>
            <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
          </div>
        ) : uploaded ? (
          <div className="text-primary">
            <Check className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">File uploaded and analyzed!</p>
            <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
          </div>
        ) : (
          <div className="text-muted-foreground">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <p>
              Drag & drop your file here, or{" "}
              <span className="text-primary">browse files</span>
            </p>
            <p className="text-sm mt-1">{description}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
