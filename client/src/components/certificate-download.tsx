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

  // Debug certificate props

  const handleGenerateCertificate = async () => {
    console.log('Certificate generation started for ventureId:', ventureId);
    setIsGenerating(true);
    
    try {
      console.log('Making API request to /api/certificate/generate');
      const response = await fetch('/api/certificate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ventureId })
      });

      const result = await response.json();

      console.log('Certificate API response:', response);

      if (result.success) {
        setCertificateUrl(result.certificateUrl || 'certificate-generated');
        toast({
          title: "Certificate Generated!",
          description: "Your ProofScore certificate has been created successfully.",
        });
        console.log('Certificate generated successfully:', result);
      } else {
        console.error('Certificate generation failed:', result.error);
        throw new Error(result.error || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Certificate generation error:', error);
      toast({
        title: "Generation Failed", 
        description: `Unable to generate certificate: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (certificateUrl && certificateUrl !== 'certificate-generated') {
      window.open(certificateUrl, '_blank');
      toast({
        title: "Download Started",
        description: "Your certificate is being downloaded.",
      });
    } else {
      toast({
        title: "Certificate Generated",
        description: "Your certificate has been created but is not available for download yet.",
        variant: "default",
      });
    }
  };

  if (certificateUrl) {
    const hasDownloadableUrl = certificateUrl && certificateUrl !== 'certificate-generated';
    
    return (
      <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg bg-gradient-to-r from-purple-50 to-yellow-50 dark:from-purple-900/20 dark:to-yellow-900/20 border-purple-200 dark:border-purple-700">
        <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
          <FileText className="h-5 w-5" />
          <span className="font-medium">Certificate Generated</span>
        </div>
        
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Your ProofScore validation certificate for <strong>{ventureName}</strong> has been created successfully
        </p>
        
        {hasDownloadableUrl ? (
          <Button 
            onClick={handleDownload}
            className="bg-gradient-to-r from-purple-600 to-yellow-600 hover:from-purple-700 hover:to-yellow-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Certificate PDF has been generated and stored locally
            </p>
            <Button 
              disabled
              className="bg-gradient-to-r from-purple-600 to-yellow-600 opacity-50 cursor-not-allowed text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Certificate Ready
            </Button>
          </div>
        )}
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