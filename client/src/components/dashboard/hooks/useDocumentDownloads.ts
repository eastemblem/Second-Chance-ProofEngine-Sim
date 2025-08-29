import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

interface User {
  founderId: string;
  email: string;
  isAuthenticated: boolean;
  fullName?: string;
  venture?: {
    name: string;
    ventureId?: string;
    certificateUrl?: string;
    reportUrl?: string;
  };
}

interface ValidationData {
  proofScore: number;
  proofTagsUnlocked: number;
  totalProofTags: number;
  filesUploaded: number;
  status: string;
  certificateUrl?: string;
  reportUrl?: string;
  investorReady?: boolean;
  dealRoomAccess?: boolean;
}

export function useDocumentDownloads(user: User | null, validationData: ValidationData | null) {
  const { toast } = useToast();

  // Check if user has sufficient score for Deal Room access
  const checkScoreRequirement = (): boolean => {
    const proofScore = validationData?.proofScore || 0;
    if (proofScore < 70) {
      toast({
        title: "Access Restricted",
        description: "You have to achieve more than 70 in order to access deal room",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleDownloadCertificate = useCallback(async () => {
    try {
      // Check score requirement first
      if (!checkScoreRequirement()) {
        return;
      }

      if (!user?.venture?.ventureId) {
        toast({
          title: "Download Error",
          description: "Venture information not available.",
          variant: "destructive",
        });
        return;
      }

      const certificateUrl = user.venture.certificateUrl || validationData?.certificateUrl;
      if (certificateUrl) {
        trackEvent('download', 'document', 'certificate_download_success');
        
        window.open(certificateUrl, '_blank');
        toast({
          title: "Certificate Downloaded",
          description: `Your ${user.venture.name} certificate has been opened.`,
        });
      } else {
        trackEvent('download_failed', 'document', 'certificate_not_available');
        
        toast({
          title: "Certificate Not Available",
          description: "Your certificate is being generated. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Certificate download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, validationData, toast]);

  const handleDownloadReport = useCallback(async () => {
    try {
      // Check score requirement first
      if (!checkScoreRequirement()) {
        return;
      }

      if (!user?.venture?.ventureId) {
        toast({
          title: "Download Error", 
          description: "Venture information not available.",
          variant: "destructive",
        });
        return;
      }

      const reportUrl = user.venture.reportUrl || validationData?.reportUrl;
      if (reportUrl) {
        trackEvent('download', 'document', 'report_download_success');
        
        window.open(reportUrl, '_blank');
        toast({
          title: "Report Downloaded",
          description: `Your ${user.venture.name} analysis report has been opened.`,
        });
      } else {
        trackEvent('download_failed', 'document', 'report_not_available');
        
        toast({
          title: "Report Not Available",
          description: "Your report is being generated. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Report download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, validationData, toast]);

  return {
    handleDownloadCertificate,
    handleDownloadReport
  };
}