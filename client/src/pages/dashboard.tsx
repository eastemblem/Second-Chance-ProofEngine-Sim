import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Medal
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface User {
  founderId: string;
  email: string;
  isAuthenticated: boolean;
  fullName?: string;
  venture?: {
    name: string;
    certificateUrl?: string;
    reportUrl?: string;
  };
}

interface ProofVaultData {
  overviewCount: number;
  problemProofCount: number;
  solutionProofCount: number;
  demandProofCount: number;
  totalFiles: number;
  files: FileItem[];
}

interface FileItem {
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  size: string;
  downloadUrl: string;
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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [proofVaultData, setProofVaultData] = useState<ProofVaultData | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
    loadDashboardData();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setLocation('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setLocation('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load validation data (ProofScore, ProofTags, etc.)
      const validationResponse = await fetch('/api/dashboard/validation');
      if (validationResponse.ok) {
        const validation = await validationResponse.json();
        setValidationData(validation);
      }

      // Load ProofVault data (file counts, file lists)
      const vaultResponse = await fetch('/api/dashboard/vault');
      if (vaultResponse.ok) {
        const vault = await vaultResponse.json();
        setProofVaultData(vault);
      }

      // Load recent activity data
      const activityResponse = await fetch('/api/dashboard/activity');
      if (activityResponse.ok) {
        const activity = await activityResponse.json();
        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Dashboard data load error:', error);
      // Set fallback data for demo purposes
      setValidationData({
        proofScore: 85,
        proofTagsUnlocked: 11,
        totalProofTags: 21,
        filesUploaded: 0,
        status: "Excellent! You're investor-ready. Your data room is now visible to our verified investor network."
      });
      
      setProofVaultData({
        overviewCount: 0,
        problemProofCount: 0,
        solutionProofCount: 0,
        demandProofCount: 0,
        totalFiles: 0,
        files: []
      });
      
      setRecentActivity([
        {
          id: "activity-1",
          type: "account",
          title: "Email verified successfully",
          description: "Your email has been verified and account is active",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: "check",
          color: "green"
        },
        {
          id: "activity-2",
          type: "platform",
          title: "Joined Second Chance platform",
          description: "Welcome to the startup validation ecosystem",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          icon: "user-plus",
          color: "purple"
        }
      ]);
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
        window.open(user.venture.certificateUrl, '_blank');
        toast({
          title: "Certificate Downloaded",
          description: `Your ${user.venture.name} certificate has been opened.`,
        });
      } else {
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
        window.open(user.venture.reportUrl, '_blank');
        toast({
          title: "Report Downloaded",
          description: `Your ${user.venture.name} analysis report has been opened.`,
        });
      } else {
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

  const handleFileUpload = async (file: File, folderId: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder_id', folderId);

      const response = await fetch('/api/vault/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "File Uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
        loadDashboardData(); // Refresh data
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload file. Please try again.",
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
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
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome {user?.fullName || user?.email?.split('@')[0] || 'Founder'}</h1>
              <p className="text-gray-400">
                {user?.venture?.name || 'Your Venture'} Dashboard
                {user?.totalVentures && user.totalVentures > 1 && (
                  <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                    Latest of {user.totalVentures} ventures
                  </span>
                )}
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
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5" />
                  Validation Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  {/* ProofScore Circle */}
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{validationData?.proofScore || 85}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">ProofScore</p>
                  </div>

                  {/* ProofTags */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{validationData?.proofTagsUnlocked || 11}</div>
                    <p className="text-gray-400 text-sm mb-2">ProofTags Unlocked</p>
                    <Progress value={((validationData?.proofTagsUnlocked || 11) / (validationData?.totalProofTags || 21)) * 100} className="h-2" />
                  </div>

                  {/* Files Uploaded */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-500 mb-2">{validationData?.filesUploaded || proofVaultData?.totalFiles || 0}</div>
                    <p className="text-gray-400 text-sm">Files Uploaded</p>
                  </div>
                </div>

                {validationData?.status && (
                  <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                    <p className="text-green-400 text-sm flex items-start gap-2">
                      <Award className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {validationData.status}
                    </p>
                  </div>
                )}


              </CardContent>
            </Card>

            {/* Certificate & Report Downloads */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-yellow-500 shadow-lg">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  Downloads
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Access your validation certificate and detailed analysis report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Certificate Download */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl blur-xl group-hover:blur-sm transition-all duration-300"></div>
                    <div className="relative p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-xl hover:border-purple-400/50 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Award className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Certificate</h3>
                          <p className="text-purple-300 text-sm">ProofScore Validation</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">
                        Official certificate confirming your venture's validation score and achievements.
                      </p>
                      <Button 
                        onClick={handleDownloadCertificate} 
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Certificate
                      </Button>
                    </div>
                  </div>

                  {/* Report Download */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 rounded-xl blur-xl group-hover:blur-sm transition-all duration-300"></div>
                    <div className="relative p-6 bg-gradient-to-br from-yellow-900/30 to-amber-800/20 border border-yellow-500/30 rounded-xl hover:border-yellow-400/50 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-yellow-500/20">
                          <FileText className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Analysis Report</h3>
                          <p className="text-yellow-300 text-sm">Detailed Insights</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">
                        Comprehensive analysis with actionable insights and recommendations for improvement.
                      </p>
                      <Button 
                        onClick={handleDownloadReport} 
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download Report
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Additional Download Info */}
                <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-green-500/20">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm mb-1">Ready for Download</h4>
                      <p className="text-gray-400 text-xs">
                        Your validation documents are automatically generated after completing the analysis. 
                        Certificate includes ProofScore and ProofTags achievements. Report contains detailed breakdown and investor feedback.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ProofVault Management */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FolderOpen className="w-5 h-5" />
                  ProofVault Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                    <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Overview</TabsTrigger>
                    <TabsTrigger value="files" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Files</TabsTrigger>
                    <TabsTrigger value="upload" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Upload</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-white mb-1">{proofVaultData?.overviewCount || 0}</div>
                        <p className="text-gray-400 text-sm">Overview</p>
                      </div>
                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-white mb-1">{proofVaultData?.problemProofCount || 0}</div>
                        <p className="text-gray-400 text-sm">Problem Proof</p>
                      </div>
                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-white mb-1">{proofVaultData?.solutionProofCount || 0}</div>
                        <p className="text-gray-400 text-sm">Solution Proof</p>
                      </div>
                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-white mb-1">{proofVaultData?.demandProofCount || 0}</div>
                        <p className="text-gray-400 text-sm">Demand Proof</p>
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
                                <p className="text-gray-400 text-sm">{file.category} • {file.size} • {file.uploadDate}</p>
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
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-300 mb-4">Drag and drop files here or click to browse</p>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            Array.from(files).forEach(file => {
                              handleFileUpload(file, 'overview'); // Default to overview folder
                            });
                          }
                        }}
                      />
                      <Button onClick={() => document.getElementById('file-upload')?.click()} className="bg-gradient-to-r from-purple-500 to-yellow-500 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Leaderboard - Top Right */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-amber-500 shadow-lg">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                Leaderboard
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Top performing ventures by ProofScore validation
              </p>
              
              <div className="space-y-2">
                {[
                  { rank: 1, name: "Alex Chen", venture: "TechFlow", score: 92, isCurrentUser: false },
                  { rank: 2, name: "Sarah Kim", venture: "EcoSmart", score: 89, isCurrentUser: false },
                  { rank: 3, name: "You", venture: user?.venture?.name || 'Your Venture', score: 85, isCurrentUser: true },
                  { rank: 4, name: "Michael Park", venture: "DataViz", score: 82, isCurrentUser: false },
                  { rank: 5, name: "Lisa Wang", venture: "HealthTech", score: 78, isCurrentUser: false }
                ].map((entry) => {
                  const isTopThree = entry.rank <= 3;
                  
                  return (
                    <div
                      key={entry.rank}
                      className={`relative transition-all duration-300 rounded-xl overflow-hidden ${
                        entry.isCurrentUser 
                          ? 'bg-gradient-to-r from-violet-500/20 to-amber-500/20 border-2 border-transparent shadow-lg shadow-violet-500/25' 
                          : isTopThree
                          ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-400/30 shadow-md'
                          : 'bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/20'
                      }`}
                    >
                      {entry.isCurrentUser && (
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
                              entry.isCurrentUser ? 'text-violet-300' : 'text-white'
                            }`}>
                              {entry.name}
                            </h4>
                            {entry.isCurrentUser && (
                              <span className="px-1.5 py-0.5 text-xs bg-gradient-to-r from-violet-500 to-amber-500 text-white rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{entry.venture}</p>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            entry.isCurrentUser ? 'text-violet-400' : isTopThree ? 'text-amber-400' : 'text-gray-300'
                          }`}>
                            {entry.score}
                          </div>
                          <div className="text-xs text-gray-500">ProofScore</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deal Room Access */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5" />
                  Deal Room Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(validationData?.proofScore || 85) >= 90 ? (
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
                          Current Score: {validationData?.proofScore || 85}/100<br/>
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
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
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
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                          <div className={`w-2 h-2 rounded-full ${colorClasses[activity.color as keyof typeof colorClasses] || 'bg-gray-400'} mt-2 flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium">{activity.title}</p>
                            <p className="text-gray-400 text-xs truncate">{activity.description}</p>
                            <p className="text-gray-500 text-xs mt-1">{timeAgo}</p>
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
    </div>
  );
}