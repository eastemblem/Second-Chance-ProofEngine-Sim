import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const founderSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  positionRole: z.string().min(1, "Position/role is required"),
  age: z.number().optional(),
  linkedinProfile: z.string().optional(),
  gender: z.string().optional(),
  personalLinkedin: z.string().optional(),
  residence: z.string().optional(),
  isTechnical: z.boolean().default(false),
});

type FounderFormData = z.infer<typeof founderSchema>;

interface FounderOnboardingProps {
  sessionId: string;
  initialData?: Partial<FounderFormData>;
  onNext: () => void;
  onDataUpdate: (data: FounderFormData) => void;
}

export default function FounderOnboarding({ 
  sessionId, 
  initialData, 
  onNext, 
  onDataUpdate 
}: FounderOnboardingProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FounderFormData>({
    resolver: zodResolver(founderSchema),
    defaultValues: {
      fullName: initialData?.fullName || "",
      email: initialData?.email || "",
      positionRole: initialData?.positionRole || "",
      age: initialData?.age || undefined,
      linkedinProfile: initialData?.linkedinProfile || "",
      gender: initialData?.gender || "",
      personalLinkedin: initialData?.personalLinkedin || "",
      residence: initialData?.residence || "",
      isTechnical: initialData?.isTechnical || false,
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FounderFormData) => {
      const res = await apiRequest("POST", "/api/onboarding/founder", {
        sessionId,
        ...data
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "Founder information saved successfully",
        });
        onNext();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save founder information",
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: FounderFormData) => {
    setIsSubmitting(true);
    onDataUpdate(data);
    await submitMutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Tell us about yourself
        </h2>
        <p className="text-muted-foreground">
          Let's start with your personal information and background
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              {...form.register("fullName")}
              className="mt-1"
              placeholder="John Doe"
            />
            {form.formState.errors.fullName && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              className="mt-1"
              placeholder="john@example.com"
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="positionRole">Position/Role *</Label>
          <Input
            id="positionRole"
            {...form.register("positionRole")}
            className="mt-1"
            placeholder="CEO, CTO, Founder"
          />
          {form.formState.errors.positionRole && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.positionRole.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="age">Age (Optional)</Label>
            <Input
              id="age"
              type="number"
              {...form.register("age", { valueAsNumber: true })}
              className="mt-1"
              placeholder="30"
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender (Optional)</Label>
            <Select onValueChange={(value) => form.setValue("gender", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="residence">Residence</Label>
          <Input
            id="residence"
            {...form.register("residence")}
            className="mt-1"
            placeholder="City, Country"
          />
        </div>

        <div>
          <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
          <Input
            id="linkedinProfile"
            {...form.register("linkedinProfile")}
            className="mt-1"
            placeholder="https://linkedin.com/in/johndoe"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isTechnical"
            checked={form.watch("isTechnical")}
            onCheckedChange={(checked) => form.setValue("isTechnical", checked)}
          />
          <Label htmlFor="isTechnical">I have a technical background</Label>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2"
          >
            {isSubmitting ? "Saving..." : "Next: Venture Info"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}