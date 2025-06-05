import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BoxIntegrationProps {
  userId?: string;
}

export default function BoxIntegration({ userId }: BoxIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>("");
  const { toast } = useToast();

  const handleConnectBox = async () => {
    try {
      setIsConnecting(true);
      
      // Get Box OAuth URL
      const response = await fetch('/api/box/auth-url');
      const data = await response.json();
      
      if (data.authUrl) {
        setAuthUrl(data.authUrl);
        // Open Box OAuth in new window
        window.open(data.authUrl, '_blank', 'width=600,height=700');
        
        toast({
          title: "Box Authentication",
          description: "Please complete the authentication in the popup window.",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Box. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch(`/api/box/upload/${userId}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: `${file.name} has been uploaded to Box.`,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not upload file to Box. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Box Document Storage
        </CardTitle>
        <CardDescription>
          Connect your Box account to securely store and manage your proof documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-3">
            <Button 
              onClick={handleConnectBox}
              disabled={isConnecting}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {isConnecting ? "Connecting..." : "Connect to Box"}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              Securely store pitch decks, financial statements, and other proof documents
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> to Box
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOC, XLS, PPT (MAX. 10MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                />
              </label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}