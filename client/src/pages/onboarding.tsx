import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import ProgressBar from "@/components/progress-bar";
import FileUpload from "@/components/file-upload";
import { FounderData } from "@shared/schema";

interface OnboardingPageProps {
  onNext: () => void;
  onDataUpdate: (data: Partial<FounderData>) => void;
}

export default function OnboardingPage({ onNext, onDataUpdate }: OnboardingPageProps) {
  const [formData, setFormData] = useState<Partial<FounderData>>({
    acceleratorApplications: 0
  });

  const updateField = (field: keyof FounderData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataUpdate(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
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

              {/* File Uploads */}
              <div className="space-y-4">
                <FileUpload
                  label="Pitch Deck"
                  description="PDF, PPT, or PPTX up to 10MB"
                  required
                  onFileSelect={(file) => updateField("pitchDeck", file?.name)}
                />

                <FileUpload
                  label="Data Room (Optional)"
                  description="Financial models, market research, etc."
                  onFileSelect={(file) => updateField("dataRoom", file?.name)}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full gradient-button py-6 text-lg"
                size="lg"
              >
                Submit for Scoring
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
