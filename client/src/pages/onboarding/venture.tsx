import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building } from "lucide-react";

interface VentureOnboardingProps {
  sessionId: string;
  initialData?: any;
  onNext: () => void;
  onPrev: () => void;
  onDataUpdate: (data: any) => void;
}

const ventureSchema = z.object({
  name: z.string().min(1, "Venture name is required"),
  industry: z.string().min(1, "Industry is required"),
  geography: z.string().min(1, "Geography is required"),
  businessModel: z.string().min(1, "Business model is required"),
  revenueStage: z.enum(["None", "Pre-Revenue", "Early Revenue", "Scaling"]),
  mvpStatus: z.enum(["Mockup", "Prototype", "Launched"]),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  marketSize: z.string().optional(),
  valuation: z.string().optional(),
  pilotsPartnerships: z.string().optional(),
  customerDiscoveryCount: z.number().min(0).default(0),
  userSignups: z.number().min(0).default(0),
  lois: z.number().min(0).default(0),
  hasTestimonials: z.boolean().default(false),
});

type VentureData = z.infer<typeof ventureSchema>;

export default function VentureOnboarding({
  sessionId,
  initialData,
  onNext,
  onPrev,
  onDataUpdate
}: VentureOnboardingProps) {
  const [formData, setFormData] = useState<Partial<VentureData>>({
    revenueStage: "Pre-Revenue",
    mvpStatus: "Prototype",
    customerDiscoveryCount: 0,
    userSignups: 0,
    lois: 0,
    hasTestimonials: false,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const saveVentureMutation = useMutation({
    mutationFn: async (data: VentureData) => {
      const res = await apiRequest("POST", "/api/onboarding/venture", {
        sessionId,
        ...data
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onDataUpdate(formData);
        toast({
          title: "Venture Details Saved",
          description: "Moving to team information...",
        });
        onNext();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save venture details",
        variant: "destructive",
      });
    }
  });

  const updateField = <K extends keyof VentureData>(field: K, value: VentureData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    try {
      ventureSchema.parse(formData);
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

    saveVentureMutation.mutate(formData as VentureData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Building className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">About Your Venture</h2>
        <p className="text-gray-600">
          Tell us about your company, market, and current stage
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Acme Technologies"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website || ""}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://acme.com"
              className={errors.website ? "border-red-500" : ""}
            />
            {errors.website && (
              <p className="text-red-500 text-sm mt-1">{errors.website}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="industry">Industry *</Label>
            <Select value={formData.industry || ""} onValueChange={(value) => updateField("industry", value)}>
              <SelectTrigger className={errors.industry ? "border-red-500" : ""}>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Fintech">Fintech</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Real Estate">Real Estate</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
                <SelectItem value="Energy">Energy</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.industry && (
              <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
            )}
          </div>

          <div>
            <Label htmlFor="geography">Primary Geography *</Label>
            <Select value={formData.geography || ""} onValueChange={(value) => updateField("geography", value)}>
              <SelectTrigger className={errors.geography ? "border-red-500" : ""}>
                <SelectValue placeholder="Select geography" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="North America">North America</SelectItem>
                <SelectItem value="Europe">Europe</SelectItem>
                <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                <SelectItem value="Latin America">Latin America</SelectItem>
                <SelectItem value="Middle East & Africa">Middle East & Africa</SelectItem>
                <SelectItem value="Global">Global</SelectItem>
              </SelectContent>
            </Select>
            {errors.geography && (
              <p className="text-red-500 text-sm mt-1">{errors.geography}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="businessModel">Business Model *</Label>
            <Select value={formData.businessModel || ""} onValueChange={(value) => updateField("businessModel", value)}>
              <SelectTrigger className={errors.businessModel ? "border-red-500" : ""}>
                <SelectValue placeholder="Select business model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SaaS">SaaS</SelectItem>
                <SelectItem value="Marketplace">Marketplace</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
                <SelectItem value="Subscription">Subscription</SelectItem>
                <SelectItem value="Freemium">Freemium</SelectItem>
                <SelectItem value="Transaction-based">Transaction-based</SelectItem>
                <SelectItem value="Advertising">Advertising</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Consulting">Consulting</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.businessModel && (
              <p className="text-red-500 text-sm mt-1">{errors.businessModel}</p>
            )}
          </div>

          <div>
            <Label htmlFor="revenueStage">Revenue Stage *</Label>
            <Select value={formData.revenueStage || ""} onValueChange={(value) => updateField("revenueStage", value as any)}>
              <SelectTrigger className={errors.revenueStage ? "border-red-500" : ""}>
                <SelectValue placeholder="Select revenue stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">No Revenue</SelectItem>
                <SelectItem value="Pre-Revenue">Pre-Revenue</SelectItem>
                <SelectItem value="Early Revenue">Early Revenue</SelectItem>
                <SelectItem value="Scaling">Scaling Revenue</SelectItem>
              </SelectContent>
            </Select>
            {errors.revenueStage && (
              <p className="text-red-500 text-sm mt-1">{errors.revenueStage}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="mvpStatus">Product Status *</Label>
            <Select value={formData.mvpStatus || ""} onValueChange={(value) => updateField("mvpStatus", value as any)}>
              <SelectTrigger className={errors.mvpStatus ? "border-red-500" : ""}>
                <SelectValue placeholder="Select product status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mockup">Mockup/Wireframe</SelectItem>
                <SelectItem value="Prototype">Prototype</SelectItem>
                <SelectItem value="Launched">Launched Product</SelectItem>
              </SelectContent>
            </Select>
            {errors.mvpStatus && (
              <p className="text-red-500 text-sm mt-1">{errors.mvpStatus}</p>
            )}
          </div>

          <div>
            <Label htmlFor="marketSize">Total Addressable Market</Label>
            <Input
              id="marketSize"
              type="text"
              value={formData.marketSize || ""}
              onChange={(e) => updateField("marketSize", e.target.value)}
              placeholder="$10B"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Traction Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="customerDiscoveryCount">Customer Interviews</Label>
              <Input
                id="customerDiscoveryCount"
                type="number"
                value={formData.customerDiscoveryCount || ""}
                onChange={(e) => updateField("customerDiscoveryCount", e.target.value ? parseInt(e.target.value) : 0)}
                placeholder="50"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="userSignups">User Signups</Label>
              <Input
                id="userSignups"
                type="number"
                value={formData.userSignups || ""}
                onChange={(e) => updateField("userSignups", e.target.value ? parseInt(e.target.value) : 0)}
                placeholder="1000"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="lois">Letters of Intent</Label>
              <Input
                id="lois"
                type="number"
                value={formData.lois || ""}
                onChange={(e) => updateField("lois", e.target.value ? parseInt(e.target.value) : 0)}
                placeholder="5"
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasTestimonials"
              checked={formData.hasTestimonials || false}
              onCheckedChange={(checked) => updateField("hasTestimonials", checked as boolean)}
            />
            <Label htmlFor="hasTestimonials" className="text-sm">
              We have customer testimonials
            </Label>
          </div>
        </div>

        <div>
          <Label htmlFor="pilotsPartnerships">Pilots & Partnerships</Label>
          <Textarea
            id="pilotsPartnerships"
            value={formData.pilotsPartnerships || ""}
            onChange={(e) => updateField("pilotsPartnerships", e.target.value)}
            placeholder="Describe any pilot programs, partnerships, or strategic relationships..."
            rows={3}
          />
        </div>

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
            type="submit"
            disabled={saveVentureMutation.isPending}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700"
          >
            {saveVentureMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              "Continue to Team"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}