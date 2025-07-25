import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportDownloadProps {
  sessionId?: string;
  ventureId?: string;
  existingReportUrl?: string;
}

export function ReportDownload({ sessionId, ventureId, existingReportUrl }: ReportDownloadProps) {
  const { toast } = useToast();
  const [reportUrl, setReportUrl] = useState<string | null>(existingReportUrl || null);

  const handleDownloadReport = async () => {
    // If we have an existing report URL, use it directly without making API calls
    if (reportUrl) {
      window.open(reportUrl, '_blank');
      toast({
        title: "Opening Report",
        description: "If the report doesn't load immediately, please wait a moment and try again.",
      });
      return;
    }

    // If no existing URL, show error instead of trying to create new report
    toast({
      title: "Report Not Available",
      description: "Your report is being generated. Please refresh the page and try again in a moment.",
      variant: "destructive",
    });
  };



  return (
    <Card className="p-4 sm:p-6 border-border bg-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Your Validation Report</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Comprehensive analysis with insights and recommendations
          </p>
        </div>
        <Button 
          className="gradient-button w-full sm:w-auto min-h-[44px]" 
          onClick={handleDownloadReport}
        >
          <Download className="mr-2 w-4 h-4" />
          Download Report
        </Button>
      </div>
    </Card>
  );
}