import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import ProgressBar from "@/components/progress-bar";
import SimpleFileUpload from "@/components/simple-file-upload";
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

  const handleFileUploaded = (fileData: {id: string, name: string, category: string, sessionFolder?: string}) => {
    setUploadedFiles(prev => [...prev, fileData]);
    if (fileData.sessionFolder && !sessionFolderId) {
      setSessionFolderId(fileData.sessionFolder);
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

      // Generate shareable links for uploaded files
      let shareableLinks = {};
      if (sessionFolderId && uploadedFiles.length > 0) {
        try {
          const linkResponse = await fetch('/api/box/generate-links', {
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
            console.log('Generated shareable links:', shareableLinks);
          }
        } catch (error) {
          console.error('Error generating shareable links:', error);
        }
      }

      // Update venture with shareable links
      if (shareableLinks && Object.keys(shareableLinks).length > 0) {
        try {
          const updateData: any = {};
          if ((shareableLinks as any).dataRoomUrl) {
            updateData.dataRoom = (shareableLinks as any).dataRoomUrl;
          }
          if ((shareableLinks as any).pitchDeckUrl) {
            updateData.pitchDeck = (shareableLinks as any).pitchDeckUrl;
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

              {/* Box Integration for File Uploads */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Document Upload</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your documents to secure Box storage for verification
                  </p>
                  
                  <div className="space-y-4">
                    <SimpleFileUpload
                      title="Pitch Deck"
                      description="Upload your investor presentation (PDF or PowerPoint)"
                      accept=".pdf,.ppt,.pptx"
                      allowedTypes={[
                        'application/pdf',
                        'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                      ]}
                      category="pitch-deck"
                      userId={formData.userId?.toString()}
                      startupName={formData.startupName}
                      disabled={!isFormValid}
                      onFileUploaded={handleFileUploaded}
                    />
                    
                    <SimpleFileUpload
                      title="Data Room Documents"
                      description="Upload financial models, market research, and other supporting documents"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      category="data-room"
                      userId={formData.userId?.toString()}
                      startupName={formData.startupName}
                      disabled={!isFormValid}
                      onFileUploaded={handleFileUploaded}
                    />
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
