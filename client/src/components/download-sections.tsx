import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReportDownload } from "./report-download";
import { CertificateDownload } from "./certificate-download";

interface DownloadSectionsProps {
  sessionId?: string;
  ventureId?: string;
  ventureName: string;
  existingReportUrl?: string;
  existingCertificateUrl?: string;
}

export function DownloadSections({ 
  sessionId, 
  ventureId, 
  ventureName, 
  existingReportUrl, 
  existingCertificateUrl 
}: DownloadSectionsProps) {
  return (
    <div className="space-y-6">
      {/* Report Download Section */}
      <ReportDownload
        sessionId={sessionId}
        ventureId={ventureId}
        existingReportUrl={existingReportUrl}
      />

      {/* Certificate Download Section */}
      <CertificateDownload
        ventureId={ventureId}
        sessionId={sessionId}
        ventureName={ventureName}
        existingCertificateUrl={existingCertificateUrl}
      />

      {/* Alternative: Simple Download Cards for Future Use */}
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Your Detailed Founder Report</h3>
            <p className="text-muted-foreground">
              Comprehensive analysis with actionable recommendations
            </p>
          </div>
          <Button className="gradient-button">
            <Download className="mr-2 w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </Card>
    </div>
  );
}