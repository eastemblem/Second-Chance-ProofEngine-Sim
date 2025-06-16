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
  onUploadComplete,
}: FileUploadProps) {
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
      // Simple file upload - store file without executing workflow
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/vault/upload-only", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "File upload failed");
      }

      setUploaded(true);

      toast({
        title: "File uploaded",
        description: `${file.name} ready for scoring`,
      });

      if (onFileSelect) {
        onFileSelect(file);
      }

      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploaded(false);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      // Ensure uploading state is always reset
      setUploading(false);
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
            <p className="font-medium">Uploading file ...</p>
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
