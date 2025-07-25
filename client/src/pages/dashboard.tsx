import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  FileText, 
  Trophy, 
  Shield, 
  TrendingUp,
  FolderOpen,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Award,
  User,
  Settings,
  LogOut,
  Medal,
  Folder,
  ExternalLink,
  FolderPlus,
  RefreshCw,
  X,
  AlertCircle
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading";

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

interface ProofVaultFolder {
  id: string;
  name: string;
  displayName: string;
  count: number;
}

interface ProofVaultData {
  overviewCount: number;
  problemProofCount: number;
  solutionProofCount: number;
  demandProofCount: number;
  credibilityProofCount: number;
  commercialProofCount: number;
  investorPackCount: number;
  totalFiles: number;
  files: FileItem[];
  folders?: ProofVaultFolder[];
  folderUrls?: Record<string, string>;
}

interface FileItem {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  size: string;
  downloadUrl: string;
  type?: string;
}

interface ValidationData {
  proofScore: number;
  proofTagsUnlocked: number;
  totalProofTags: number;
  filesUploaded: number;
  status: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface LeaderboardEntry {
  ventureName: string;
  totalScore: number;
  rank: number;
  analysisDate: string;
  isReal: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [proofVaultData, setProofVaultData] = useState<ProofVaultData | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFolder, setSelectedFolder] = useState<string>("0_Overview");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<{file: File, folderId: string, status: 'pending' | 'uploading' | 'completed' | 'failed', progress: number, error?: string}>>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [showFailedFiles, setShowFailedFiles] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Load auth check immediately but defer dashboard data for better LCP
    checkAuthStatus();
    
    // Defer dashboard data loading slightly for better perceived performance
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Redirect to onboarding for fresh start since database was cleared
        setLocation('/');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Redirect to onboarding for fresh start since database was cleared
      setLocation('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load critical data first (validation) for faster LCP
      const validationResponse = await fetch('/api/dashboard/validation', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'max-age=300' // Cache for 5 minutes
        }
      });
      if (validationResponse.ok) {
        const validation = await validationResponse.json();
        setValidationData(validation);
        
        // Check for newly available documents and show toast notifications
        checkDocumentReadiness(validation);
      }

      // Load secondary data in parallel for better performance
      const [vaultResponse, activityResponse, leaderboardResponse] = await Promise.all([
        fetch('/api/dashboard/vault', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'max-age=600' // Cache for 10 minutes
          }
        }),
        fetch('/api/dashboard/activity', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'max-age=600' // Cache for 10 minutes
          }
        }),
        fetch('/api/leaderboard?limit=5', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'max-age=1200' // Cache for 20 minutes
          }
        })
      ]);

      if (vaultResponse.ok) {
        const vault = await vaultResponse.json();
        setProofVaultData(vault);
      }

      if (activityResponse.ok) {
        const activity = await activityResponse.json();
        // Use real timestamps from server or create realistic ones
        const updatedActivity = activity.map((item: ActivityItem, index: number) => ({
          ...item,
          timestamp: item.timestamp || new Date(Date.now() - (index + 1) * 5 * 60 * 1000).toISOString()
        }));
        setRecentActivity(updatedActivity);
      }

      if (leaderboardResponse.ok) {
        const leaderboard = await leaderboardResponse.json();
        if (leaderboard.success && leaderboard.data) {
          setLeaderboardData(leaderboard.data);
        }
      }
    } catch (error: unknown) {
      console.error('Dashboard data load error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If authentication fails, redirect to login instead of showing dummy data
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Not authenticated')) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access your dashboard.",
          variant: "destructive",
        });
        setLocation('/login');
        return;
      }
      
      // For other errors, show empty state but don't show dummy data
      setValidationData(null);
      setProofVaultData(null);
      setRecentActivity([]);
      setLeaderboardData([]);
      
      toast({
        title: "Data Load Error",
        description: "Unable to load dashboard data. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  // Check for newly available documents and show toast notifications
  const checkDocumentReadiness = (validation: any) => {
    // Check for certificate availability
    if (validation.certificateUrl && !sessionStorage.getItem('certificate_ready_notified')) {
      toast({
        title: "Certificate Ready!",
        description: "Your ProofScore certificate is now available for download.",
        variant: "default",
      });
      
      // Track certificate availability
      trackEvent('notification', 'document', 'certificate_ready');
      
      // Mark as notified to prevent duplicate notifications
      sessionStorage.setItem('certificate_ready_notified', 'true');
    }
    
    // Check for report availability
    if (validation.reportUrl && !sessionStorage.getItem('report_ready_notified')) {
      toast({
        title: "Analysis Report Ready!",
        description: "Your detailed venture analysis report is now available for download.",
        variant: "default",
      });
      
      // Track report availability
      trackEvent('notification', 'document', 'report_ready');
      
      // Mark as notified to prevent duplicate notifications
      sessionStorage.setItem('report_ready_notified', 'true');
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      if (!user?.venture?.ventureId) {
        toast({
          title: "Download Error",
          description: "Venture information not available.",
          variant: "destructive",
        });
        return;
      }

      if (user.venture.certificateUrl) {
        // Track successful certificate download
        trackEvent('download', 'document', 'certificate_download_success');
        
        window.open(user.venture.certificateUrl, '_blank');
        toast({
          title: "Certificate Downloaded",
          description: `Your ${user.venture.name} certificate has been opened.`,
        });
      } else {
        // Track certificate not available
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
  };

  const handleDownloadReport = async () => {
    try {
      if (!user?.venture?.ventureId) {
        toast({
          title: "Download Error", 
          description: "Venture information not available.",
          variant: "destructive",
        });
        return;
      }

      if (user.venture.reportUrl) {
        // Track successful report download
        trackEvent('download', 'document', 'report_download_success');
        
        window.open(user.venture.reportUrl, '_blank');
        toast({
          title: "Report Downloaded",
          description: `Your ${user.venture.name} analysis report has been opened.`,
        });
      } else {
        // Track report not available
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
  };

  // Handle multiple file uploads with queue processing
  const handleMultipleFileUpload = async (files: File[], folderId: string, isRetry: boolean = false) => {
    const newQueue = Array.from(files).map(file => ({
      file,
      folderId,
      status: 'pending' as const,
      progress: 0,
      error: undefined
    }));
    
    if (!isRetry) {
      setUploadQueue(newQueue);
    } else {
      // For retries, update existing queue items
      setUploadQueue(prev => prev.map(item => 
        files.some(f => f.name === item.file.name) 
          ? { ...item, status: 'pending' as const, progress: 0, error: undefined }
          : item
      ));
    }
    
    setCurrentUploadIndex(0);
    setIsUploading(true);
    
    // Process files sequentially for better user experience and server stability
    for (let i = 0; i < newQueue.length; i++) {
      setCurrentUploadIndex(i);
      await handleSingleFileUpload(newQueue[i], i);
    }
    
    // Check for failed uploads
    const failedFiles = uploadQueue.filter(item => item.status === 'failed');
    if (failedFiles.length > 0) {
      setShowFailedFiles(true);
      toast({
        title: "Some Uploads Failed",
        description: `${failedFiles.length} file(s) failed to upload. You can retry them below.`,
        variant: "destructive",
      });
    }
    
    // All uploads complete
    setIsUploading(false);
    setCurrentUploadIndex(0);
    setUploadProgress(0);
    
    // Reload data to reflect successful uploads
    await loadDashboardData();
  };

  const handleSingleFileUpload = async (queueItem: {file: File, folderId: string, status: string, progress: number, error?: string}, index: number) => {
    try {
      // Update queue item status
      setUploadQueue(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'uploading', error: undefined } : item
      ));

      const formData = new FormData();
      formData.append('file', queueItem.file);
      formData.append('folder_id', queueItem.folderId);

      // Simulate upload progress for current file
      const progressInterval = setInterval(() => {
        setUploadQueue(prev => prev.map((item, i) => 
          i === index ? { ...item, progress: Math.min(item.progress + 15, 80) } : item
        ));
      }, 300);

      const response = await fetch('/api/vault/upload-file', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      // Update final progress for current file
      setUploadQueue(prev => prev.map((item, i) => 
        i === index ? { ...item, progress: 100 } : item
      ));

      if (response.ok) {
        const result = await response.json();
        
        // Update queue item status to completed
        setUploadQueue(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'completed', error: undefined } : item
        ));
        
        // Track successful file upload
        trackEvent('upload', 'proofvault', `file_upload_${queueItem.folderId}`);
        
        toast({
          title: "File Uploaded",
          description: `${queueItem.file.name} uploaded successfully to ${getFolderDisplayName(queueItem.folderId)}.`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update queue item status to failed with error message
      setUploadQueue(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'failed', error: errorMessage } : item
      ));
      
      // Track failed file upload
      trackEvent('upload_failed', 'proofvault', `file_upload_error_${queueItem.folderId}`);
    }
  };

  // Retry failed uploads
  const retryFailedUploads = async () => {
    const failedFiles = uploadQueue.filter(item => item.status === 'failed');
    if (failedFiles.length === 0) return;
    
    setShowFailedFiles(false);
    await handleMultipleFileUpload(failedFiles.map(item => item.file), failedFiles[0].folderId, true);
  };

  // Handle folder uploads (for supported browsers)
  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    
    toast({
      title: "Folder Upload",
      description: `Processing ${fileList.length} files from folder...`,
    });

    await handleMultipleFileUpload(fileList, selectedFolder);
    event.target.value = '';
  };

  // Backward compatibility - single file upload
  const handleFileUpload = async (file: File, folderId: string) => {
    await handleMultipleFileUpload([file], folderId);
  };

  // Helper function to get folder display names
  const getFolderDisplayName = (folderId: string) => {
    const folderMap: Record<string, string> = {
      '0_Overview': 'Overview',
      '1_Problem_Proof': 'Problem Proofs',
      '2_Solution_Proof': 'Solution Proofs', 
      '3_Demand_Proof': 'Demand Proofs',
      '4_Credibility_Proof': 'Credibility Proofs',
      '5_Commercial_Proof': 'Commercial Proofs',
      '6_Investor_Pack': 'Investor Pack'
    };
    return folderMap[folderId] || folderId;
  };

  // Get available folders for dropdown
  const getAvailableFolders = () => [
    { id: '0_Overview', name: 'Overview', count: proofVaultData?.overviewCount || 0 },
    { id: '1_Problem_Proof', name: 'Problem Proofs', count: proofVaultData?.problemProofCount || 0 },
    { id: '2_Solution_Proof', name: 'Solution Proofs', count: proofVaultData?.solutionProofCount || 0 },
    { id: '3_Demand_Proof', name: 'Demand Proofs', count: proofVaultData?.demandProofCount || 0 },
    { id: '4_Credibility_Proof', name: 'Credibility Proofs', count: proofVaultData?.credibilityProofCount || 0 },
    { id: '5_Commercial_Proof', name: 'Commercial Proofs', count: proofVaultData?.commercialProofCount || 0 },
    { id: '6_Investor_Pack', name: 'Investor Pack', count: proofVaultData?.investorPackCount || 0 }
  ];

  // Handle viewing parent folder
  const handleViewParentFolder = () => {
    const parentFolderUrl = proofVaultData?.folderUrls?.['root'];
    if (parentFolderUrl) {
      // Track parent folder view event
      trackEvent('folder_view', 'document_management', 'view_parent_folder');
      
      window.open(parentFolderUrl, '_blank');
      toast({
        title: "Opening Parent Folder",
        description: "Opening your main Proof Vault folder",
      });
    } else {
      toast({
        title: "Folder Not Available",
        description: "Parent folder hasn't been created yet.",
        variant: "destructive",
      });
    }
  };

  const handleFileRemove = async (fileId: string) => {
    try {
      const response = await fetch(`/api/vault/remove-file/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "File Removed",
          description: "File has been removed successfully.",
        });
        loadDashboardData(); // Refresh data
      } else {
        throw new Error('Remove failed');
      }
    } catch (error) {
      console.error('File remove error:', error);
      toast({
        title: "Remove Error",
        description: "Failed to remove file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Track successful logout event
        trackEvent('logout', 'authentication', 'logout_success');
        
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
          duration: 3000,
        });
        
        setTimeout(() => {
          setLocation('/');
        }, 1000);
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Track failed logout event
      trackEvent('logout_failed', 'authentication', 'logout_error');
      toast({
        title: "Logout Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return activityTime.toLocaleDateString();
  };

  if (isLoading || !user) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar showSignOut />
      
      {/* Header Section */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center font-bold text-lg">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">Welcome {user?.fullName || user?.email?.split('@')[0] || 'Founder'}</h1>
                {(validationData?.proofScore || 0) >= 70 && (
                  <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg">
                    INVESTOR READY
                  </span>
                )}
              </div>
              <p className="text-gray-400">
                {user?.venture?.name || 'Your Venture'} Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Validation Overview */}
            <Card className="bg-black/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Validation Overview</CardTitle>
                <CardDescription className="text-gray-400">
                  Your current ProofScore and validation progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ProofScore Circle */}
                  <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/30 p-6 hover:border-purple-400/50 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative text-center">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center shadow-lg">
                        <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
                          <span className="text-xl font-bold text-white">{validationData?.proofScore || 0}</span>
                        </div>
                      </div>
                      <h3 className="text-white font-semibold mb-1">ProofScore</h3>
                      <p className="text-gray-400 text-sm">Current validation score</p>
                    </div>
                  </div>

                  {/* ProofTags */}
                  <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30 p-6 hover:border-blue-400/50 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative text-center">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 mx-auto">
                          <Trophy className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-400 mb-2">{validationData?.proofTagsUnlocked || 0}</div>
                      <h3 className="text-white font-semibold mb-1">ProofTags Unlocked</h3>
                      <Progress value={((validationData?.proofTagsUnlocked || 0) / (validationData?.totalProofTags || 21)) * 100} className="h-2 mb-2" />
                      <p className="text-gray-400 text-sm">of {validationData?.totalProofTags || 21} total</p>
                    </div>
                  </div>

                  {/* Files Uploaded */}
                  <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-600/20 border border-yellow-500/30 p-6 hover:border-yellow-400/50 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative text-center">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-yellow-500/20 mx-auto">
                          <FileText className="w-6 h-6 text-yellow-400" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-yellow-400 mb-2">{validationData?.filesUploaded || proofVaultData?.totalFiles || 0}</div>
                      <h3 className="text-white font-semibold mb-1">Files Uploaded</h3>
                      <p className="text-gray-400 text-sm">Documents in Proof Vault</p>
                    </div>
                  </div>
                </div>

                {validationData?.status && (
                  <div className="mt-6 group relative overflow-hidden rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-600/20 border border-green-500/30 p-6 hover:border-green-400/50 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Award className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-green-300 font-semibold text-sm mb-2">Excellent! You are investor ready.</h4>
                        <p className="text-gray-300 text-sm">
                          To access the Deal Room and Pass Due Diligence, please upload your Data Room into the Proof Vault.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>



            {/* Your Proof Vault */}
            <Card className="bg-black/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FolderOpen className="w-5 h-5" />
                  Your Proof Vault
                  {/* Parent Folder Access Button */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleViewParentFolder}
                    className="ml-auto text-purple-400 hover:text-purple-300 hover:bg-gray-800"
                    disabled={!proofVaultData?.folderUrls?.['root']}
                    title="View parent folder in Proof Vault"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage and organize your validation documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                    <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Overview</TabsTrigger>
                    <TabsTrigger value="files" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Files</TabsTrigger>
                    <TabsTrigger value="upload" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Upload</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/30 p-4 hover:border-purple-400/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative text-center">
                          <div className="text-2xl font-bold text-purple-400 mb-1">{proofVaultData?.overviewCount || 0}</div>
                          <p className="text-gray-300 text-sm font-medium">Overview</p>
                        </div>
                      </div>
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30 p-4 hover:border-blue-400/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative text-center">
                          <div className="text-2xl font-bold text-blue-400 mb-1">{proofVaultData?.problemProofCount || 0}</div>
                          <p className="text-gray-300 text-sm font-medium">Problem Proofs</p>
                        </div>
                      </div>
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/20 border border-green-500/30 p-4 hover:border-green-400/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative text-center">
                          <div className="text-2xl font-bold text-green-400 mb-1">{proofVaultData?.solutionProofCount || 0}</div>
                          <p className="text-gray-300 text-sm font-medium">Solution Proofs</p>
                        </div>
                      </div>
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/20 border border-orange-500/30 p-4 hover:border-orange-400/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative text-center">
                          <div className="text-2xl font-bold text-orange-400 mb-1">{proofVaultData?.demandProofCount || 0}</div>
                          <p className="text-gray-300 text-sm font-medium">Demand Proofs</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/20 border border-red-500/30 p-4 hover:border-red-400/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative text-center">
                          <div className="text-2xl font-bold text-red-400 mb-1">{proofVaultData?.credibilityProofCount || 0}</div>
                          <p className="text-gray-300 text-sm font-medium">Credibility Proofs</p>
                        </div>
                      </div>
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-teal-500/10 to-teal-600/20 border border-teal-500/30 p-4 hover:border-teal-400/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative text-center">
                          <div className="text-2xl font-bold text-teal-400 mb-1">{proofVaultData?.commercialProofCount || 0}</div>
                          <p className="text-gray-300 text-sm font-medium">Commercial Proofs</p>
                        </div>
                      </div>
                      <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 border border-indigo-500/30 p-4 hover:border-indigo-400/50 transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative text-center">
                          <div className="text-2xl font-bold text-indigo-400 mb-1">{proofVaultData?.investorPackCount || 0}</div>
                          <p className="text-gray-300 text-sm font-medium">Investor Pack</p>
                        </div>
                      </div>
                    </div>

                  </TabsContent>

                  <TabsContent value="files" className="mt-6">
                    <div className="space-y-3">
                      {proofVaultData?.files?.length ? (
                        proofVaultData.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-white font-medium">{file.name}</p>
                                <p className="text-gray-400 text-sm">{file.category} • {file.size} • {formatTimeAgo(file.uploadDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => window.open(file.downloadUrl, '_blank')}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => window.open(file.downloadUrl, '_blank')}>
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleFileRemove(file.id)} className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No files uploaded yet</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-6">
                    <div className="space-y-6">
                      {/* Folder Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Select Folder</label>
                        <div className="flex gap-2">
                          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white flex-1">
                              <SelectValue placeholder="Choose a folder...">
                                <div className="flex items-center gap-2">
                                  <Folder className="w-4 h-4" />
                                  {getFolderDisplayName(selectedFolder)} ({getAvailableFolders().find(f => f.id === selectedFolder)?.count || 0} files)
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {getAvailableFolders().map((folder) => (
                                <SelectItem key={folder.id} value={folder.id} className="text-white hover:bg-gray-700">
                                  <div className="flex items-center justify-between w-full">
                                    <span className="flex items-center gap-2">
                                      <Folder className="w-4 h-4" />
                                      {folder.name}
                                    </span>
                                    <span className="text-gray-400 text-sm">({folder.count} files)</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* View Folder Button */}

                        </div>
                      </div>

                      {/* Upload Area */}
                      <div 
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                          isUploading 
                            ? 'border-purple-500 bg-purple-500/5' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('border-purple-400', 'bg-purple-500/10');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-purple-400', 'bg-purple-500/10');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-purple-400', 'bg-purple-500/10');
                          const files = Array.from(e.dataTransfer.files);
                          if (files.length > 0) {
                            handleMultipleFileUpload(files, selectedFolder);
                          }
                        }}
                      >
                        {isUploading ? (
                          <div className="space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center">
                              <Upload className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            
                            {/* Queue Status */}
                            <div className="space-y-3">
                              <p className="text-purple-400 font-medium">
                                Uploading {currentUploadIndex + 1} of {uploadQueue.length} files...
                              </p>
                              
                              {/* Current File Progress */}
                              {uploadQueue[currentUploadIndex] && (
                                <div className="space-y-2">
                                  <p className="text-gray-300 text-sm">
                                    {uploadQueue[currentUploadIndex].file.name}
                                  </p>
                                  <Progress value={uploadQueue[currentUploadIndex].progress} className="h-2 bg-gray-700" />
                                  <p className="text-gray-400 text-xs">{uploadQueue[currentUploadIndex].progress}% complete</p>
                                </div>
                              )}
                              
                              {/* Queue Summary */}
                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 max-w-xs mx-auto">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <span>Completed: {uploadQueue.filter(item => item.status === 'completed').length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                  <span>Failed: {uploadQueue.filter(item => item.status === 'failed').length}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-300 mb-2">Drag and drop files here or click to browse</p>
                            <p className="text-gray-500 text-sm mb-4">
                              Files will be uploaded to: <span className="text-purple-400 font-medium">{getFolderDisplayName(selectedFolder)}</span>
                            </p>
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov"
                              className="hidden"
                              id="file-upload"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                  handleMultipleFileUpload(Array.from(files), selectedFolder);
                                  // Reset input
                                  e.target.value = '';
                                }
                              }}
                            />
                            <input
                              type="file"
                              multiple
                              {...({ webkitdirectory: "" } as any)}
                              className="hidden"
                              id="folder-upload"
                              onChange={handleFolderUpload}
                            />
                            <div className="flex gap-2 flex-wrap justify-center">
                              <Button 
                                onClick={() => document.getElementById('file-upload')?.click()} 
                                className="bg-gradient-to-r from-purple-500 to-yellow-500 text-white hover:from-purple-600 hover:to-yellow-600"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Choose Files
                              </Button>
                              <Button 
                                onClick={() => document.getElementById('folder-upload')?.click()} 
                                variant="outline"
                                className="border-purple-400 text-purple-400 hover:bg-purple-500 hover:text-white"
                              >
                                <FolderPlus className="w-4 h-4 mr-2" />
                                Upload Folder
                              </Button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Failed Files Section */}
                      {showFailedFiles && uploadQueue.some(item => item.status === 'failed') && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <h4 className="text-red-400 font-medium">Failed Uploads</h4>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowFailedFiles(false)}
                              className="text-gray-400 hover:text-white h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {uploadQueue.filter(item => item.status === 'failed').map((item, index) => (
                              <div key={index} className="text-sm bg-red-500/5 rounded p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-red-300 font-medium">{item.file.name}</span>
                                  <span className="text-gray-500 text-xs">({(item.file.size / 1024 / 1024).toFixed(1)} MB)</span>
                                </div>
                                {item.error && (
                                  <p className="text-xs text-red-400">{item.error}</p>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={retryFailedUploads}
                              className="bg-red-500 hover:bg-red-600 text-white"
                              disabled={isUploading}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry Failed
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUploadQueue([]);
                                setShowFailedFiles(false);
                              }}
                              className="border-gray-600 text-gray-400 hover:bg-gray-700"
                            >
                              Clear All
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Upload Guidelines */}
                      <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-300">Upload Guidelines</h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                          <li>• Supported formats: PDF, PPT, PPTX, DOC, DOCX, JPG, PNG, MP4, MOV</li>
                          <li>• Maximum file size: 10 MB per file</li>
                          <li>• Select multiple files at once or drag & drop for batch upload</li>
                          <li>• Files process sequentially to ensure reliable uploads</li>
                          <li>• Upload high-quality documents to maximize your ProofScore</li>
                          <li>• Folder upload: Select entire folders for bulk file management</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Certificate & Report Downloads */}
            <Card className="bg-black/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Ready for Download</CardTitle>
                <CardDescription className="text-gray-400">
                  Access your validation certificate and analysis report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Certificate Download */}
                  <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/30 p-6 hover:border-purple-400/50 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Award className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">ProofScore Certificate</h3>
                          <p className="text-gray-400 text-sm">Official validation document</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleDownloadCertificate}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                        disabled={!user?.venture?.certificateUrl}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Certificate
                      </Button>
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500">
                          {user?.venture?.certificateUrl ? 'Ready for download' : 'Generating certificate...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Report Download */}
                  <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-600/20 border border-yellow-500/30 p-6 hover:border-yellow-400/50 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-yellow-500/20">
                          <FileText className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">Analysis Report</h3>
                          <p className="text-gray-400 text-sm">Detailed breakdown & insights</p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleDownloadReport}
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0 shadow-lg hover:shadow-yellow-500/25 transition-all duration-300"
                        disabled={!user?.venture?.reportUrl}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </Button>
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500">
                          {user?.venture?.reportUrl ? 'Ready for download' : 'Generating report...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Leaderboard - Top Right */}
            <Card className="bg-black/50 border-gray-800">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-amber-500 shadow-lg">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  Leaderboard
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Top performing ventures by ProofScore validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboardData.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboardData.map((entry) => {
                      const isTopThree = entry.rank <= 3;
                      const isCurrentUser = user?.venture?.name === entry.ventureName;
                      
                      return (
                        <div
                          key={entry.rank}
                          className={`relative transition-all duration-300 rounded-xl overflow-hidden ${
                            isCurrentUser 
                              ? 'bg-gradient-to-r from-violet-500/20 to-amber-500/20 border-2 border-transparent shadow-lg shadow-violet-500/25' 
                              : isTopThree
                              ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-400/30 shadow-md'
                              : 'bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/20'
                          }`}
                        >
                          {isCurrentUser && (
                            <>
                              {/* Animated border */}
                              <div className="absolute inset-0 pointer-events-none rounded-xl">
                                <div className="absolute inset-[2px] bg-gray-900/95 rounded-xl" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-violet-400 to-amber-400 rounded-full animate-pulse z-10"></div>
                            </>
                          )}
                          
                          <div className="relative z-10 flex items-center gap-3 p-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                              isTopThree ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gray-600/50'
                            } shadow-lg`}>
                              {entry.rank <= 3 ? (
                                entry.rank === 1 ? (
                                  <Trophy className="w-4 h-4 text-yellow-900" />
                                ) : entry.rank === 2 ? (
                                  <Medal className="w-4 h-4 text-gray-700" />
                                ) : (
                                  <Award className="w-4 h-4 text-amber-700" />
                                )
                              ) : (
                                <span className="text-xs font-bold text-white">{entry.rank}</span>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-sm font-medium truncate ${
                                  isCurrentUser ? 'text-violet-300' : 'text-white'
                                }`}>
                                  {entry.ventureName}
                                </h4>
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.5 text-xs bg-gradient-to-r from-violet-500 to-amber-500 text-white rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate">ProofScore validation</p>
                            </div>
                            
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                isCurrentUser ? 'text-violet-400' : isTopThree ? 'text-amber-400' : 'text-gray-300'
                              }`}>
                                {entry.totalScore}
                              </div>
                              <div className="text-xs text-gray-500">ProofScore</div>
                            </div>
                      </div>
                    </div>
                  );
                })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Complete onboarding to see your leaderboard position</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deal Room Access */}
            <Card className="bg-black/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5" />
                  Deal Room Access
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Premium investor access portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(validationData?.proofScore || 0) >= 90 ? (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 text-sm">Access Granted</span>
                      </div>
                      <p className="text-gray-400 text-sm">Your venture is now visible to our verified investor network.</p>
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-yellow-500 text-white">
                        Enter Deal Room →
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 text-sm">Upload Required</span>
                      </div>
                      <p className="text-gray-400 text-sm">Upload more files to your data room to achieve a score above 90 and access the deal room.</p>
                      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                        <p className="text-yellow-300 text-xs">
                          Current Score: {validationData?.proofScore || 0}/100<br/>
                          Required: 90+ for Deal Room Access
                        </p>
                      </div>
                      <Button disabled className="w-full bg-gray-600 text-gray-400 cursor-not-allowed">
                        Deal Room Locked
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-black/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your latest platform interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => {
                      const timeAgo = formatTimeAgo(activity.timestamp);
                      const colorClasses = {
                        green: "bg-green-400",
                        blue: "bg-blue-400", 
                        purple: "bg-purple-400",
                        yellow: "bg-yellow-400",
                        orange: "bg-orange-400",
                        red: "bg-red-400"
                      };
                      
                      return (
                        <div key={activity.id} className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-500/10 to-gray-600/20 border border-gray-500/30 p-3 hover:border-gray-400/50 transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full ${colorClasses[activity.color as keyof typeof colorClasses] || 'bg-gray-400'} mt-2 flex-shrink-0`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium">{activity.title}</p>
                              <p className="text-gray-400 text-xs truncate">{activity.description}</p>
                              <p className="text-gray-500 text-xs mt-1">{timeAgo}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center text-gray-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent activity</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}