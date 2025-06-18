import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Upload, FileText, CheckCircle } from "lucide-react";

interface DocumentUploadProps {
  sessionId: string;
  onNext: () => void;
  onPrev: () => void;
  onDataUpdate: (data: any) => void;
}

export default function DocumentUpload({ 
  sessionId, 
  onNext, 
  onPrev,
  onDataUpdate 
}: DocumentUploadProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("pitchDeck", file);
      formData.append("sessionId", sessionId);

      const res = await fetch("/api/onboarding/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "Pitch deck uploaded successfully",
        });
        onDataUpdate({ upload: data.upload });
        onNext();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload pitch deck",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, PPT, or PPTX file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await uploadMutation.mutateAsync(selectedFile);
      setUploadProgress(100);
    } catch (error) {
      clearInterval(progressInterval);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Upload Your Pitch Deck
        </h2>
        <p className="text-muted-foreground">
          Upload your pitch deck to get a comprehensive analysis and ProofScore
        </p>
      </div>

      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-8">
          {!selectedFile ? (
            <div className="text-center">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Choose your pitch deck
              </h3>
              <p className="text-gray-600 mb-4">
                Supported formats: PDF, PPT, PPTX (max 10MB)
              </p>
              <input
                type="file"
                id="pitchDeck"
                accept=".pdf,.ppt,.pptx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById("pitchDeck")?.click()}
                className="px-6 py-2"
              >
                Select File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadProgress === 100 && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Upload complete!</span>
                </div>
              )}

              {!isUploading && uploadProgress === 0 && (
                <Button
                  onClick={handleUpload}
                  className="w-full"
                  size="lg"
                >
                  Upload Pitch Deck
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          Your pitch deck will be analyzed for structure, content quality, and investment readiness.
          We use industry-standard frameworks to provide actionable feedback.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="px-6 py-2"
          disabled={isUploading}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {selectedFile && !isUploading && uploadProgress === 0 && (
          <Button
            onClick={handleUpload}
            className="px-8 py-2"
          >
            Upload & Continue
          </Button>
        )}
      </div>
    </motion.div>
  );
}