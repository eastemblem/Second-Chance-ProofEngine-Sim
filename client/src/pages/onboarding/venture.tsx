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
import { ChevronLeft } from "lucide-react";

const ventureSchema = z.object({
  startupName: z.string().min(1, "Startup name is required"),
  industry: z.string().min(1, "Industry is required"),
  geography: z.string().min(1, "Geography is required"),
  businessModel: z.string().min(1, "Business model is required"),
  stage: z.string().min(1, "Stage is required"),
  description: z.string().optional(),
  website: z.string().optional(),
  targetMarket: z.string().optional(),
  revenueStage: z.string().optional(),
  mvpStatus: z.string().optional(),
});

type VentureFormData = z.infer<typeof ventureSchema>;

interface VentureOnboardingProps {
  sessionId: string;
  initialData?: Partial<VentureFormData>;
  onNext: () => void;
  onPrev: () => void;
  onDataUpdate: (data: VentureFormData) => void;
}

export default function VentureOnboarding({ 
  sessionId, 
  initialData, 
  onNext, 
  onPrev,
  onDataUpdate 
}: VentureOnboardingProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VentureFormData>({
    resolver: zodResolver(ventureSchema),
    defaultValues: {
      startupName: initialData?.startupName || "",
      industry: initialData?.industry || "",
      geography: initialData?.geography || "",
      businessModel: initialData?.businessModel || "",
      stage: initialData?.stage || "",
      description: initialData?.description || "",
      website: initialData?.website || "",
      targetMarket: initialData?.targetMarket || "",
      revenueStage: initialData?.revenueStage || "",
      mvpStatus: initialData?.mvpStatus || "",
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: VentureFormData) => {
      const res = await apiRequest("POST", "/api/onboarding/venture", {
        sessionId,
        ...data
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "Venture information saved successfully",
        });
        onNext();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save venture information",
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: VentureFormData) => {
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
          About Your Venture
        </h2>
        <p className="text-muted-foreground">
          Tell us about your startup and business
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="startupName">Startup Name *</Label>
          <Input
            id="startupName"
            {...form.register("startupName")}
            className="mt-1"
            placeholder="TechCorp Inc."
          />
          {form.formState.errors.startupName && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.startupName.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="industry">Industry *</Label>
            <Select onValueChange={(value) => form.setValue("industry", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fintech">FinTech</SelectItem>
                <SelectItem value="healthtech">HealthTech</SelectItem>
                <SelectItem value="edtech">EdTech</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="ai-ml">AI/ML</SelectItem>
                <SelectItem value="blockchain">Blockchain</SelectItem>
                <SelectItem value="iot">IoT</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.industry && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.industry.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="geography">Geography *</Label>
            <Input
              id="geography"
              {...form.register("geography")}
              className="mt-1"
              placeholder="United States, Europe, Asia"
            />
            {form.formState.errors.geography && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.geography.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="businessModel">Business Model *</Label>
            <Select onValueChange={(value) => form.setValue("businessModel", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select business model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="b2b">B2B</SelectItem>
                <SelectItem value="b2c">B2C</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="freemium">Freemium</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.businessModel && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.businessModel.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="stage">Stage *</Label>
            <Select onValueChange={(value) => form.setValue("stage", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="prototype">Prototype</SelectItem>
                <SelectItem value="mvp">MVP</SelectItem>
                <SelectItem value="early-traction">Early Traction</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.stage && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.stage.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="revenueStage">Revenue Stage</Label>
            <Select onValueChange={(value) => form.setValue("revenueStage", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select revenue stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Pre-Revenue">Pre-Revenue</SelectItem>
                <SelectItem value="Early Revenue">Early Revenue</SelectItem>
                <SelectItem value="Scaling">Scaling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="mvpStatus">MVP Status</Label>
            <Select onValueChange={(value) => form.setValue("mvpStatus", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select MVP status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mockup">Mockup</SelectItem>
                <SelectItem value="Prototype">Prototype</SelectItem>
                <SelectItem value="Launched">Launched</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            {...form.register("website")}
            className="mt-1"
            placeholder="https://yourcompany.com"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            className="mt-1"
            placeholder="Briefly describe what your startup does..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="targetMarket">Target Market</Label>
          <Textarea
            id="targetMarket"
            {...form.register("targetMarket")}
            className="mt-1"
            placeholder="Describe your target market and customers..."
            rows={3}
          />
        </div>

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
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2"
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}