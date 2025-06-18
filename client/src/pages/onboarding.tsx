import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import ProgressBar from "@/components/progress-bar";
import FileUpload from "@/components/file-upload";
import { FounderData } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingPageProps {
  onNext: () => void;
  onDataUpdate: (data: Partial<FounderData>) => void;
}

export default function OnboardingPage({
  onNext,
  onDataUpdate,
}: OnboardingPageProps) {
  const [formData, setFormData] = useState<Partial<FounderData>>({
    acceleratorApplications: 0,
    fullName: "",
    email: "",
    startupName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Create founder mutation
  const createFounderMutation = useMutation({
    mutationFn: async (founderData: any) => {
      const res = await apiRequest("POST", "/api/founders", founderData);
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

    if (!formData.fullName || !formData.email || !formData.startupName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create founder
      const founderData = {
        fullName: formData.fullName,
        email: formData.email,
        positionRole: "Founder",
      };

      const founder = await createFounderMutation.mutateAsync(founderData);

      // Create venture
      const ventureData = {
        name: formData.startupName,
        founderId: founder.founderId,
        industry: "Technology",
        geography: "Global", 
        businessModel: "SaaS",
        revenueStage: "Pre-Revenue",
        mvpStatus: "Prototype",
      };

      const venture = await createVentureMutation.mutateAsync(ventureData);

      // // Create startup vault using EastEmblem API
      // if (formData.startupName) {
      //   console.log("Creating startup vault for:", formData.startupName);

      //   try {
      //     const vaultResponse = await fetch("/api/vault/create-startup-vault", {
      //       method: "POST",
      //       headers: {
      //         "Content-Type": "application/json",
      //       },
      //       body: JSON.stringify({
      //         startupName: formData.startupName,
      //       }),
      //     });

      //     const vaultResult = await vaultResponse.json();

      //     if (vaultResult.success) {
      //       console.log("Startup vault created successfully:", vaultResult);

      //       toast({
      //         title: "ProofVault Created",
      //         description: `Professional document structure created for ${formData.startupName}`,
      //       });
      //     } else {
      //       console.warn("Vault creation failed:", vaultResult);
      //     }
      //   } catch (vaultError) {
      //     console.error("Vault creation error:", vaultError);
      //   }
      // }

      // Store founder and venture IDs for later use
      const enhancedData = {
        ...formData,
        founderId: founder.founderId,
        ventureId: venture.ventureId,
      };

      // Store onboarding data in session for use throughout the app
      try {
        const sessionResponse = await fetch("/api/onboarding/store", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(enhancedData),
        });

        const sessionResult = await sessionResponse.json();
        
        if (sessionResult.success) {
          console.log("Onboarding data stored in session successfully");
        } else {
          console.warn("Failed to store onboarding data in session:", sessionResult);
        }
      } catch (sessionError) {
        console.error("Error storing onboarding data in session:", sessionError);
      }

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
          <ProgressBar
            currentStep={1}
            totalSteps={4}
            stepName="Founder Profile"
          />

          <Card className="p-8 border-border bg-card">
            <h2 className="text-3xl font-bold mb-2">
              Tell us about your venture
            </h2>
            <p className="text-muted-foreground mb-8">
              We'll use this information to generate your personalized
              ProofScore
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Founder Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName">Founder Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    className="bg-background border-border"
                    value={formData.fullName || ""}
                    onChange={(e) => updateField("fullName", e.target.value)}
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
                  <Select
                    onValueChange={(value) => updateField("stage", value)}
                  >
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
                  <Label htmlFor="acceleratorApps">
                    Accelerator Applications
                  </Label>
                  <Input
                    id="acceleratorApps"
                    type="number"
                    placeholder="0"
                    min="0"
                    className="bg-background border-border"
                    value={formData.acceleratorApplications || 0}
                    onChange={(e) =>
                      updateField(
                        "acceleratorApplications",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <FileUpload
                  label="Pitch Deck"
                  description="PDF, PPT, or PPTX up to 10MB"
                  required
                  onFileSelect={(file) => updateField("pitchDeck", file?.name)}
                />

                {/* <FileUpload
                  label="Data Room (Optional)"
                  description="Financial models, market research, etc."
                  onFileSelect={(file) => updateField("dataRoom", file?.name)}
                /> */}
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
