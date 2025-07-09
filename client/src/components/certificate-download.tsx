import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CertificateDownloadProps {
  ventureId: string;
  ventureName: string;
  existingCertificateUrl?: string;
}

export function CertificateDownload({ 
  ventureId, 
  ventureName, 
  existingCertificateUrl 
}: CertificateDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(existingCertificateUrl || null);
  const { toast } = useToast();

  const handleGenerateCertificate = async () => {
    setIsGenerating(true);
    
    try {
      const response = await apiRequest('/api/certificate/generate', {
        method: 'POST',
        body: { ventureId }
      });

      if (response.success && response.certificateUrl) {
        setCertificateUrl(response.certificateUrl);
        toast({
          title: "Certificate Generated!",
          description: "Your ProofScore certificate is ready for download.",
        });
      } else {
        throw new Error(response.error || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Certificate generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (certificateUrl) {
      window.open(certificateUrl, '_blank');
      toast({
        title: "Download Started",
        description: "Your certificate is being downloaded.",
      });
    }
  };

  if (certificateUrl) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg bg-gradient-to-r from-purple-50 to-yellow-50 dark:from-purple-900/20 dark:to-yellow-900/20 border-purple-200 dark:border-purple-700">
        <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
          <FileText className="h-5 w-5" />
          <span className="font-medium">Certificate Available</span>
        </div>
        
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Your ProofScore validation certificate for <strong>{ventureName}</strong> is ready
        </p>
        
        <Button 
          onClick={handleDownload}
          className="bg-gradient-to-r from-purple-600 to-yellow-600 hover:from-purple-700 hover:to-yellow-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Certificate
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg bg-gradient-to-r from-purple-50 to-yellow-50 dark:from-purple-900/20 dark:to-yellow-900/20 border-purple-200 dark:border-purple-700">
      <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
        <FileText className="h-5 w-5" />
        <span className="font-medium">ProofScore Certificate</span>
      </div>
      
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Generate a professional certificate to showcase your validation achievement
      </p>
      
      <Button 
        onClick={handleGenerateCertificate}
        disabled={isGenerating}
        className="bg-gradient-to-r from-purple-600 to-yellow-600 hover:from-purple-700 hover:to-yellow-700 text-white disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Generate Certificate
          </>
        )}
      </Button>
    </div>
  );
}