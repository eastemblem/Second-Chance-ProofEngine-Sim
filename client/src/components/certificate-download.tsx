import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CertificateDownloadProps {
  ventureId?: string;
  sessionId?: string;
  ventureName: string;
  existingCertificateUrl?: string;
}

export function CertificateDownload({ 
  ventureId, 
  sessionId,
  ventureName, 
  existingCertificateUrl 
}: CertificateDownloadProps) {
  const [certificateUrl, setCertificateUrl] = useState<string | null>(existingCertificateUrl || null);
  const { toast } = useToast();

  const handleDownloadCertificate = async () => {
    // If we have an existing certificate URL, use it directly without making API calls
    if (certificateUrl) {
      window.open(certificateUrl, '_blank');
      toast({
        title: "Certificate Download",
        description: "Certificate opened from cloud storage",
      });
      return;
    }

    // If no existing URL, show error instead of trying to create new certificate
    toast({
      title: "Certificate Not Available",
      description: "Your certificate is being generated. Please refresh the page and try again in a moment.",
      variant: "destructive",
    });
  };

  return (
    <Card className="p-4 sm:p-6 border-border bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Your Validation Certificate</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Official validation certificate with your achievements
          </p>
        </div>
        <Button 
          className="gradient-button w-full sm:w-auto min-h-[44px]" 
          onClick={handleDownloadCertificate}
        >
          <Download className="mr-2 w-4 h-4" />
          Download Certificate
        </Button>
      </div>
    </Card>
  );
}