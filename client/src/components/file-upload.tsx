import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Check, FileText } from "lucide-react";

interface FileUploadProps {
  label: string;
  description: string;
  accept?: string;
  required?: boolean;
  onFileSelect?: (file: File | null) => void;
}

export default function FileUpload({ 
  label, 
  description, 
  accept = ".pdf,.ppt,.pptx", 
  required = false,
  onFileSelect 
}: FileUploadProps) {
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleClick = () => {
    // Simulate file upload
    const mockFiles = [
      "pitch-deck-v2.pdf (2.3 MB)",
      "business-plan.pdf (1.8 MB)",
      "financial-model.xlsx (956 KB)",
      "market-research.pdf (3.1 MB)"
    ];
    
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setFileName(randomFile);
    setUploaded(true);
    
    if (onFileSelect) {
      onFileSelect(new File([], randomFile));
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <motion.div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
          uploaded 
            ? "border-primary bg-primary/10" 
            : "border-border hover:border-primary"
        }`}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {uploaded ? (
          <div className="text-primary">
            <Check className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">File uploaded successfully!</p>
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
