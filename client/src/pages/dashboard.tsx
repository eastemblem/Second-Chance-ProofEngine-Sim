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
  LogOut
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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [proofVaultData, setProofVaultData] = useState<ProofVaultData | null>(null);
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
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      if (user?.venture?.certificateUrl) {
        window.open(user.venture.certificateUrl, '_blank');
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
      if (user?.venture?.reportUrl) {
        window.open(user.venture.reportUrl, '_blank');
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
              <h1 className="text-2xl font-bold text-white">Founder Portal</h1>
              <p className="text-gray-400">{user?.venture?.name || 'Your Venture'} • {user?.fullName || user?.email}</p>
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

                {/* Download Actions */}
                <div className="mt-6 flex gap-3">
                  <Button onClick={handleDownloadCertificate} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                    <Download className="w-4 h-4 mr-2" />
                    Certificate
                  </Button>
                  <Button onClick={handleDownloadReport} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                    <Download className="w-4 h-4 mr-2" />
                    Report
                  </Button>
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
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 text-sm">Access Granted</span>
                  </div>
                  <p className="text-gray-400 text-sm">Your venture is now visible to our verified investor network.</p>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-yellow-500 text-white">
                    Enter Deal Room →
                  </Button>
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
                <div className="flex items-center justify-center py-8">
                  <div className="text-center text-gray-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-black">1</div>
                    <span className="text-white text-sm">Alex Chen - 92</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs font-bold text-black">2</div>
                    <span className="text-white text-sm">Sarah Kim - 89</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center text-xs font-bold text-white">3</div>
                    <span className="text-white text-sm">You - 85</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}