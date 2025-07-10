import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReportDownloadProps {
  ventureId?: string;
  sessionId?: string;
  className?: string;
}

export function ReportDownload({ ventureId, sessionId, className = "" }: ReportDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const downloadReport = async () => {
    try {
      setIsGenerating(true);
      
      let response;
      if (ventureId) {
        response = await fetch(`/api/report/generate/${ventureId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
      } else if (sessionId) {
        response = await fetch(`/api/report/generate-session/${sessionId}`, {
          method: 'POST'
        });
      } else {
        throw new Error('Either ventureId or sessionId is required');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }

      // Get the HTML content
      const htmlContent = await response.text();
      
      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Get filename from response headers or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Validation_Report.html';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Your validation report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download report",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const uploadToDataRoom = async () => {
    try {
      setIsUploading(true);
      
      let endpoint;
      let body = {};
      
      if (ventureId) {
        endpoint = `/api/report/generate-and-upload/${ventureId}`;
        body = { sessionId };
      } else if (sessionId) {
        endpoint = `/api/report/generate-and-upload-session/${sessionId}`;
      } else {
        throw new Error('Either ventureId or sessionId is required');
      }

      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.success) {
        toast({
          title: "Report Uploaded",
          description: "Your validation report has been uploaded to the data room successfully.",
        });
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading report:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload report to data room",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-4 p-6 bg-gradient-to-r from-purple-50 to-amber-50 rounded-lg border border-purple-200 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-amber-500">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Validation Report</h3>
          <p className="text-sm text-gray-600">Download your comprehensive analysis report</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={downloadReport}
          disabled={isGenerating}
          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </>
          )}
        </Button>

        <Button
          onClick={uploadToDataRoom}
          disabled={isUploading}
          variant="outline"
          className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload to Data Room
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-gray-500 mt-3">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span>Professional HTML report with all validation insights</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span>Includes ProofScore breakdown and improvement recommendations</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-3 w-3 text-amber-500" />
          <span>Upload to data room shares with investors automatically</span>
        </div>
      </div>
    </div>
  );
}