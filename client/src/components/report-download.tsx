import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ReportDownloadProps {
  sessionId?: string;
  ventureId?: string;
}

interface ReportResponse {
  success: boolean;
  reportUrl?: string;
  message?: string;
  error?: string;
  generatedAt?: string;
}

export function ReportDownload({ sessionId, ventureId }: ReportDownloadProps) {
  const { toast } = useToast();
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadReport = async () => {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
      toast({
        title: "Opening Report",
        description: "If the report doesn't load immediately, please wait a moment and try again.",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const identifier = sessionId || ventureId;
      if (!identifier) {
        throw new Error('Session ID or Venture ID is required');
      }

      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          ventureId: ventureId
        })
      });

      const result = await response.json() as ReportResponse;

      if (result.success && result.reportUrl) {
        setReportUrl(result.reportUrl);
        setGeneratedAt(result.generatedAt || null);
        
        // Open the report URL in a new tab
        window.open(result.reportUrl, '_blank');
        
        toast({
          title: "Report Generated!",
          description: "Your validation report has been generated successfully.",
        });
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate report on component mount
  React.useEffect(() => {
    if (!reportUrl && (sessionId || ventureId)) {
      handleDownloadReport();
    }
  }, [sessionId, ventureId]);

  return (
    <Card className="p-6 border-border bg-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">Validation Report</h3>
          <p className="text-muted-foreground">
            Comprehensive analysis with insights and recommendations
          </p>
        </div>
        <Button 
          className="gradient-button" 
          onClick={handleDownloadReport}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <Download className="mr-2 w-4 h-4" />
          )}
          {reportUrl ? 'Download Report' : 'Generate Report'}
        </Button>
      </div>
    </Card>
  );
}