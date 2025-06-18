import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
import { ventureSchema, type VentureFormData } from "@shared/schema";

interface VentureOnboardingProps {
  sessionId: string;
  initialData?: any;
  onNext: () => void;
  onPrev: () => void;
  onDataUpdate?: (data: any) => void;
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
      name: "",
      industry: "",
      geography: "",
      businessModel: "",
      revenueStage: "Pre-Revenue",
      mvpStatus: "Prototype",
      website: "",
      marketSize: "",
      valuation: "",
      pilotsPartnerships: "",
      customerDiscoveryCount: 0,
      userSignups: 0,
      lois: 0,
      hasTestimonials: false,
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
        onDataUpdate?.(data.venture);
        onNext();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save venture information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: VentureFormData) => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error submitting venture data:", error);
    } finally {
      setIsSubmitting(false);
    }
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
          <Label htmlFor="name">Startup Name *</Label>
          <Input
            id="name"
            {...form.register("name")}
            className="mt-1"
            placeholder="TechCorp Inc."
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="industry">Industry *</Label>
            <Input
              id="industry"
              {...form.register("industry")}
              className="mt-1"
              placeholder="SaaS, E-commerce, FinTech, etc."
            />
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
              placeholder="United States, Europe, Global, etc."
            />
            {form.formState.errors.geography && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.geography.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="businessModel">Business Model *</Label>
          <Select onValueChange={(value) => form.setValue("businessModel", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select business model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="B2B SaaS">B2B SaaS</SelectItem>
              <SelectItem value="B2C SaaS">B2C SaaS</SelectItem>
              <SelectItem value="Marketplace">Marketplace</SelectItem>
              <SelectItem value="E-commerce">E-commerce</SelectItem>
              <SelectItem value="FinTech">FinTech</SelectItem>
              <SelectItem value="HealthTech">HealthTech</SelectItem>
              <SelectItem value="EdTech">EdTech</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.businessModel && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.businessModel.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="revenueStage">Revenue Stage *</Label>
            <Select onValueChange={(value) => form.setValue("revenueStage", value as "None" | "Pre-Revenue" | "Early Revenue" | "Scaling")}>
              <SelectTrigger>
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
            <Label htmlFor="mvpStatus">MVP Status *</Label>
            <Select onValueChange={(value) => form.setValue("mvpStatus", value as "Mockup" | "Prototype" | "Launched")}>
              <SelectTrigger>
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
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            {...form.register("website")}
            className="mt-1"
            placeholder="https://yourcompany.com"
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
            className="px-6 py-2"
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}