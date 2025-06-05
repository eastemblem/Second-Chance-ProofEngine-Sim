import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Folder, FileText, DollarSign, Users, BarChart, Shield, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataRoomUploadProps {
  userId?: string;
  accessToken?: string;
}

const documentCategories = [
  {
    id: 'financial',
    name: 'Financial Documents',
    icon: DollarSign,
    description: 'Financial statements, projections, cap table',
    accepts: '.pdf,.xlsx,.xls,.csv',
    types: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv']
  },
  {
    id: 'legal',
    name: 'Legal Documents',
    icon: Shield,
    description: 'Contracts, IP, corporate structure',
    accepts: '.pdf,.doc,.docx',
    types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  {
    id: 'team',
    name: 'Team & HR',
    icon: Users,
    description: 'Team bios, org chart, employee agreements',
    accepts: '.pdf,.doc,.docx,.jpg,.png',
    types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
  },
  {
    id: 'market',
    name: 'Market Research',
    icon: BarChart,
    description: 'Market analysis, competitive research, customer data',
    accepts: '.pdf,.xlsx,.ppt,.pptx',
    types: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
  }
];

export default function DataRoomUpload({ userId, accessToken }: DataRoomUploadProps) {
  const [activeCategory, setActiveCategory] = useState('financial');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: any[]}>({
    financial: [],
    legal: [],
    team: [],
    market: []
  });
  const [needsAuth, setNeedsAuth] = useState(!accessToken);
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const { toast } = useToast();

  const handleBoxAuth = async () => {
    try {
      const response = await fetch('/api/box/auth-url');
      const data = await response.json();
      
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=600,height=700');
        toast({
          title: "Box Authentication Required",
          description: "Please complete authentication to upload documents.",
        });
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Could not connect to Box. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    if (!accessToken) {
      setNeedsAuth(true);
      return;
    }

    // Validate file type for the specific category
    const categoryData = documentCategories.find(cat => cat.id === category);
    if (categoryData && !categoryData.types.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: `Please upload a file type supported for ${categoryData.name}.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('document', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`/api/box/upload/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (result.success) {
        setUploadedFiles(prev => ({
          ...prev,
          [category]: [...prev[category], {
            id: result.file.id,
            name: result.file.name,
            type: category,
            uploadedAt: new Date().toISOString()
          }]
        }));

        toast({
          title: "Document Uploaded Successfully",
          description: `${file.name} has been securely stored in your data room.`,
        });

        // Reset file input
        if (fileInputRefs.current[category]) {
          fileInputRefs.current[category]!.value = '';
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const totalFiles = Object.values(uploadedFiles).reduce((sum, files) => sum + files.length, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-primary-gold" />
          Data Room
        </CardTitle>
        <CardDescription>
          Organize and upload investor documents by category
        </CardDescription>
        {totalFiles > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            {totalFiles} document{totalFiles !== 1 ? 's' : ''} uploaded
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {needsAuth ? (
          <div className="text-center space-y-4">
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-800">
                Connect to Box to securely organize your data room
              </p>
            </div>
            <Button onClick={handleBoxAuth} className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect to Box
            </Button>
          </div>
        ) : (
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-4">
              {documentCategories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="text-xs"
                >
                  <category.icon className="w-3 h-3 mr-1" />
                  {category.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {documentCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <category.icon className="w-4 h-4 text-primary-gold" />
                    {category.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary-gold/30 rounded-lg cursor-pointer bg-primary-gold/5 hover:bg-primary-gold/10 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-primary-gold" />
                      <p className="mb-2 text-sm text-foreground">
                        <span className="font-semibold">Upload {category.name.toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported: {category.accepts.replace(/\./g, '').toUpperCase()} (MAX. 25MB)
                      </p>
                    </div>
                    <input 
                      ref={el => fileInputRefs.current[category.id] = el}
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, category.id)}
                      accept={category.accepts}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading to Box...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {uploadedFiles[category.id].length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Uploaded Documents</h5>
                    {uploadedFiles[category.id].map((file, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">{file.name}</p>
                          <p className="text-xs text-green-600">
                            Uploaded {new Date(file.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}