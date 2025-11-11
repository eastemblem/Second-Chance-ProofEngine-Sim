import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Plus, Trash2, Users, Twitter, Instagram, Github, Linkedin, Edit, Briefcase, Mail, Clock, User, ExternalLink } from "lucide-react";

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

  // Validate sessionId on component mount
  if (!sessionId || sessionId === 'undefined' || sessionId === '') {
    if (import.meta.env.MODE === 'development') {
      console.error('TeamOnboarding: Invalid sessionId provided:', sessionId);
      console.log('SessionId type:', typeof sessionId, 'Value:', sessionId);
    }
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-red-600">
          <p>Session error: Please restart the onboarding process.</p>
          <p className="text-sm mt-2 text-gray-500">Session ID: {sessionId || 'undefined'}</p>
        </div>
      </div>
    );
  }

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
      if (!sessionId || sessionId === 'undefined') {
        throw new Error('Invalid session ID');
      }
      if (import.meta.env.MODE === 'development') {
        console.log('Fetching team members for session:', sessionId);
      }
      const response = await apiRequest("GET", `/api/v1/onboarding/team/${sessionId}`);
      const data = await response.json();
      if (import.meta.env.MODE === 'development') {
        console.log('Team members response:', data);
      }
      
      // Return the team members directly for easier access
      if (data.success && data.data) {
        return data.data.teamMembers || [];
      }
      return data.teamMembers || [];
    },
    enabled: !!sessionId && sessionId !== 'undefined',
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0 // Don't cache at all
  });

  const teamMembers = teamData || [];
  const teamMemberCount = teamMembers.length;
  const canSkip = true; // Always allow completing team step

  if (import.meta.env.MODE === 'development') {
    console.log('Team Data Debug:', { 
      teamData, 
      teamMembers, 
      teamMemberCount, 
      canSkip
    });
  }

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      if (!sessionId || sessionId === 'undefined') {
        throw new Error('Invalid session ID - please restart onboarding');
      }
      
      if (import.meta.env.MODE === 'development') {
        console.log('Adding team member with sessionId:', sessionId);
      }
      const response = await apiRequest("POST", "/api/v1/onboarding/team/add", {
        sessionId, 
        ...data
      });
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (data?.success) {
        // Track team member addition
        trackEvent('team_member_added', 'form_submission', 'onboarding_team_management');
        
        const memberName = data?.data?.teamMember?.fullName || "Team member";
        toast({
          title: "Success",
          description: `${memberName} added to the team`,
        });
        form.reset();
        setShowAddForm(false);
        setEditingMember(null);
        // Force immediate refetch and cache invalidation
        queryClient.invalidateQueries({ queryKey: ['team-members', sessionId] });
        queryClient.invalidateQueries({ queryKey: ['team-members'] });
        setTimeout(() => {
          refetch();
        }, 500);
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
      const response = await apiRequest("PUT", `/api/v1/onboarding/team/update/${data.memberId}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data?.success) {
        // Track team member update
        trackEvent('team_member_updated', 'form_submission', 'onboarding_team_management');
        
        const memberName = data?.data?.teamMember?.fullName || "Team member";
        toast({
          title: "Success", 
          description: `${memberName} updated successfully`,
        });
        queryClient.invalidateQueries({ queryKey: ['team-members', sessionId] });
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
      const response = await apiRequest("DELETE", `/api/v1/onboarding/team/delete/${memberId}`);
      return await response.json();
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
      if (!sessionId || sessionId === 'undefined') {
        throw new Error('Invalid session ID - please restart onboarding');
      }
      
      if (import.meta.env.MODE === 'development') {
        console.log('Completing team step with sessionId:', sessionId);
      }
      const response = await apiRequest("POST", "/api/v1/onboarding/team/complete", { sessionId });
      
      return await response.json();
    },
    onSuccess: () => {
      // Track team step completion
      trackEvent('onboarding_team_complete', 'user_journey', 'team_information_saved');
      
      toast({
        title: "Success",
        description: "Team information saved successfully",
      });
      onNext();
    },
    onError: (error: any) => {
      // Track team step error
      trackEvent('onboarding_team_error', 'user_journey', 'team_information_error');
      
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
      fullName: member?.fullName || "",
      role: member?.role || "",
      experience: member?.experience || "",
      email: member?.email || "",
      linkedinProfile: member?.linkedinProfile || "",
      background: member?.background || "",
      twitterUrl: member?.twitterUrl || "",
      instagramUrl: member?.instagramUrl || "",
      githubUrl: member?.githubUrl || "",
      age: member?.age || undefined,
      gender: member?.gender || "",
      isCofounder: member?.isCofounder || false,
    });
  };

  const onDeleteMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this team member?")) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    onDataUpdate({ teamMembers });
    await completeTeamMutation.mutateAsync();
    setIsSubmitting(false);
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    onDataUpdate({ teamMembers: [] });
    await completeTeamMutation.mutateAsync();
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
      data-testid="onboarding-team-container"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Build Your Team
        </h2>
        <p className="text-muted-foreground mb-4">
          Add up to 4 team members (optional)
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm">
          <Users className="w-4 h-4" />
          <span className="font-medium text-blue-600">
            {teamMemberCount}/4 team members added
          </span>
        </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {teamMembers.map((member: any, index: number) => (
              <motion.div
                key={member.memberId || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group relative overflow-hidden border border-border hover:border-primary hover:shadow-xl transition-all duration-300 bg-card">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardHeader className="relative pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Professional Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-gold rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg ring-2 ring-border">
                            {member.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          {member.isCofounder && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-gold rounded-full border-2 border-card flex items-center justify-center">
                              <User className="w-2.5 h-2.5 text-background" />
                            </div>
                          )}
                        </div>
                        
                        {/* Member Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg font-bold text-card-foreground truncate">
                              {member.fullName}
                            </CardTitle>
                            {member.isCofounder && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-gold/20 text-primary-gold border border-primary-gold/30">
                                Co-founder
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-primary">{member.role}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditMember(member)}
                          className="h-7 w-7 p-0 hover:bg-accent rounded-full"
                        >
                          <Edit className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteMember(member.memberId)}
                          className="h-7 w-7 p-0 hover:bg-destructive/20 rounded-full"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-3">
                    {/* Experience Section */}
                    {member.experience && (
                      <div className="flex items-start gap-2 p-2.5 bg-muted rounded-lg border border-border">
                        <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground mb-0.5">Experience</p>
                          <p className="text-xs text-muted-foreground">{member.experience}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Background Section */}
                    {member.background && (
                      <div className="flex items-start gap-2 p-2.5 bg-secondary rounded-lg border border-border">
                        <User className="w-3.5 h-3.5 text-primary-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground mb-0.5">Background</p>
                          <p className="text-xs text-muted-foreground">{member.background}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Social Links */}
                    {(member.linkedinProfile || member.twitterUrl || member.instagramUrl || member.githubUrl) && (
                      <div className="pt-1 border-t border-border">
                        <p className="text-xs font-medium text-primary mb-1.5">Connect</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {member.linkedinProfile && (
                            <a
                              href={member.linkedinProfile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-xs font-medium transition-all duration-200 hover:scale-105"
                            >
                              <Linkedin className="w-3 h-3" />
                              LinkedIn
                            </a>
                          )}
                          
                          {member.twitterUrl && (
                            <a
                              href={member.twitterUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-xs font-medium transition-all duration-200 hover:scale-105"
                            >
                              <Twitter className="w-3 h-3" />
                              Twitter
                            </a>
                          )}
                          
                          {member.githubUrl && (
                            <a
                              href={member.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md text-xs font-medium transition-all duration-200 hover:scale-105"
                            >
                              <Github className="w-3 h-3" />
                              GitHub
                            </a>
                          )}
                          
                          {member.instagramUrl && (
                            <a
                              href={member.instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary to-primary-gold hover:from-primary/90 hover:to-primary-gold/90 text-primary-foreground rounded-md text-xs font-medium transition-all duration-200 hover:scale-105"
                            >
                              <Instagram className="w-3 h-3" />
                              Instagram
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
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
          data-testid="button-add-team-member"
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
              <form onSubmit={form.handleSubmit(onSubmitMember)} className="space-y-6" data-testid="onboarding-team-form">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      {...form.register("fullName")}
                      className="mt-1"
                      placeholder="Jane Smith"
                      data-testid="input-team-fullname"
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
                      data-testid="input-team-role"
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
                      data-testid="input-team-email"
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
                      data-testid="input-team-linkedin"
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
                    data-testid="input-team-experience"
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
                    data-testid="button-submit-team-member"
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
                    data-testid="button-cancel-team-member"
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
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-2"
          data-testid="button-continue-upload"
        >
          {isSubmitting ? "Saving..." : "Next: Upload Pitch Deck"}
        </Button>
      </div>
    </motion.div>
  );
}