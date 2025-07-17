import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
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

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const identifier = sessionId || ventureId;
      if (!identifier) {
        throw new Error('Session ID or Venture ID is required');
      }

      const response = await apiRequest('/api/report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          ventureId: ventureId
        })
      });

      return response.json() as Promise<ReportResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.reportUrl) {
        setReportUrl(data.reportUrl);
        setGeneratedAt(data.generatedAt || null);
        toast({
          title: "Report Ready!",
          description: "Your validation report has been generated successfully.",
        });
      } else {
        toast({
          title: "Report Generation Failed",
          description: data.error || "Failed to generate report. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Report generation error:', error);
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDownload = () => {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    } else {
      generateReportMutation.mutate();
    }
  };

  // Auto-generate report on component mount
  React.useEffect(() => {
    if (!reportUrl && (sessionId || ventureId)) {
      generateReportMutation.mutate();
    }
  }, [sessionId, ventureId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
          Validation Report
        </h3>
      </div>
      
      <div className="bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {reportUrl ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : generateReportMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            )}
            <span className="text-sm font-medium">
              {reportUrl ? 'Report Ready' : 
               generateReportMutation.isPending ? 'Generating Report...' : 
               'Report Available'}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {reportUrl ? 
              'Your comprehensive validation report is ready for download.' :
              generateReportMutation.isPending ?
              'Please wait while we generate your detailed validation report...' :
              'Generate your detailed validation report with insights and recommendations.'}
          </p>
          
          {generatedAt && (
            <p className="text-xs text-muted-foreground">
              Generated: {new Date(generatedAt).toLocaleString()}
            </p>
          )}
          
          <Button
            onClick={handleDownload}
            disabled={generateReportMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white"
          >
            {generateReportMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {reportUrl ? 'Download Report' : 'Generate Report'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}