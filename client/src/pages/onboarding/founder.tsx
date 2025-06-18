import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "lucide-react";

interface FounderOnboardingProps {
  sessionId: string;
  initialData?: any;
  onNext: () => void;
  onDataUpdate: (data: any) => void;
}

const founderSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  positionRole: z.string().min(1, "Position/role is required"),
  age: z.number().min(18, "Must be at least 18 years old").optional(),
  linkedinProfile: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  gender: z.string().optional(),
  residence: z.string().optional(),
  isTechnical: z.boolean().default(false),
});

type FounderData = z.infer<typeof founderSchema>;

export default function FounderOnboarding({ 
  sessionId, 
  initialData, 
  onNext, 
  onDataUpdate 
}: FounderOnboardingProps) {
  const [formData, setFormData] = useState<Partial<FounderData>>({
    fullName: "",
    email: "",
    positionRole: "Founder",
    isTechnical: false,
    ...initialData
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Save founder data mutation
  const saveFounderMutation = useMutation({
    mutationFn: async (data: FounderData) => {
      const res = await apiRequest("POST", "/api/onboarding/founder", {
        sessionId,
        ...data
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onDataUpdate(formData);
        toast({
          title: "Founder Details Saved",
          description: "Moving to venture information...",
        });
        onNext();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save founder details",
        variant: "destructive",
      });
    }
  });

  const updateField = <K extends keyof FounderData>(field: K, value: FounderData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    try {
      founderSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below",
        variant: "destructive",
      });
      return;
    }

    saveFounderMutation.mutate(formData as FounderData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <User className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
        <p className="text-gray-600">
          Let's start with your personal information and background
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName || ""}
              onChange={(e) => updateField("fullName", e.target.value)}
              placeholder="John Doe"
              className={errors.fullName ? "border-red-500" : ""}
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="john@example.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="positionRole">Position/Role *</Label>
            <Select value={formData.positionRole || "Founder"} onValueChange={(value) => updateField("positionRole", value)}>
              <SelectTrigger className={errors.positionRole ? "border-red-500" : ""}>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Founder">Founder</SelectItem>
                <SelectItem value="CEO">CEO</SelectItem>
                <SelectItem value="CTO">CTO</SelectItem>
                <SelectItem value="COO">COO</SelectItem>
                <SelectItem value="Co-Founder">Co-Founder</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.positionRole && (
              <p className="text-red-500 text-sm mt-1">{errors.positionRole}</p>
            )}
          </div>

          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age || ""}
              onChange={(e) => updateField("age", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="30"
              min="18"
              max="100"
              className={errors.age ? "border-red-500" : ""}
            />
            {errors.age && (
              <p className="text-red-500 text-sm mt-1">{errors.age}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
            <Input
              id="linkedinProfile"
              type="url"
              value={formData.linkedinProfile || ""}
              onChange={(e) => updateField("linkedinProfile", e.target.value)}
              placeholder="https://linkedin.com/in/johndoe"
              className={errors.linkedinProfile ? "border-red-500" : ""}
            />
            {errors.linkedinProfile && (
              <p className="text-red-500 text-sm mt-1">{errors.linkedinProfile}</p>
            )}
          </div>

          <div>
            <Label htmlFor="residence">Location/Residence</Label>
            <Input
              id="residence"
              type="text"
              value={formData.residence || ""}
              onChange={(e) => updateField("residence", e.target.value)}
              placeholder="San Francisco, CA"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="gender">Gender (Optional)</Label>
            <Select value={formData.gender || ""} onValueChange={(value) => updateField("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Non-binary">Non-binary</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="isTechnical"
              checked={formData.isTechnical || false}
              onCheckedChange={(checked) => updateField("isTechnical", checked as boolean)}
            />
            <Label htmlFor="isTechnical" className="text-sm">
              I have a technical background
            </Label>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={saveFounderMutation.isPending}
            className="px-8 py-2 bg-purple-600 hover:bg-purple-700"
          >
            {saveFounderMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              "Continue to Venture Info"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}