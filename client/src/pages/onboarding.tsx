import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import ProgressBar from "@/components/progress-bar";
import BoxIntegrationStatus from "@/components/box-integration-status";
import { Upload, CheckCircle, FileText, Loader2 } from "lucide-react";

import { FounderData } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingPageProps {
  onNext: () => void;
  onDataUpdate: (data: Partial<FounderData>) => void;
}

export default function OnboardingPage({ onNext, onDataUpdate }: OnboardingPageProps) {
  const [formData, setFormData] = useState<Partial<FounderData>>({
    acceleratorApplications: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Check if required fields are completed for file uploads
  const isFormValid = formData.name && formData.email && formData.startupName && formData.stage;
  
  // Track uploaded files for shareable link generation
  const [uploadedFiles, setUploadedFiles] = useState<{id: string, name: string, category: string, sessionFolder?: string}[]>([]);
  const [sessionFolderId, setSessionFolderId] = useState<string>('');
  const [fileUploads, setFileUploads] = useState<{[key: string]: { file: File | null, uploading: boolean, uploaded: boolean }}>({
    'pitch-deck': { file: null, uploading: false, uploaded: false },
    'data-room': { file: null, uploading: false, uploaded: false }
  });

  const handleFileSelect = (category: string, file: File | null) => {
    setFileUploads(prev => ({
      ...prev,
      [category]: { ...prev[category], file, uploaded: false }
    }));
  };

  const handleFileUpload = async (category: string) => {
    const upload = fileUploads[category];
    if (!upload.file || !formData.startupName) return;

    setFileUploads(prev => ({
      ...prev,
      [category]: { ...prev[category], uploading: true }
    }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', upload.file);
      formDataUpload.append('startupName', formData.startupName);
      formDataUpload.append('category', category);

      const response = await fetch('/api/box/jwt/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadedFiles(prev => [...prev, {
          id: result.file.id,
          name: result.file.name,
          category: category,
          sessionFolder: result.sessionFolder
        }]);
        
        if (result.sessionFolder && !sessionFolderId) {
          setSessionFolderId(result.sessionFolder);
        }

        setFileUploads(prev => ({
          ...prev,
          [category]: { ...prev[category], uploading: false, uploaded: true }
        }));

        toast({
          title: "Upload successful",
          description: `${upload.file.name} has been uploaded to Box.com`,
        });
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      setFileUploads(prev => ({
        ...prev,
        [category]: { ...prev[category], uploading: false }
      }));
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: "destructive",
      });
    }
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return await res.json();
    },
  });

  // Create venture mutation
  const createVentureMutation = useMutation({
    mutationFn: async (ventureData: any) => {
      const res = await apiRequest("POST", "/api/ventures", ventureData);
      return await res.json();
    },
  });

  const updateField = (field: keyof FounderData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataUpdate(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.startupName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Split name into first and last name
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create user
      const userData = {
        firstName,
        lastName,
        email: formData.email,
      };

      const user = await createUserMutation.mutateAsync(userData);

      // Create venture
      const ventureData = {
        name: formData.startupName,
        ownerId: user.id,
        stage: formData.stage,
        description: `Venture in ${formData.stage} stage`,
        teamSize: 1,
      };

      const venture = await createVentureMutation.mutateAsync(ventureData);

      // Generate shareable links for uploaded files using Development service
      let shareableLinks = {};
      if (sessionFolderId && uploadedFiles.length > 0) {
        try {
          const linkResponse = await fetch('/api/box/development/generate-links', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionFolderId,
              uploadedFiles,
            }),
          });
          
          if (linkResponse.ok) {
            shareableLinks = await linkResponse.json();
            console.log('Generated shareable links via Development service:', shareableLinks);
          }
        } catch (error) {
          console.error('Error generating shareable links via Development service:', error);
        }
      }

      // Update venture with shareable links
      if (shareableLinks && Object.keys(shareableLinks).length > 0) {
        try {
          const updateData: any = {};
          if ((shareableLinks as any).dataRoomUrl) {
            updateData.dataRoomUrl = (shareableLinks as any).dataRoomUrl;
          }
          if ((shareableLinks as any).pitchDeckUrl) {
            updateData.pitchDeckUrl = (shareableLinks as any).pitchDeckUrl;
          }
          
          if (Object.keys(updateData).length > 0) {
            const updateResponse = await fetch(`/api/ventures/${venture.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updateData),
            });
            
            if (updateResponse.ok) {
              console.log('Updated venture with shareable links');
            } else {
              console.error('Failed to update venture with shareable links');
            }
          }
        } catch (error) {
          console.error('Error updating venture with shareable links:', error);
        }
      }

      // Store user and venture IDs for later use
      const enhancedData = {
        ...formData,
        userId: user.id,
        ventureId: venture.id,
        pitchDeck: (shareableLinks as any)?.pitchDeckUrl || '',
        dataRoom: (shareableLinks as any)?.dataRoomUrl || '',
      };
      
      setFormData(enhancedData);
      onDataUpdate(enhancedData);

      toast({
        title: "Profile Created",
        description: "Your founder profile has been saved successfully",
      });

      onNext();
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: "Failed to create your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProgressBar currentStep={1} totalSteps={4} stepName="Founder Profile" />
          
          <BoxIntegrationStatus />

          <Card className="p-8 border-border bg-card">
            <h2 className="text-3xl font-bold mb-2">Tell us about your venture</h2>
            <p className="text-muted-foreground mb-8">
              We'll use this information to generate your personalized ProofScore
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Founder Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Founder Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="bg-background border-border"
                    value={formData.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@startup.com"
                    className="bg-background border-border"
                    value={formData.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Startup Details */}
              <div>
                <Label htmlFor="startupName">Startup Name *</Label>
                <Input
                  id="startupName"
                  type="text"
                  placeholder="TechCorp Inc."
                  className="bg-background border-border"
                  value={formData.startupName || ""}
                  onChange={(e) => updateField("startupName", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Current Stage</Label>
                  <Select onValueChange={(value) => updateField("stage", value)}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea Stage</SelectItem>
                      <SelectItem value="mvp">MVP/Prototype</SelectItem>
                      <SelectItem value="traction">Early Traction</SelectItem>
                      <SelectItem value="growth">Growth Stage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="acceleratorApps">Accelerator Applications</Label>
                  <Input
                    id="acceleratorApps"
                    type="number"
                    placeholder="0"
                    min="0"
                    className="bg-background border-border"
                    value={formData.acceleratorApplications || 0}
                    onChange={(e) => updateField("acceleratorApplications", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Document Upload</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your documents to secure Box storage for verification
                  </p>
                  
                  <div className="space-y-4">
                    {/* Pitch Deck Upload */}
                    <Card className={`transition-all ${fileUploads['pitch-deck'].uploaded ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {fileUploads['pitch-deck'].uploaded ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-500" />
                          )}
                          <h3 className="font-semibold">Pitch Deck</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Upload your investor presentation (PDF or PowerPoint)</p>
                        
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            id="pitch-deck-upload"
                            accept=".pdf,.ppt,.pptx"
                            onChange={(e) => handleFileSelect('pitch-deck', e.target.files?.[0] || null)}
                            disabled={!isFormValid || fileUploads['pitch-deck'].uploading}
                            className="hidden"
                          />
                          <label
                            htmlFor="pitch-deck-upload"
                            className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                              !isFormValid || fileUploads['pitch-deck'].uploading
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                            }`}
                          >
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">
                              {fileUploads['pitch-deck'].file ? fileUploads['pitch-deck'].file.name : 'Choose pitch deck file'}
                            </span>
                          </label>
                          
                          {fileUploads['pitch-deck'].file && (
                            <Button
                              onClick={() => handleFileUpload('pitch-deck')}
                              disabled={!isFormValid || fileUploads['pitch-deck'].uploading || fileUploads['pitch-deck'].uploaded}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {fileUploads['pitch-deck'].uploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : fileUploads['pitch-deck'].uploaded ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Uploaded
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload to Box
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Data Room Upload */}
                    <Card className={`transition-all ${fileUploads['data-room'].uploaded ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {fileUploads['data-room'].uploaded ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-500" />
                          )}
                          <h3 className="font-semibold">Data Room Documents</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Upload financial models, market research, and other supporting documents</p>
                        
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            id="data-room-upload"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                            onChange={(e) => handleFileSelect('data-room', e.target.files?.[0] || null)}
                            disabled={!isFormValid || fileUploads['data-room'].uploading}
                            className="hidden"
                          />
                          <label
                            htmlFor="data-room-upload"
                            className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                              !isFormValid || fileUploads['data-room'].uploading
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                            }`}
                          >
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">
                              {fileUploads['data-room'].file ? fileUploads['data-room'].file.name : 'Choose data room file'}
                            </span>
                          </label>
                          
                          {fileUploads['data-room'].file && (
                            <Button
                              onClick={() => handleFileUpload('data-room')}
                              disabled={!isFormValid || fileUploads['data-room'].uploading || fileUploads['data-room'].uploaded}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {fileUploads['data-room'].uploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : fileUploads['data-room'].uploaded ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Uploaded
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload to Box
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full gradient-button py-6 text-lg"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Profile..." : "Submit for Scoring"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
