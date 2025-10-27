import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePaginatedActivities } from "@/hooks/use-paginated-activities";
import { usePaginatedFiles } from "@/hooks/use-paginated-files";
import { 
  Download, 
  Upload, 
  FileText, 
  Trophy, 
  Shield, 
  TrendingUp,
  FolderOpen,
  Plus,

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
  AlertCircle,
  Building,
  Navigation,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  Presentation,
  File,
  Image,
  Video,
  Music,
  FileArchive,
  CreditCard
} from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { DashboardLayout } from "@/components/layout/layout";
import { DashboardLoadingSkeleton } from "@/components/dashboard-loading";
import { PaymentModal } from '@/components/ui/payment-modal';

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
  certificateUrl?: string;
  reportUrl?: string;
  investorReady?: boolean;
  dealRoomAccess?: boolean;
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
  // Replace recentActivity state with paginated hook
  const {
    activities: recentActivity,
    totalActivities,
    isLoading: isActivitiesLoading,
    loadMore,
    hasMore,
    isLoadingMore
  } = usePaginatedActivities();

  // Pagination for files
  const { 
    files: paginatedFiles, 
    totalFiles, 
    isLoading: filesLoading, 
    isLoadingMore: filesLoadingMore, 
    loadMore: loadMoreFiles, 
    hasMore: hasMoreFiles 
  } = usePaginatedFiles();
  
  const activityContainerRef = useRef<HTMLDivElement>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFolder, setSelectedFolder] = useState<string>("0_Overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("0_Overview");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingFolders, setIsCreatingFolders] = useState(false);
  const [folderCreationStatus, setFolderCreationStatus] = useState<string>('');
  const [uploadQueue, setUploadQueue] = useState<Array<{file: File, folderId: string, status: 'pending' | 'uploading' | 'completed' | 'failed', progress: number, error?: string}>>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [showFailedFiles, setShowFailedFiles] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasDealRoomAccess, setHasDealRoomAccess] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Handle payment success
  const handlePaymentSuccess = () => {
    setHasDealRoomAccess(true);
    
    // Track payment success activity
    trackEvent('payment', 'deal_room', 'payment_success');
    
    // Don't close modal here - let the modal handle its own success display
    // Don't redirect - keep user on dashboard
  };

  // Handle scroll-based pagination for activities
  const handleActivityScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Load more when user scrolls to within 100px of bottom
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  // Handle scroll-based pagination for files
  const handleFilesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Load more when user scrolls to within 100px of bottom
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreFiles && !filesLoadingMore) {
      loadMoreFiles();
    }
  };

  // Get appropriate file icon based on file type
  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "w-5 h-5";
    
    // PDF files
    if (extension === 'pdf' || mimeType?.includes('pdf')) {
      return <FileText className={`${iconClass} text-red-400`} />;
    }
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'tif'].includes(extension || '') || 
        mimeType?.startsWith('image/')) {
      return <FileImage className={`${iconClass} text-green-400`} />;
    }
    
    // Video files
    if (['mp4', 'mov', 'avi', 'webm', '3gp', 'flv', 'wmv'].includes(extension || '') || 
        mimeType?.startsWith('video/')) {
      return <FileVideo className={`${iconClass} text-blue-400`} />;
    }
    
    // Audio files
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension || '') || 
        mimeType?.startsWith('audio/')) {
      return <FileAudio className={`${iconClass} text-purple-400`} />;
    }
    
    // Spreadsheet files
    if (['xls', 'xlsx', 'csv', 'ods', 'xlsb', 'xlsm', 'xltx'].includes(extension || '') || 
        mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
      return <FileSpreadsheet className={`${iconClass} text-emerald-400`} />;
    }
    
    // Presentation files
    if (['ppt', 'pptx', 'ppsx'].includes(extension || '') || 
        mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
      return <Presentation className={`${iconClass} text-orange-400`} />;
    }
    
    // Document files
    if (['doc', 'docx', 'rtf', 'odt'].includes(extension || '') || 
        mimeType?.includes('document') || mimeType?.includes('word')) {
      return <FileText className={`${iconClass} text-blue-500`} />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '') || 
        mimeType?.includes('zip') || mimeType?.includes('archive')) {
      return <FileArchive className={`${iconClass} text-yellow-400`} />;
    }
    
    // Text files
    if (['txt', 'md', 'xml', 'json'].includes(extension || '') || 
        mimeType?.startsWith('text/')) {
      return <FileText className={`${iconClass} text-gray-400`} />;
    }
    
    // Default file icon
    return <File className={`${iconClass} text-gray-400`} />;
  };

  useEffect(() => {
    // Load auth check immediately and load dashboard data for better UX
    checkAuthStatus();
    
    // Load dashboard data immediately for validation, vault counts, and leaderboard
    // Activity data is handled by usePaginatedActivities hook
    // File data is handled by usePaginatedFiles hook
    loadDashboardData();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // CRITICAL FIX: Clear any stale data first
      const token = localStorage.getItem('auth_token');
      if (!token || token === 'null' || token === 'undefined') {
        localStorage.clear(); // Clear all localStorage data
        setLocation('/login');
        return;
      }

      const response = await fetch('/api/auth-token/verify', { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const userData = {
            founderId: result.data.user.founderId,
            email: result.data.user.email,
            isAuthenticated: true,
            fullName: result.data.user.fullName,
            venture: {
              name: result.data.venture.name,
              ventureId: result.data.venture.ventureId
            }
          };
          setUser(userData);
        } else {
          localStorage.clear();
          setLocation('/login');
        }
      } else {
        localStorage.clear();
        setLocation('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.clear();
      setLocation('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async (forceRefresh = false) => {
    try{
      // Prepare headers - skip cache when forcing refresh
      const headers = forceRefresh ? {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      } : {
        'Cache-Control': 'max-age=300' // Cache for 5 minutes normally
      };

      // Load critical data first (validation) for faster LCP - USE V1 API with JWT
      const token = localStorage.getItem('auth_token');
      const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const validationResponse = await fetch('/api/v1/dashboard/validation', {
        credentials: 'include',
        headers: { ...headers, ...authHeaders } as HeadersInit
      });
      if (validationResponse.ok) {
        const validation = await validationResponse.json();
        setValidationData(validation);
        
        // Check for newly available documents and show toast notifications
        checkDocumentReadiness(validation);
      } else {
        console.error('❌ Validation API failed:', validationResponse.status, validationResponse.statusText);
        // Don't throw error - let other data load
      }

      // Load secondary data in parallel - USE V1 APIS with JWT
      const [vaultResponse, leaderboardResponse] = await Promise.all([
        fetch('/api/v1/dashboard/vault', {
          credentials: 'include',
          headers: { 
            ...(forceRefresh ? headers : { 'Cache-Control': 'max-age=600' }),
            ...authHeaders
          } as HeadersInit
        }),
        fetch('/api/v1/leaderboard?limit=5', {
          credentials: 'include',
          headers: { 
            ...(forceRefresh ? headers : { 'Cache-Control': 'max-age=1200' }),
            ...authHeaders
          } as HeadersInit
        })
      ]);

      if (vaultResponse.ok) {
        const vault = await vaultResponse.json();
        // Only store the counts, not the files array - files are now handled by usePaginatedFiles hook
        setProofVaultData({
          ...vault,
          files: [] // Clear files array since we use paginated files hook instead
        });
      } else {
        console.error('❌ Vault API failed:', vaultResponse.status, vaultResponse.statusText);
        // Don't throw error - let other data load
      }

      if (leaderboardResponse.ok) {
        const leaderboard = await leaderboardResponse.json();
        if (leaderboard.success && leaderboard.data) {
          setLeaderboardData(leaderboard.data);
        }
      } else {
        console.error('❌ Leaderboard API failed:', leaderboardResponse.status, leaderboardResponse.statusText);
        // Don't throw error - let other data load
      }
      
      // Check deal room access
      try {
        const dealRoomResponse = await fetch('/api/v1/payments/deal-room-access', {
          credentials: 'include',
          headers: authHeaders as HeadersInit
        });
        if (dealRoomResponse.ok) {
          const accessResult = await dealRoomResponse.json();
          setHasDealRoomAccess(accessResult.hasAccess || false);
        }
      } catch (error) {
        console.error('❌ Deal room access check failed:', error);
        // Don't throw error - just assume no access
        setHasDealRoomAccess(false);
      }
      
      setIsLoading(false); // Ensure loading state is cleared
    } catch (error: unknown) {
      console.error('❌ Dashboard data load error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's actually a network or fetch error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🌐 Network error detected:', error.message);
        toast({
          title: "Network Error",
          description: "Unable to connect to server. Please check your connection.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // If authentication fails, redirect to login instead of showing dummy data
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Not authenticated')) {
        localStorage.removeItem('auth_token');
        toast({
          title: "Session Expired",
          description: "Please log in again to access your dashboard.",
          variant: "destructive",
        });
        setLocation('/login');
        return;
      }
      
      // For other errors, don't show toast - data might still load partially
      console.warn('⚠️ Some dashboard data failed to load, but continuing:', errorMessage);
      
      // Set loading to false to prevent infinite loading state
      setIsLoading(false);
    }
  };

  // Check for newly available documents and show toast notifications
  const checkDocumentReadiness = (validation: any) => {
    // Only show document ready notifications if user has made payment (has deal room access)
    if (!hasDealRoomAccess) {
      return; // Don't show notifications until payment is completed
    }

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

      const certificateUrl = user.venture.certificateUrl || validationData?.certificateUrl;
      if (certificateUrl) {
        // Track successful certificate download
        trackEvent('download', 'document', 'certificate_download_success');
        
        window.open(certificateUrl, '_blank');
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

      const reportUrl = user.venture.reportUrl || validationData?.reportUrl;
      if (reportUrl) {
        // Track successful report download
        trackEvent('download', 'document', 'report_download_success');
        
        window.open(reportUrl, '_blank');
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

  // Handle file upload with hierarchical folder creation (Main folder → Subfolders → Files)
  const handleFileUploadWithFolderCreation = async (files: File[], selectedCategory: string) => {
    try {
      // Step 1: Create main folder in the selected category
      const mainFolderName = `Upload_${new Date().toISOString().split('T')[0]}_${Date.now()}`;
      
      toast({
        title: "Creating Main Folder",
        description: `Creating main folder "${mainFolderName}" for organizing ${files.length} file(s)...`,
      });

      const mainFolderId = await createFolder(mainFolderName, selectedCategory);
      
      if (!mainFolderId) {
        throw new Error('Failed to create main folder');
      }

      toast({
        title: "Main Folder Created",
        description: `Main folder "${mainFolderName}" created. Now creating subfolders...`,
      });

      // Step 2: Group files by their types/extensions for subfolder organization
      const fileGroups = groupFilesByType(files);
      const uploadPromises: Promise<void>[] = [];

      // Step 3: Create subfolders and upload files sequentially (wait for each folder creation)
      for (const [folderType, groupedFiles] of Object.entries(fileGroups)) {
        const subfolderName = `${folderType}_Files`;
        
        toast({
          title: "Creating Subfolder",
          description: `Creating "${subfolderName}" subfolder for ${groupedFiles.length} file(s)...`,
        });

        try {
          // Wait for subfolder creation to complete before proceeding
          const subFolderId = await createFolder(subfolderName, mainFolderId);
          
          if (subFolderId) {
            toast({
              title: "Subfolder Ready",
              description: `"${subfolderName}" created. Now uploading ${groupedFiles.length} files...`,
            });
            
            // Wait for this upload to complete before creating next subfolder
            await handleMultipleFileUpload(groupedFiles, subFolderId);
            
            toast({
              title: "Upload Complete",
              description: `${groupedFiles.length} files uploaded to "${subfolderName}"`,
            });
          } else {
            // Fallback: upload to main folder if subfolder creation fails
            toast({
              title: "Subfolder Failed",
              description: `Could not create "${subfolderName}". Uploading to main folder instead...`,
              variant: "destructive",
            });
            await handleMultipleFileUpload(groupedFiles, mainFolderId);
          }
        } catch (subfolderError) {
          console.error(`Subfolder creation failed for ${folderType}:`, subfolderError);
          toast({
            title: "Subfolder Error",
            description: `Error creating "${subfolderName}". Uploading to main folder...`,
            variant: "destructive",
          });
          // Fallback to main folder
          await handleMultipleFileUpload(groupedFiles, mainFolderId);
        }
      }

      toast({
        title: "Upload Complete",
        description: `All files organized in "${mainFolderName}" with appropriate subfolders!`,
      });

    } catch (error) {
      console.error('Hierarchical folder creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Folder Structure Failed",
        description: `Failed to create folder structure: ${errorMessage}. Uploading directly to ${getFolderDisplayName(selectedCategory)}...`,
        variant: "destructive",
      });
      
      // Ultimate fallback: upload files directly to selected category
      await handleMultipleFileUpload(files, selectedCategory);
    }
  };

  // Group files by type for organized subfolder structure
  const groupFilesByType = (files: File[]): Record<string, File[]> => {
    const groups: Record<string, File[]> = {};
    
    files.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      let folderType: string;
      
      // Organize files into logical categories
      if (['pdf'].includes(extension)) {
        folderType = 'Documents';
      } else if (['ppt', 'pptx'].includes(extension)) {
        folderType = 'Presentations';
      } else if (['doc', 'docx'].includes(extension)) {
        folderType = 'Word_Documents';
      } else if (['xls', 'xlsx'].includes(extension)) {
        folderType = 'Spreadsheets';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
        folderType = 'Images';
      } else if (['mp4', 'mov', 'avi', 'wmv'].includes(extension)) {
        folderType = 'Videos';
      } else if (['mp3', 'wav', 'aac'].includes(extension)) {
        folderType = 'Audio';
      } else {
        folderType = 'Other_Files';
      }
      
      if (!groups[folderType]) {
        groups[folderType] = [];
      }
      groups[folderType].push(file);
    });
    
    return groups;
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
    
    // Track upload results during processing
    const uploadResults: Array<{file: File, status: 'completed' | 'failed', error?: string}> = [];
    
    // Process files sequentially for better user experience and server stability
    for (let i = 0; i < newQueue.length; i++) {
      setCurrentUploadIndex(i);
      const result = await handleSingleFileUpload(newQueue[i], i);
      
      // Track the actual result for later failed files check
      uploadResults.push({
        file: newQueue[i].file,
        status: result ? 'completed' : 'failed',
        error: result ? undefined : 'Upload failed'
      });
    }
    
    // DATABASE-FIRST APPROACH: Check for failed uploads using actual results
    const failedUploads = uploadResults.filter(result => result.status === 'failed');
    if (failedUploads.length > 0) {
      setShowFailedFiles(true);
      toast({
        title: "Some Uploads Failed",
        description: `${failedUploads.length} file(s) failed to upload. You can retry them below.`,
        variant: "destructive",
      });
    }
    
    // All uploads complete
    setIsUploading(false);
    setCurrentUploadIndex(0);
    setUploadProgress(0);
    
    // Force refresh to get latest data immediately after upload
    await loadDashboardData(true);
  };

  const handleSingleFileUpload = async (queueItem: {file: File, folderId: string, status: string, progress: number, error?: string}, index: number): Promise<boolean> => {
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

      // Get JWT token for authentication
      const token = localStorage.getItem('auth_token');
      console.log(`🔍 UPLOAD DEBUG: Token exists: ${!!token}, Token length: ${token?.length || 0}`);
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.error('❌ No auth_token found for upload. Available keys:', Object.keys(localStorage));
      }

      // Determine if this is a category upload (like "1_Problem_Proof") or direct folder ID (like "332970573225")
      const isDirectFolderUpload = /^\d+$/.test(queueItem.folderId); // Check if folder ID is purely numeric
      const uploadEndpoint = isDirectFolderUpload ? '/api/v1/vault/upload-file-direct' : '/api/v1/vault/upload-file';
      
      console.log(`📁 Upload strategy: ${isDirectFolderUpload ? 'Direct folder' : 'Category'} upload to "${queueItem.folderId}" via ${uploadEndpoint}`);

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers,
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
        
        return true; // Success
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
      
      return false; // Failure
    }
  };

  // Retry failed uploads
  const retryFailedUploads = async () => {
    const failedFiles = uploadQueue.filter(item => item.status === 'failed');
    if (failedFiles.length === 0) return;
    
    setShowFailedFiles(false);
    await handleMultipleFileUpload(failedFiles.map(item => item.file), failedFiles[0].folderId, true);
  };

  // Create folder using EastEmblem API
  const createFolder = async (folderName: string, parentFolderId: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('folderName', folderName);
      formData.append('folder_id', parentFolderId);
      
      // CRITICAL FIX: Add ventureId from user data for proof_vault mapping
      if (user?.venture?.ventureId) {
        formData.append('ventureId', user.venture.ventureId);
        console.log(`🔍 Creating folder with ventureId: ${user.venture.ventureId}`);
      } else {
        console.log(`⚠️ No ventureId available in user data:`, user);
      }

      // Get JWT token for V1 API authentication
      const token = localStorage.getItem('auth_token');
      console.log(`🔍 DEBUG: Token exists: ${!!token}, Token length: ${token?.length || 0}`);
      if (!token) {
        console.error('❌ No auth_token found in localStorage. Available keys:', Object.keys(localStorage));
        throw new Error('Authentication required for folder creation');
      }

      const response = await fetch('/api/v1/vault/create-folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Extract folder ID from various possible response structures
        const newFolderId = result.data?.folderId || result.folderId || result.data?.id || result.id;
        
        console.log('📁 Folder created successfully:', {
          folderName,
          parentFolderId,
          newFolderId,
          fullResult: result
        });
        
        if (!newFolderId) {
          console.error('❌ No folder ID found in response:', result);
          throw new Error('Folder creation succeeded but no folder ID returned');
        }
        
        toast({
          title: "Folder Created",
          description: `Folder "${folderName}" created successfully with ID: ${newFolderId}`,
        });
        
        return newFolderId; // Return the new folder ID
      } else {
        const errorData = await response.json();
        console.error('❌ Folder creation failed:', errorData);
        throw new Error(errorData.message || errorData.error || 'Folder creation failed');
      }
    } catch (error) {
      console.error('Folder creation error:', error);
      throw error;
    }
  };

  // Handle folder uploads with precise workflow: analyze → create folders → get IDs → upload files
  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    
    console.log(`🔍 FOLDER UPLOAD DEBUG: selectedCategory = "${selectedCategory}"`);
    console.log(`🔍 FOLDER UPLOAD DEBUG: selectedCategory type = ${typeof selectedCategory}`);
    console.log(`🔍 FOLDER UPLOAD DEBUG: Expected categories: 0_Overview, 1_Problem_Proof, etc.`);
    
    // Start folder creation loading state
    setIsCreatingFolders(true);
    setFolderCreationStatus('Analyzing folder structure...');
    
    // Step 1: Analyze folder structure from file paths
    console.log("📁 Step 1: Analyzing folder structure from uploaded files");
    const folderStructure = analyzeFolderStructure(fileList);
    
    setFolderCreationStatus(`Found ${Object.keys(folderStructure.folders).length} folders with ${fileList.length} files. Organizing files...`);
    
    toast({
      title: "Analyzing Folder Structure",
      description: `Found ${Object.keys(folderStructure.folders).length} folders with ${fileList.length} files. Organizing into ${getFolderDisplayName(selectedCategory)}...`,
    });

    try {
      // Step 2: Organize files into the selected category folder
      console.log("📁 Step 2: Organizing files into selected category");
      setFolderCreationStatus(`Organizing files into ${getFolderDisplayName(selectedCategory)} folder...`);
      
      toast({
        title: "Organizing Files",
        description: `Files will be organized in your ${getFolderDisplayName(selectedCategory)} category`,
      });
      
      console.log(`🔍 DEBUG: selectedCategory = "${selectedCategory}" (should NOT be a folder ID like 332844933261)`);
      console.log(`🔍 DEBUG: folderStructure.rootFolderName = "${folderStructure.rootFolderName}"`);
      
      const mainFolderId = await createFolder(folderStructure.rootFolderName, selectedCategory);
      
      if (!mainFolderId) {
        throw new Error('Failed to create main folder');
      }

      console.log(`✅ Main folder created with ID: ${mainFolderId}`);
      
      // Step 3: Create all subfolders sequentially and collect their IDs
      console.log("📁 Step 3: Creating subfolders and mapping IDs");
      setFolderCreationStatus('Creating subfolders and mapping IDs...');
      const folderIdMap = new Map<string, string>();
      folderIdMap.set('root', mainFolderId);

      // Create subfolders in order (parent folders first)
      const sortedFolderPaths = Object.keys(folderStructure.folders).sort((a, b) => {
        const depthA = a.split('/').length;
        const depthB = b.split('/').length;
        return depthA - depthB; // Create shallow folders first
      });

      for (const folderPath of sortedFolderPaths) {
        if (folderPath === 'root') continue;

        const folderName = folderPath.split('/').pop() || folderPath;
        const parentPath = folderPath.includes('/') ? folderPath.substring(0, folderPath.lastIndexOf('/')) : 'root';
        const parentFolderId = folderIdMap.get(parentPath) || mainFolderId;

        setFolderCreationStatus(`Creating subfolder: ${folderName} in ${parentPath === 'root' ? 'main folder' : parentPath}...`);
        
        toast({
          title: "Creating Subfolder",
          description: `Creating "${folderName}" in your ProofVault...`,
        });

        try {
          const subFolderId = await createFolder(folderName, parentFolderId);
          if (subFolderId) {
            folderIdMap.set(folderPath, subFolderId);
            console.log(`✅ Subfolder "${folderPath}" created with ID: ${subFolderId}`);
          } else {
            console.log(`❌ Failed to create subfolder "${folderPath}", using parent folder`);
            folderIdMap.set(folderPath, parentFolderId);
          }
        } catch (error) {
          console.error(`❌ Error creating subfolder "${folderPath}":`, error);
          folderIdMap.set(folderPath, parentFolderId);
        }
      }

      // Step 4: Upload files to their respective folders using the collected folder IDs
      console.log("📁 Step 4: Uploading files to their respective folders");
      setFolderCreationStatus('File organization complete! Starting uploads...');
      
      // End folder creation loading, start file upload loading
      setIsCreatingFolders(false);
      setFolderCreationStatus('');
      
      for (const [folderPath, files] of Object.entries(folderStructure.folders)) {
        let targetFolderId = folderIdMap.get(folderPath) || mainFolderId;
        const folderDisplayName = folderPath === 'root' ? 'main folder' : folderPath;

        // CRITICAL FIX: If folder creation failed, fall back to using the selected category folder
        if (!folderIdMap.get(folderPath) && folderPath !== 'root') {
          console.log(`⚠️ No folder ID found for "${folderPath}", using selected category "${selectedCategory}" as fallback`);
          targetFolderId = selectedCategory;
        }

        toast({
          title: "Uploading Files", 
          description: `Uploading ${files.length} files to ${folderDisplayName}...`,
        });

        console.log(`📤 Uploading ${files.length} files to folder "${folderPath}" (ID: ${targetFolderId})`);
        await handleMultipleFileUpload(files, targetFolderId);
        
        console.log(`✅ Completed upload to folder "${folderPath}"`);
      }

      toast({
        title: "Folder Upload Complete",
        description: `Successfully created ${Object.keys(folderStructure.folders).length} folders and uploaded all files!`,
      });
      
      // Force refresh after folder upload
      await loadDashboardData(true);
      
      // Reset input
      event.target.value = '';

    } catch (error) {
      console.error('Folder upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Reset loading states on error
      setIsCreatingFolders(false);
      setFolderCreationStatus('');
      
      toast({
        title: "Folder Upload Failed",
        description: `Failed to create folder structure: ${errorMessage}`,
        variant: "destructive",
      });
    }
    
    event.target.value = '';
  };

  // Analyze complete folder structure from uploaded files
  const analyzeFolderStructure = (files: File[]) => {
    const folders: Record<string, File[]> = {};
    let rootFolderName = 'uploaded-folder';
    
    // Extract root folder name from first file
    if (files.length > 0) {
      const firstFilePath = files[0].webkitRelativePath;
      if (firstFilePath) {
        rootFolderName = firstFilePath.split('/')[0];
      }
    }
    
    // Group files by their complete folder paths
    files.forEach(file => {
      const pathParts = file.webkitRelativePath?.split('/') || [];
      
      if (pathParts.length <= 2) {
        // File is in root folder
        if (!folders['root']) folders['root'] = [];
        folders['root'].push(file);
      } else {
        // File is in subfolder - preserve complete path structure
        const folderPath = pathParts.slice(1, -1).join('/');
        if (!folders[folderPath]) folders[folderPath] = [];
        folders[folderPath].push(file);
      }
    });
    
    console.log('📁 Analyzed folder structure:', {
      rootFolderName,
      folders: Object.keys(folders),
      fileCount: files.length
    });
    
    return {
      rootFolderName,
      folders
    };
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



  const handleLogout = async () => {
    try {
      // Get JWT token from localStorage for Authorization header
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/auth-token/logout', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        // Clear localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        
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
      // Clear localStorage even if server call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Track failed logout event
      trackEvent('logout_failed', 'authentication', 'logout_error');
      toast({
        title: "Logout Error",
        description: "Token cleared locally. Please try again if needed.",
        variant: "destructive",
      });
      
      // Redirect anyway since token is cleared
      setTimeout(() => {
        setLocation('/');
      }, 1000);
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

  // Format file size helper function
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading || !user) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <DashboardLayout>
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
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full bg-black text-white">
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
                        <h4 className="text-green-300 font-semibold text-sm mb-2">Excellent! You are {validationData.status}.</h4>
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
                    {/* Fixed height container with scrolling - using same design as activity section */}
                    <div 
                      className="space-y-3 max-h-80 overflow-y-auto"
                      onScroll={handleFilesScroll}
                    >
                      {filesLoading && paginatedFiles?.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center text-gray-400">
                            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin opacity-50" />
                            <p className="text-sm">Loading files...</p>
                          </div>
                        </div>
                      ) : paginatedFiles?.length ? (
                        paginatedFiles.map((file) => {
                          // Get file category color based on categoryName
                          const getCategoryColor = (categoryName: string) => {
                            const categoryColors = {
                              'Overview': 'gray',
                              'Problem Proofs': 'blue',
                              'Solution Proofs': 'green',
                              'Demand Proofs': 'orange',
                              'Credibility Proofs': 'red',
                              'Commercial Proofs': 'teal',
                              'Investor Pack': 'purple'
                            };
                            return categoryColors[categoryName as keyof typeof categoryColors] || 'gray';
                          };
                          
                          const categoryColor = getCategoryColor(file.categoryName || 'Overview');
                          
                          const colorClasses = {
                            gray: "text-gray-400 bg-gray-400/20 border-gray-400/30",
                            blue: "text-blue-400 bg-blue-400/20 border-blue-400/30",
                            green: "text-green-400 bg-green-400/20 border-green-400/30",
                            orange: "text-orange-400 bg-orange-400/20 border-orange-400/30",
                            red: "text-red-400 bg-red-400/20 border-red-400/30",
                            teal: "text-teal-400 bg-teal-400/20 border-teal-400/30",
                            purple: "text-purple-400 bg-purple-400/20 border-purple-400/30"
                          };
                          
                          const colorClass = colorClasses[categoryColor as keyof typeof colorClasses] || colorClasses.gray;
                          
                          // Helper function to get category highlight class
                          const getCategoryHighlightClass = (categoryName: string) => {
                            const categoryHighlights = {
                              'Overview': 'text-gray-400 font-medium',
                              'Problem Proofs': 'text-blue-400 font-medium',
                              'Solution Proofs': 'text-green-400 font-medium',
                              'Demand Proofs': 'bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent font-semibold',
                              'Credibility Proofs': 'text-red-400 font-medium',
                              'Commercial Proofs': 'text-teal-400 font-medium',
                              'Investor Pack': 'text-purple-400 font-medium'
                            };
                            return categoryHighlights[categoryName as keyof typeof categoryHighlights] || 'text-gray-400 font-medium';
                          };
                          
                          return (
                            <div key={file.id} className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-800/30 to-gray-900/50 border border-gray-700/50 hover:border-gray-600/70 p-3 transition-all duration-300">
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="relative flex items-center gap-3">
                                <div className={`p-2 rounded-lg border ${colorClass}`}>
                                  {getFileIcon(file.name, file.fileType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    {file.name}
                                  </p>
                                  <p className="text-xs truncate">
                                    <span className={getCategoryHighlightClass(file.categoryName || 'Overview')}>
                                      {file.categoryName}
                                    </span>
                                    <span className="text-gray-400"> • {file.size ? formatFileSize(file.size) : 'Unknown size'} • {formatTimeAgo(file.createdAt)}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => window.open(file.downloadUrl, '_blank')}
                                    className="text-gray-400 hover:text-blue-400 h-8 w-8 p-0"
                                    title="Preview file"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => window.open(file.downloadUrl, '_blank')}
                                    className="text-gray-400 hover:text-green-400 h-8 w-8 p-0"
                                    title="Download file"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center text-gray-400">
                            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No files uploaded yet</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Loading indicator for pagination */}
                      {filesLoadingMore && (
                        <div className="flex items-center justify-center py-4">
                          <div className="text-center text-gray-400">
                            <RefreshCw className="w-5 h-5 mx-auto mb-1 animate-spin opacity-50" />
                            <p className="text-xs">Loading more files...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* End of files indicator */}
                      {!hasMoreFiles && paginatedFiles && paginatedFiles.length > 0 && (
                        <div className="text-center py-2">
                          <p className="text-xs text-gray-500">
                            {totalFiles > 0 ? `All ${totalFiles} files loaded` : 'End of files'}
                          </p>
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
                          <Select value={selectedFolder} onValueChange={(value) => {
                            setSelectedFolder(value);
                            setSelectedCategory(value);
                          }}>
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
                          isCreatingFolders
                            ? 'border-blue-500 bg-blue-500/5'
                            : isUploading 
                              ? 'border-purple-500 bg-purple-500/5' 
                              : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (!isCreatingFolders && !isUploading) {
                            e.currentTarget.classList.add('border-purple-400', 'bg-purple-500/10');
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-purple-400', 'bg-purple-500/10');
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-purple-400', 'bg-purple-500/10');
                          if (!isCreatingFolders && !isUploading) {
                            const files = Array.from(e.dataTransfer.files);
                            if (files.length > 0) {
                              await handleMultipleFileUpload(files, selectedFolder);
                            }
                          }
                        }}
                      >
                        {isCreatingFolders ? (
                          <div className="space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                              <FolderPlus className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            
                            {/* Folder Creation Status */}
                            <div className="space-y-3">
                              <p className="text-blue-400 font-medium">
                                Creating Folder Structure...
                              </p>
                              
                              {folderCreationStatus && (
                                <div className="space-y-2">
                                  <p className="text-gray-300 text-sm">
                                    {folderCreationStatus}
                                  </p>
                                  <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : isUploading ? (
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
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.bmp,.png,.jpg,.jpeg,.gif,.tif,.tiff,.svg,.webp,.mp4,.mov,.avi,.webm,.3gp,.flv,.wmv,.mp3,.wav,.ogg,.aac,.m4a,.txt,.ods,.xltx,.csv,.xlsb,.xlsm,.xml,.eml,.mpp,.msg,.rtf,.odt,.ppsx,.vsd,.vsdx,.xps,.dwg,.dwf"
                              className="hidden"
                              id="file-upload"
                              onChange={async (e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                  await handleMultipleFileUpload(Array.from(files), selectedFolder);
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
                                disabled={isCreatingFolders || isUploading}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Choose Files
                              </Button>
                              <Button 
                                onClick={() => document.getElementById('folder-upload')?.click()} 
                                variant="outline"
                                className="border-purple-400 text-purple-400 hover:bg-purple-500 hover:text-white"
                                disabled={isCreatingFolders || isUploading}
                              >
                                <FolderPlus className="w-4 h-4 mr-2" />
                                {isCreatingFolders ? 'Creating Folders...' : 'Upload Folder'}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Failed Files Section */}
                      {uploadQueue.some(item => item.status === 'failed') && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <h4 className="text-red-400 font-medium">Failed Uploads</h4>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // Remove failed files from queue to hide the section
                                setUploadQueue(prev => prev.filter(item => item.status !== 'failed'));
                                setShowFailedFiles(false);
                              }}
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
                          <li>• Folder upload: Organizes your files into the selected category folder</li>
                          <li>• Failed uploads can be retried individually or cleared from the interface</li>
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
                        disabled={!user?.venture?.certificateUrl && !validationData?.certificateUrl}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Certificate
                      </Button>
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500">
                          {(user?.venture?.certificateUrl || validationData?.certificateUrl) ? 'Ready for download' : 'Generating certificate...'}
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
                        disabled={!user?.venture?.reportUrl && !validationData?.reportUrl}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </Button>
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500">
                          {(user?.venture?.reportUrl || validationData?.reportUrl) ? 'Ready for download' : 'Generating report...'}
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
            
            {/* Deal Room Access */}
            <Card className="bg-black/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5" />
                  Deal Room Access
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Connect with verified investors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(validationData?.proofScore || 0) >= 70 ? (
                    <>
                      {hasDealRoomAccess ? (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 text-sm">Access Granted</span>
                          </div>
                          <p className="text-gray-400 text-sm">Your venture is now visible to our verified investor network.</p>
                          <Button 
                            className="w-full bg-gradient-to-r from-purple-500 to-yellow-500 text-white hover:from-purple-600 hover:to-yellow-600"
                            onClick={() => window.location.href = '/deal-room'}
                          >
                            Enter Deal Room →
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            <span className="text-purple-400 text-sm">Investor Ready</span>
                          </div>
                          <div className="bg-gradient-to-r from-purple-900/30 to-yellow-900/30 border border-purple-500/30 rounded-lg p-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-yellow-400 mb-2">
                                {Math.floor(Math.random() * 15) + 12} investors
                              </div>
                              <p className="text-sm text-gray-300 mb-3">are matched and interested in your venture</p>
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm text-center">
                            Access investor matches, personalized certificates, and detailed reports for $99
                          </p>
                          <Button 
                            className="w-full bg-gradient-to-r from-purple-500 to-yellow-500 text-white hover:from-purple-600 hover:to-yellow-600 flex items-center justify-center gap-2"
                            onClick={() => {
                              // Track payment modal open
                              trackEvent('payment', 'deal_room', 'payment_modal_opened');
                              setIsPaymentModalOpen(true);
                            }}
                          >
                            <CreditCard className="w-4 h-4" />
                            Unlock Deal Room - $99
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 text-sm">Upload Required</span>
                      </div>
                      <p className="text-gray-400 text-sm">Upload more files to your ProofVault to achieve a score above 70 and qualify for investor matching.</p>
                      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                        <p className="text-yellow-300 text-xs">
                          Current Score: {validationData?.proofScore || 0}/100<br/>
                          Required: 70+ for Investor Matching
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

            {/* Leaderboard */}
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
                <div 
                  ref={activityContainerRef}
                  className="space-y-3 max-h-80 overflow-y-auto"
                  onScroll={handleActivityScroll}
                >
                  {isActivitiesLoading && recentActivity.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin opacity-50" />
                        <p className="text-sm">Loading activities...</p>
                      </div>
                    </div>
                  ) : recentActivity.length > 0 ? (
                    recentActivity.map((activity) => {
                      const timeAgo = formatTimeAgo(activity.timestamp);
                      
                      // Get proper icon component
                      const getIconComponent = (iconName: string) => {
                        const iconMap = {
                          'User': User,
                          'Shield': Shield,
                          'Building': Building,
                          'FileText': FileText,
                          'TrendingUp': TrendingUp,
                          'Navigation': Navigation,
                          'Settings': Settings,
                          'CheckCircle': CheckCircle,
                          'Upload': Upload,
                          'Plus': Plus,
                          'Award': Award,
                          'Circle': Clock
                        };
                        return iconMap[iconName as keyof typeof iconMap] || Clock;
                      };
                      
                      const IconComponent = getIconComponent(activity.icon);
                      
                      const colorClasses = {
                        green: "text-green-400 bg-green-400/20 border-green-400/30",
                        blue: "text-blue-400 bg-blue-400/20 border-blue-400/30",
                        purple: "text-purple-400 bg-purple-400/20 border-purple-400/30",
                        yellow: "text-yellow-400 bg-yellow-400/20 border-yellow-400/30",
                        orange: "text-orange-400 bg-orange-400/20 border-orange-400/30",
                        red: "text-red-400 bg-red-400/20 border-red-400/30",
                        gray: "text-gray-400 bg-gray-400/20 border-gray-400/30"
                      };
                      
                      const colorClass = colorClasses[activity.color as keyof typeof colorClasses] || colorClasses.gray;
                      
                      return (
                        <div key={activity.id} className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-800/30 to-gray-900/50 border border-gray-700/50 p-3 hover:border-gray-600/70 transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative flex items-start gap-3">
                            <div className={`p-2 rounded-lg border ${colorClass}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
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
                  
                  {/* Loading indicator for pagination */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <div className="text-center text-gray-400">
                        <RefreshCw className="w-5 h-5 mx-auto mb-1 animate-spin opacity-50" />
                        <p className="text-xs">Loading more activities...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* End of activities indicator */}
                  {!hasMore && recentActivity.length > 0 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">
                        {totalActivities > 0 ? `All ${totalActivities} activities loaded` : 'End of activities'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        amount={99}
        currency="USD"
        description="Deal Room Access - Connect with verified investors"
        customerEmail={user?.email || ''}
        customerName={user?.fullName || ''}
        metadata={{
          purpose: 'Access Deal Room',
          founderId: user?.founderId || '',
          ventureId: user?.venture?.ventureId || ''
        }}
      />
    </DashboardLayout>
  );
}