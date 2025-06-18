import { useState } from "react";
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
import { ChevronLeft, Plus, Trash2, Users, Twitter, Instagram, Github, Linkedin, Edit } from "lucide-react";

const teamMemberSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Invalid email address"),
  experience: z.string().min(1, "Experience is required"),
  linkedinProfile: z.string().optional(),
  background: z.string().optional(),
  twitterUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  isCofounder: z.boolean().default(false),
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
  const [editingMember, setEditingMember] = useState<any>(null);

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      fullName: "",
      role: "",
      email: "",
      experience: "",
      linkedinProfile: "",
      background: "",
      twitterUrl: "",
      instagramUrl: "",
      githubUrl: "",
      age: undefined,
      gender: "",
      isCofounder: false,
    }
  });

  // Fetch team members
  const { data: teamData, refetch, isLoading, error } = useQuery({
    queryKey: ['team-members', sessionId],
    queryFn: async () => {
      console.log('Fetching team members for session:', sessionId);
      const response = await fetch(`/api/onboarding/team/${sessionId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Team members response:', data);
      return data;
    },
    enabled: !!sessionId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0 // Don't cache at all
  });

  const teamMembers = teamData?.teamMembers || [];
  const teamMemberCount = teamMembers.length;
  const isValidTeam = teamMemberCount >= 3;

  console.log('Team Data Debug:', { teamData, teamMembers, teamMemberCount, isValidTeam });

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
          description: `${data.teamMember.fullName} added to the team`,
        });
        form.reset();
        setShowAddForm(false);
        setEditingMember(null);
        // Force immediate refetch and cache invalidation
        queryClient.invalidateQueries({ queryKey: ['team-members'] });
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

  // Update team member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData & { memberId: string }) => {
      const res = await apiRequest("PUT", `/api/onboarding/team/update/${data.memberId}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success", 
          description: `${data.teamMember.fullName} updated successfully`,
        });
        queryClient.invalidateQueries({ queryKey: ['team-members'] });
        refetch();
        setEditingMember(null);
        setShowAddForm(false);
        form.reset();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team member",
        variant: "destructive",
      });
    },
  });

  // Delete team member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await apiRequest("DELETE", `/api/onboarding/team/delete/${memberId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team member removed",
      });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to remove team member",
        variant: "destructive",
      });
    },
  });

  // Complete team step mutation
  const completeTeamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/onboarding/team/complete", {
        sessionId
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team information saved successfully",
      });
      onNext();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save team information",
        variant: "destructive",
      });
    }
  });

  const onSubmitMember = async (data: TeamMemberFormData) => {
    if (editingMember) {
      updateMemberMutation.mutate({ ...data, memberId: editingMember.memberId });
    } else {
      addMemberMutation.mutate(data);
    }
  };

  const onEditMember = (member: any) => {
    setEditingMember(member);
    setShowAddForm(true);
    form.reset({
      fullName: member.fullName || "",
      role: member.role || "",
      experience: member.experience || "",
      email: member.email || "",
      linkedinProfile: member.linkedinProfile || "",
      background: member.background || "",
      twitterUrl: member.twitterUrl || "",
      instagramUrl: member.instagramUrl || "",
      githubUrl: member.githubUrl || "",
      age: member.age || undefined,
      gender: member.gender || "",
      isCofounder: member.isCofounder || false,
    });
  };

  const onDeleteMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this team member?")) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const handleNext = async () => {
    if (!isValidTeam) {
      toast({
        title: "Incomplete Team",
        description: "Please add at least 3 team members before proceeding",
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
            {teamMemberCount}/3 minimum team members
          </span>
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      <div className="bg-gray-100 p-2 mb-4 text-xs border rounded">
        <div><strong>Debug Info:</strong></div>
        <div>Session: {sessionId}</div>
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Error: {error ? String(error) : 'None'}</div>
        <div>Team Count: {teamMemberCount}</div>
        <div>Valid Team: {isValidTeam ? 'Yes' : 'No'}</div>
        <div>Raw Data: {JSON.stringify(teamData)?.slice(0, 150)}...</div>
      </div>

      {/* Team Members List */}
      <div className="mb-8">
        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading team members...</p>
          </div>
        )}
        
        {!isLoading && teamMemberCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {teamMembers.map((member: any, index: number) => (
              <Card key={member.memberId || index} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {member.fullName}
                      {member.isCofounder && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Co-founder
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditMember(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm" 
                        onClick={() => onDeleteMember(member.memberId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-1">{member.role}</p>
                  <p className="text-gray-500 text-xs mb-2">{member.email}</p>
                  
                  {/* Demographics */}
                  {(member.age || member.gender) && (
                    <div className="flex gap-4 text-xs text-gray-500 mb-2">
                      {member.age && <span>Age: {member.age}</span>}
                      {member.gender && <span>Gender: {member.gender}</span>}
                    </div>
                  )}

                  {/* Social Media Links */}
                  <div className="flex gap-2 mt-2">
                    {member.linkedinProfile && (
                      <a 
                        href={member.linkedinProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.twitterUrl && (
                      <a 
                        href={member.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-500 p-1"
                        title="Twitter"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {member.instagramUrl && (
                      <a 
                        href={member.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700 p-1"
                        title="Instagram"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {member.githubUrl && (
                      <a 
                        href={member.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-gray-800 p-1"
                        title="GitHub"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !isLoading && teamMemberCount === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No team members added yet</p>
            <p className="text-sm">Add your first team member to get started</p>
          </div>
        )}

        {/* Add Member Button */}
        <Button
          onClick={() => {
            setEditingMember(null);
            setShowAddForm(true);
            form.reset({
              fullName: "",
              role: "",
              experience: "",
              email: "",
              linkedinProfile: "",
              background: "",
              twitterUrl: "",
              instagramUrl: "",
              githubUrl: "",
              age: undefined,
              gender: "",
              isCofounder: false,
            });
          }}
          className="w-full mb-6"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>

        {/* Add Member Form */}
        {showAddForm && (
          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle>
                {editingMember ? `Edit ${editingMember.fullName}` : "Add Team Member"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmitMember)} className="space-y-6">
                {/* Basic Information */}
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
                      placeholder="Chief Technology Officer"
                    />
                    {form.formState.errors.role && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.role.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
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
                    <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                    <Input
                      id="linkedinProfile"
                      {...form.register("linkedinProfile")}
                      className="mt-1"
                      placeholder="https://linkedin.com/in/jane-smith"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="experience">Experience *</Label>
                  <Input
                    id="experience"
                    {...form.register("experience")}
                    className="mt-1"
                    placeholder="10+ years in software engineering, former Google engineer"
                  />
                  {form.formState.errors.experience && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.experience.message}
                    </p>
                  )}
                </div>

                {/* Social Media Links */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Social Media Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Twitter className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        {...form.register("twitterUrl")}
                        placeholder="Twitter URL"
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Instagram className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        {...form.register("instagramUrl")}
                        placeholder="Instagram URL"
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Github className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        {...form.register("githubUrl")}
                        placeholder="GitHub URL"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      {...form.register("age", { valueAsNumber: true })}
                      className="mt-1"
                      placeholder="30"
                      min="18"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select onValueChange={(value) => form.setValue("gender", value)}>
                      <SelectTrigger className="mt-1">
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

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isCofounder"
                    {...form.register("isCofounder")}
                    className="rounded"
                  />
                  <Label htmlFor="isCofounder">This person is a co-founder</Label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={addMemberMutation.isPending || updateMemberMutation.isPending}
                    className="flex-1"
                  >
                    {editingMember 
                      ? (updateMemberMutation.isPending ? "Updating..." : "Update Member")
                      : (addMemberMutation.isPending ? "Adding..." : "Add Member")
                    }
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingMember(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onPrev}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!isValidTeam || isSubmitting}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? "Saving..." : "Next: Upload Documents"}
        </Button>
      </div>
    </motion.div>
  );
}