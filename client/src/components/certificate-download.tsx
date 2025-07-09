import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownloadCertificate = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/certificate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ventureId })
      });

      const result = await response.json();

      if (result.success && result.certificateUrl) {
        // Open the certificate URL in a new tab
        window.open(result.certificateUrl, '_blank');
        
        toast({
          title: "Certificate Download",
          description: result.uploadedToCloud 
            ? "Certificate opened from cloud storage" 
            : "Certificate download started",
        });
      } else {
        throw new Error(result.error || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Certificate download error:', error);
      toast({
        title: "Download Failed", 
        description: `Unable to download certificate: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 border-border bg-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">Your ProofScore Certificate</h3>
          <p className="text-muted-foreground">
            Official validation certificate with your achievements
          </p>
        </div>
        <Button 
          className="gradient-button" 
          onClick={handleDownloadCertificate}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <Download className="mr-2 w-4 h-4" />
          )}
          Download Certificate
        </Button>
      </div>
    </Card>
  );
}