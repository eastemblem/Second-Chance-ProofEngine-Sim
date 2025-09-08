import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle, Clock, Loader, Folder, FileText, Target, Upload, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/progress-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SessionResponse {
  success: boolean;
  sessionId: string;
  data: {
    folderStructure?: any;
    uploadedFile?: {
      filepath: string;
      originalname: string;
      mimetype: string;
      size: number;
    };
    uploadedFiles?: any[];
    pitchDeckScore?: any;
    startupName?: string;
    founderData?: {
      fullName?: string;
      email?: string;
      startupName?: string;
      stage?: string;
      acceleratorApplications?: number;
      founderId?: string;
      ventureId?: string;
      [key: string]: any;
    };
  };
}

interface ScoringPageProps {
  onNext: () => void;
  analysisProgress: number;
  isAnalyzing: boolean;
}

const proofVaultSteps = [
  {
    title: "Checking ProofVault Status",
    description: "Verifying folder structure creation"
  },
  {
    title: "Analyzing Document Framework",
    description: "Reviewing proof organization structure"
  },
  {
    title: "Calculating Readiness Score",
    description: "Assessing investment preparation level"
  },
  {
    title: "Generating Proof Insights",
    description: "Creating personalized recommendations"
  },
  {
    title: "Finalizing ProofScore",
    description: "Completing comprehensive analysis"
  }
];

export default function ScoringPage({ 
  onNext, 
  analysisProgress, 
  isAnalyzing 
}: ScoringPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [proofScore, setProofScore] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();


  // Reset validation state when starting new upload
  const resetValidationState = () => {
    setValidationError(null);
    setShowFileUpload(false);
    setProofScore(null);
    setSelectedFile(null);
    setUploading(false);
  };

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("/api/v1/vault/upload-only", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("📁 File upload successful, triggering new scoring:", {
        timestamp: new Date().toISOString(),
        fileName: selectedFile?.name,
        retryCount
      });

      toast({
        title: "File Uploaded",
        description: "Starting analysis of your new file...",
      });

      // Reset upload state
      setUploading(false);
      setShowFileUpload(false);
      setValidationError(null);

      // Trigger new scoring
      submitForScoring.mutate();
    },
    onError: (error) => {
      setUploading(false);
      console.error("❌ File upload failed:", {
        timestamp: new Date().toISOString(),
        error,
        retryCount
      });

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log("📄 File selected for retry:", {
        timestamp: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size,
        retryCount
      });
    }
  };

  // Handle retry file upload
  const handleRetryUpload = () => {
    if (selectedFile) {
      setUploading(true);
      uploadFileMutation.mutate(selectedFile);
    } else {
      fileInputRef.current?.click();
    }
  };

  // Handle reaching max retries
  const handleMaxRetriesReached = () => {
    setValidationError("Maximum retry attempts reached. Please contact support if you continue having issues.");
    toast({
      title: "Maximum Retries Reached",
      description: "Please contact support for assistance with your document.",
      variant: "destructive"
    });
  };

  // Query ProofVault session data
  const { data: sessionData } = useQuery<SessionResponse>({
    queryKey: ['/api/v1/vault/session'],
    refetchInterval: isAnalyzing ? 2000 : false,
  });

  // Submit for scoring mutation
  const submitForScoring = useMutation({
    mutationFn: async () => {
      // Get JWT token for authentication
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/v1/vault/submit-for-scoring', {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error('Scoring failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("✅ Scoring API success:", {
        timestamp: new Date().toISOString(),
        data,
        retryCount
      });

      // Backend now handles validation - proceed with success flow
      const score = data.data?.proofScore || data.proofScore || 0;
      setProofScore(score);
      queryClient.invalidateQueries({ queryKey: ['/api/v1/vault/session'] });
      
      console.log("✅ Scoring completed successfully:", {
        timestamp: new Date().toISOString(),
        score,
        retryCount
      });

      toast({
        title: "Scoring Complete",
        description: "Your pitch deck has been analyzed successfully"
      });
    },
    onError: (error: any) => {
      console.error("❌ Scoring API error:", {
        timestamp: new Date().toISOString(),
        error,
        retryCount
      });

      // Check if this is a backend validation error
      const errorMessage = error?.response?.data?.error?.message || error?.message || "Please try again";
      const isValidationError = errorMessage.includes("Analysis failed: We couldn't find");

      if (isValidationError) {
        // Handle backend validation error with retry logic
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        if (newRetryCount >= maxRetries) {
          handleMaxRetriesReached();
          return;
        }

        setValidationError(errorMessage);
        setShowFileUpload(true);
        
        console.warn("❌ Backend validation failed - triggering retry:", {
          timestamp: new Date().toISOString(),
          retryCount: newRetryCount,
          errorMessage,
          maxRetries
        });

        toast({
          title: "File Analysis Failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        return;
      }

      // Handle other errors normally
      toast({
        title: "Scoring Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // useEffect(() => {
  //   onStartAnalysis();
  // }, [onStartAnalysis]);

  useEffect(() => {
    setCurrentStep(Math.floor((analysisProgress / 100) * proofVaultSteps.length));
  }, [analysisProgress]);

  useEffect(() => {
    // Only proceed to next step if analysis is complete AND successful (no errors)
    if (analysisProgress >= 100 && !isAnalyzing && !submitForScoring.isError) {
      const timer = setTimeout(() => {
        onNext();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [analysisProgress, isAnalyzing, onNext, submitForScoring.isError]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProgressBar currentStep={2} totalSteps={4} stepName="AI Analysis" />

          <Card className="p-12 border-border bg-card">
            <div className="mb-8">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ 
                  scale: submitForScoring.isPending ? [1, 1.1, 1] : 1,
                  rotate: submitForScoring.isPending ? [0, 5, -5, 0] : 0
                }}
                transition={{ 
                  duration: 2,
                  repeat: submitForScoring.isPending ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                {proofScore !== null ? (
                  <Target className="text-white text-2xl w-8 h-8" />
                ) : (
                  <Brain className="text-white text-2xl w-8 h-8" />
                )}
              </motion.div>
              
              {proofScore !== null ? (
                <>
                  <h2 className="text-3xl font-bold mb-4">ProofScore: {proofScore}</h2>
                  <p className="text-muted-foreground mb-8">
                    Your pitch deck has been analyzed and scored successfully
                  </p>
                </>
              ) : validationError ? (
                <>
                  <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="text-white text-2xl w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-red-600">File Analysis Failed</h2>
                  <p className="text-muted-foreground mb-8">
                    {validationError}
                  </p>
                  {retryCount < maxRetries && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                        Attempt {retryCount} of {maxRetries}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold mb-4">Ready for Analysis</h2>
                  <p className="text-muted-foreground mb-8">
                    Submit your uploaded pitch deck for comprehensive AI evaluation across 5 key validation dimensions
                  </p>
                </>
              )}
            </div>

            {/* Submit for Scoring, Show Analysis Progress, or Show File Upload for Retry */}
            {validationError && showFileUpload ? (
              <div className="mb-8">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  
                  {selectedFile ? (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Selected file:</p>
                      <p className="text-sm text-muted-foreground mb-4">{selectedFile.name}</p>
                      <Button
                        onClick={handleRetryUpload}
                        disabled={uploading}
                        className="w-full bg-gradient-to-r from-primary to-primary-gold hover:from-primary/90 hover:to-primary-gold/90 text-white font-semibold py-3 px-6 rounded-lg"
                      >
                        {uploading ? (
                          <>
                            <Loader className="mr-2 w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 w-4 h-4" />
                            Upload New File
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <p className="text-lg font-medium mb-2">Upload a new file</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Choose a different document that contains venture and team details
                      </p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gradient-to-r from-primary to-primary-gold hover:from-primary/90 hover:to-primary-gold/90 text-white font-semibold py-3 px-6 rounded-lg"
                      >
                        <Upload className="mr-2 w-4 h-4" />
                        Choose File
                      </Button>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported formats: PDF, PPT, PPTX, DOC, DOCX
                  </p>
                </div>
              </div>
            ) : proofScore === null && !submitForScoring.isPending ? (
              <div className="mb-8">
                {sessionData?.data?.founderData?.startupName && (
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-center text-primary">
                      <Target className="inline mr-2 w-4 h-4" />
                      Analyzing pitch deck for: <strong>{sessionData.data.founderData.startupName}</strong>
                    </p>
                  </div>
                )}
                <Button 
                  onClick={() => submitForScoring.mutate()}
                  className="w-full bg-gradient-to-r from-primary to-primary-gold hover:from-primary/90 hover:to-primary-gold/90 text-white font-semibold py-4 px-8 rounded-lg text-lg"
                  disabled={!sessionData?.success || !sessionData?.data?.uploadedFile}
                >
                  <Brain className="mr-2 w-5 h-5" />
                  Submit for Scoring
                </Button>
                {(!sessionData?.success || !sessionData?.data?.uploadedFile) && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Please upload a pitch deck first
                  </p>
                )}
              </div>
            ) : submitForScoring.isPending ? (
              <div className="space-y-4 mb-8">
                {proofVaultSteps.map((step, index) => {
                  const isCompleted = index < Math.floor((submitForScoring.isPending ? 60 : 0) / 100 * proofVaultSteps.length);
                  const isCurrent = index === Math.floor((submitForScoring.isPending ? 60 : 0) / 100 * proofVaultSteps.length) && submitForScoring.isPending;

                  return (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-4 bg-background rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="flex items-center">
                        {isCompleted ? (
                          <CheckCircle className="text-primary mr-3 w-5 h-5" />
                        ) : isCurrent ? (
                          <Loader className="text-primary-gold mr-3 w-5 h-5 animate-spin" />
                        ) : (
                          <Clock className="text-muted-foreground mr-3 w-5 h-5" />
                        )}
                        <span className="text-sm">{step.title}</span>
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-8">
                <div className="text-center">
                  <CheckCircle className="text-primary w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Analysis Complete</p>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="w-full bg-border rounded-full h-3 mb-4">
              <motion.div
                className="bg-gradient-to-r from-primary to-primary-gold h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${analysisProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This usually takes 30-60 seconds...
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
