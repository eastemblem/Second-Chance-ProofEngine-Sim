import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, ExternalLink, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface PitchDeckUploadProps {
  userId?: string;
}

export default function PitchDeckUpload({ userId }: PitchDeckUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [accessToken, setAccessToken] = useState<string>("");
  const [needsAuth, setNeedsAuth] = useState(true);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Listen for Box auth completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'BOX_AUTH_SUCCESS' && event.data.tokens) {
        setAccessToken(event.data.tokens.access_token);
        setNeedsAuth(false);
        if (authWindow) {
          authWindow.close();
          setAuthWindow(null);
        }
        toast({
          title: "Box Connected Successfully",
          description: "You can now upload your pitch deck securely.",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authWindow, toast]);

  const handleBoxAuth = async () => {
    try {
      const response = await fetch('/api/box/auth-url');
      const data = await response.json();
      
      if (data.authUrl) {
        const newWindow = window.open(data.authUrl, 'boxAuth', 'width=600,height=700,scrollbars=yes,resizable=yes');
        setAuthWindow(newWindow);
        toast({
          title: "Box Authentication Required",
          description: "Please complete authentication to upload your pitch deck.",
        });
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Could not connect to Box. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    if (!accessToken) {
      setNeedsAuth(true);
      return;
    }

    // Validate file type for pitch decks
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or PowerPoint presentation.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('document', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`/api/box/upload/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (result.success) {
        setUploadedFiles(prev => [...prev, {
          id: result.file.id,
          name: result.file.name,
          type: 'pitch-deck',
          uploadedAt: new Date().toISOString()
        }]);

        toast({
          title: "Pitch Deck Uploaded Successfully",
          description: `${file.name} has been securely stored in Box.`,
        });

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not upload pitch deck. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-gold" />
          Pitch Deck Upload
        </CardTitle>
        <CardDescription>
          Upload your investor presentation to secure Box storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsAuth ? (
          <div className="text-center space-y-4">
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-800">
                Connect to Box to securely store your pitch deck
              </p>
            </div>
            <Button onClick={handleBoxAuth} className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect to Box
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary-gold/30 rounded-lg cursor-pointer bg-primary-gold/5 hover:bg-primary-gold/10 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-primary-gold" />
                  <p className="mb-2 text-sm text-foreground">
                    <span className="font-semibold">Click to upload pitch deck</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PDF or PowerPoint (MAX. 25MB)</p>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept=".pdf,.ppt,.pptx"
                  disabled={isUploading}
                />
              </label>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading to Box...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Uploaded Pitch Decks</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{file.name}</p>
                      <p className="text-xs text-green-600">
                        Uploaded {new Date(file.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}