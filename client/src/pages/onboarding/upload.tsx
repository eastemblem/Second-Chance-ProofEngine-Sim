import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Upload file mutation
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
        onDataUpdate({ upload: data.upload });
        toast({
          title: "File Uploaded Successfully",
          description: "Your pitch deck has been uploaded and is ready for processing",
        });
        onNext();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      setUploadedFile(null);
      setUploadProgress(0);
    }
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or PowerPoint file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(uploadedFile);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <Upload className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Pitch Deck</h2>
        <p className="text-gray-600">
          Upload your pitch deck to get scored and receive detailed feedback
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pitch Deck Upload</CardTitle>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop your pitch deck here
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse files
              </p>
              <Button
                type="button"
                onClick={triggerFileInput}
                variant="outline"
                className="mx-auto"
              >
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-4">
                Supported formats: PDF, PPT, PPTX (max 10MB)
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-10 w-10 text-orange-600 mr-3" />
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {uploadedFile.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploadMutation.isPending && (
                  <Button
                    type="button"
                    onClick={removeFile}
                    variant="outline"
                    size="sm"
                  >
                    Remove
                  </Button>
                )}
              </div>

              {uploadMutation.isPending && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {uploadMutation.isSuccess && (
                <div className="mt-4 flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm">Upload successful!</span>
                </div>
              )}

              {uploadMutation.isError && (
                <div className="mt-4 flex items-center text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm">Upload failed. Please try again.</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Instructions */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Upload Guidelines</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-orange-600 mr-2">•</span>
              Upload your most recent pitch deck version
            </li>
            <li className="flex items-start">
              <span className="text-orange-600 mr-2">•</span>
              Ensure all slides are clear and readable
            </li>
            <li className="flex items-start">
              <span className="text-orange-600 mr-2">•</span>
              Include key sections: problem, solution, market, team, financials
            </li>
            <li className="flex items-start">
              <span className="text-orange-600 mr-2">•</span>
              Remove any confidential information you don't want analyzed
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          onClick={onPrev}
          variant="outline"
          className="px-8"
          disabled={uploadMutation.isPending}
        >
          Back
        </Button>

        <Button
          onClick={handleUpload}
          disabled={!uploadedFile || uploadMutation.isPending}
          className="px-8 py-2 bg-orange-600 hover:bg-orange-700"
        >
          {uploadMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            "Upload & Continue"
          )}
        </Button>
      </div>
    </motion.div>
  );
}