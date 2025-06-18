import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Plus, Trash2 } from "lucide-react";

interface TeamOnboardingProps {
  sessionId: string;
  initialData?: any;
  onNext: () => void;
  onPrev: () => void;
  onDataUpdate: (data: any) => void;
}

const teamMemberSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  experience: z.string().min(1, "Experience is required"),
  linkedinProfile: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  background: z.string().optional(),
});

type TeamMemberData = z.infer<typeof teamMemberSchema>;

export default function TeamOnboarding({
  sessionId,
  initialData,
  onNext,
  onPrev,
  onDataUpdate
}: TeamOnboardingProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [newMember, setNewMember] = useState<Partial<TeamMemberData>>({
    fullName: "",
    email: "",
    role: "",
    experience: "",
    linkedinProfile: "",
    background: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Fetch existing team members
  const { data: teamData } = useQuery({
    queryKey: ["teamMembers", sessionId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/onboarding/team/${sessionId}`, {});
      return await res.json();
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (teamData?.success) {
      setTeamMembers(teamData.teamMembers || []);
    }
  }, [teamData]);

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (memberData: TeamMemberData) => {
      const res = await apiRequest("POST", "/api/onboarding/team/add", {
        sessionId,
        ...memberData
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setTeamMembers(prev => [...prev, data.teamMember]);
        setNewMember({
          fullName: "",
          email: "",
          role: "",
          experience: "",
          linkedinProfile: "",
          background: "",
        });
        setErrors({});
        toast({
          title: "Team Member Added",
          description: "Successfully added team member",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    }
  });

  // Complete team step mutation
  const completeTeamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/onboarding/team/complete", {
        sessionId
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onDataUpdate({ teamMembers });
        toast({
          title: "Team Information Saved",
          description: "Moving to document upload...",
        });
        onNext();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete team step",
        variant: "destructive",
      });
    }
  });

  const updateNewMemberField = <K extends keyof TeamMemberData>(field: K, value: TeamMemberData[K]) => {
    setNewMember(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateNewMember = () => {
    try {
      teamMemberSchema.parse(newMember);
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

  const handleAddMember = () => {
    if (!validateNewMember()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below",
        variant: "destructive",
      });
      return;
    }

    addMemberMutation.mutate(newMember as TeamMemberData);
  };

  const handleCompleteStep = () => {
    if (teamMembers.length < 3) {
      toast({
        title: "Minimum Team Size Required",
        description: "Please add at least 3 team members to continue",
        variant: "destructive",
      });
      return;
    }

    completeTeamMutation.mutate();
  };

  const isFormValid = teamMembers.length >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Users className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Build Your Team</h2>
        <p className="text-gray-600">
          Add your team members (minimum 3 required, including yourself)
        </p>
        <div className="mt-2">
          <span className={`text-sm font-medium ${isFormValid ? 'text-green-600' : 'text-orange-600'}`}>
            {teamMembers.length}/3 minimum team members added
          </span>
        </div>
      </div>

      {/* Existing Team Members */}
      {teamMembers.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Team Members</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member, index) => (
              <Card key={index} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{member.fullName}</CardTitle>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Email:</span> {member.email}</p>
                    <p><span className="font-medium">Experience:</span> {member.experience}</p>
                    {member.linkedinProfile && (
                      <p><span className="font-medium">LinkedIn:</span> 
                        <a href={member.linkedinProfile} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline ml-1">Profile</a>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add New Team Member Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Team Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                value={newMember.fullName || ""}
                onChange={(e) => updateNewMemberField("fullName", e.target.value)}
                placeholder="Jane Smith"
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
                value={newMember.email || ""}
                onChange={(e) => updateNewMemberField("email", e.target.value)}
                placeholder="jane@company.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={newMember.role || ""} onValueChange={(value) => updateNewMemberField("role", value)}>
                <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Co-Founder">Co-Founder</SelectItem>
                  <SelectItem value="CTO">CTO</SelectItem>
                  <SelectItem value="CMO">CMO</SelectItem>
                  <SelectItem value="Head of Engineering">Head of Engineering</SelectItem>
                  <SelectItem value="Head of Product">Head of Product</SelectItem>
                  <SelectItem value="Head of Sales">Head of Sales</SelectItem>
                  <SelectItem value="Head of Marketing">Head of Marketing</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Advisor">Advisor</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-red-500 text-sm mt-1">{errors.role}</p>
              )}
            </div>

            <div>
              <Label htmlFor="experience">Experience Level *</Label>
              <Select value={newMember.experience || ""} onValueChange={(value) => updateNewMemberField("experience", value)}>
                <SelectTrigger className={errors.experience ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-2 years">0-2 years</SelectItem>
                  <SelectItem value="3-5 years">3-5 years</SelectItem>
                  <SelectItem value="6-10 years">6-10 years</SelectItem>
                  <SelectItem value="10+ years">10+ years</SelectItem>
                </SelectContent>
              </Select>
              {errors.experience && (
                <p className="text-red-500 text-sm mt-1">{errors.experience}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
            <Input
              id="linkedinProfile"
              type="url"
              value={newMember.linkedinProfile || ""}
              onChange={(e) => updateNewMemberField("linkedinProfile", e.target.value)}
              placeholder="https://linkedin.com/in/janesmith"
              className={errors.linkedinProfile ? "border-red-500" : ""}
            />
            {errors.linkedinProfile && (
              <p className="text-red-500 text-sm mt-1">{errors.linkedinProfile}</p>
            )}
          </div>

          <div>
            <Label htmlFor="background">Background/Skills</Label>
            <Input
              id="background"
              type="text"
              value={newMember.background || ""}
              onChange={(e) => updateNewMemberField("background", e.target.value)}
              placeholder="Brief description of background and key skills"
            />
          </div>

          <Button
            onClick={handleAddMember}
            disabled={addMemberMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {addMemberMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          onClick={onPrev}
          variant="outline"
          className="px-8"
        >
          Back
        </Button>
        
        <Button
          onClick={handleCompleteStep}
          disabled={!isFormValid || completeTeamMutation.isPending}
          className="px-8 py-2 bg-green-600 hover:bg-green-700"
        >
          {completeTeamMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            "Continue to Upload"
          )}
        </Button>
      </div>
    </motion.div>
  );
}