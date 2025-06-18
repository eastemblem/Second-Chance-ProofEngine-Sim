import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Plus, Trash2, Users } from "lucide-react";

const teamMemberSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Invalid email address"),
  experience: z.string().min(1, "Experience is required"),
  linkedinProfile: z.string().optional(),
  background: z.string().optional(),
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

interface TeamOnboardingProps {
  sessionId: string;
  initialData?: any;
  onNext: () => void;
  onPrev: () => void;
  onDataUpdate: (data: any) => void;
}

export default function TeamOnboarding({ 
  sessionId, 
  initialData, 
  onNext, 
  onPrev,
  onDataUpdate 
}: TeamOnboardingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      fullName: "",
      role: "",
      experience: "",
      email: "",
      linkedinProfile: "",
      background: "",
    }
  });

  // Fetch team members
  const { data: teamData, refetch } = useQuery({
    queryKey: ['/api/onboarding/team', sessionId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/onboarding/team/${sessionId}`, {});
      return await res.json();
    }
  });

  const teamMembers = teamData?.teamMembers || [];
  const isValidTeam = teamMembers.length >= 3;

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      const res = await apiRequest("POST", "/api/onboarding/team/add", {
        sessionId,
        ...data
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "Team member added successfully",
        });
        form.reset();
        setShowAddForm(false);
        refetch();
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
        toast({
          title: "Success",
          description: "Team information saved successfully",
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

  const onAddMember = async (data: TeamMemberFormData) => {
    await addMemberMutation.mutateAsync(data);
  };

  const handleContinue = async () => {
    if (!isValidTeam) {
      toast({
        title: "Incomplete Team",
        description: "Please add at least 3 team members to continue",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    onDataUpdate({ teamMembers });
    await completeTeamMutation.mutateAsync();
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Build Your Team
        </h2>
        <p className="text-muted-foreground mb-4">
          Add your team members (minimum 3 required)
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm">
          <Users className="w-4 h-4" />
          <span className={`font-medium ${isValidTeam ? 'text-green-600' : 'text-orange-600'}`}>
            {teamMembers.length}/3 minimum team members
          </span>
        </div>
      </div>

      {/* Team Members List */}
      <div className="mb-8">
        {teamMembers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {teamMembers.map((member: any, index: number) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {member.fullName}
                    {member.isCofounder && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Co-founder
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-1">{member.role}</p>
                  <p className="text-gray-500 text-xs">{member.email}</p>
                  {member.linkedinProfile && (
                    <a 
                      href={member.linkedinProfile} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 text-xs hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Member Button */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="w-full border-dashed border-2 h-20 text-gray-600 hover:bg-gray-50"
          >
            <Plus className="w-6 h-6 mr-2" />
            Add Team Member
          </Button>
        )}

        {/* Add Member Form */}
        {showAddForm && (
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Add Team Member</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onAddMember)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      {...form.register("fullName")}
                      className="mt-1"
                      placeholder="Jane Smith"
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Input
                      id="role"
                      {...form.register("role")}
                      className="mt-1"
                      placeholder="CTO, VP of Marketing"
                    />
                    {form.formState.errors.role && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.role.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    className="mt-1"
                    placeholder="jane@example.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="experience">Experience *</Label>
                  <Input
                    id="experience"
                    {...form.register("experience")}
                    className="mt-1"
                    placeholder="5+ years in product development, Former Google engineer"
                  />
                  {form.formState.errors.experience && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.experience.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                  <Input
                    id="linkedinProfile"
                    {...form.register("linkedinProfile")}
                    className="mt-1"
                    placeholder="https://linkedin.com/in/janesmith"
                  />
                </div>

                <div>
                  <Label htmlFor="background">Background</Label>
                  <Input
                    id="background"
                    {...form.register("background")}
                    className="mt-1"
                    placeholder="Additional background information"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="px-6 py-2"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!isValidTeam || isSubmitting}
          className="px-8 py-2"
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </Button>
      </div>
    </motion.div>
  );
}