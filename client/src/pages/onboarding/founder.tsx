import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
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
  emailLocked?: boolean;
  preOnboardingToken?: string;
}

export default function FounderOnboarding({ 
  sessionId, 
  initialData, 
  onNext, 
  onDataUpdate,
  emailLocked = false,
  preOnboardingToken
}: FounderOnboardingProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

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
        ...data,
        ...(preOnboardingToken ? { preOnboardingToken } : {})
      });
      return await res.json();
    },
    onSuccess: async (data) => {
      if (data.success) {
        // Track founder step completion
        trackEvent('onboarding_founder_complete', 'user_journey', 'founder_details_saved');
        
        toast({
          title: "Success",
          description: "Founder information saved successfully",
        });
        
        if (import.meta.env.MODE === 'development') {
          console.log("👤 Founder step completed successfully");
        }
        
        // Trigger session refresh from server
        onDataUpdate(data);
        
        // Navigate to next step
        onNext();
      }
    },
    onError: (error: any) => {
      console.error("❌ Founder onboarding API error received:", {
        timestamp: new Date().toISOString(),
        sessionId,
        error: error,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        hasResponse: !!error.response,
        originalRequest: {
          endpoint: "/api/onboarding/founder",
          method: "POST",
          sessionId
        }
      });

      // Track founder step error
      trackEvent('onboarding_founder_error', 'user_journey', 'founder_details_error');
      
      let errorResponse;
      let errorMessage = "Failed to save founder information";
      
      // Handle ApiError (custom error class with preserved response data)
      if (error.name === 'ApiError' && error.response) {
        errorResponse = error.response;
        errorMessage = error.message;
      } else if (error.response) {
        try {
          errorResponse = error.response;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle structured error responses from our backend
      if (errorResponse) {
        console.log("🔍 Processing structured error response:", {
          timestamp: new Date().toISOString(),
          sessionId,
          errorResponse,
          responseKeys: Object.keys(errorResponse),
          hasSuccessField: 'success' in errorResponse,
          hasErrorField: 'error' in errorResponse,
          hasMessageField: 'message' in errorResponse,
          nestedError: errorResponse.error
        });

        // Handle the new nested error structure: {"success":false,"error":{"status":400,"message":"Email already taken"}}
        if (errorResponse.error && typeof errorResponse.error === 'object') {
          const nestedError = errorResponse.error;
          const nestedErrorMessage = nestedError.message || nestedError.error || "Unknown error";
          
          console.log("🔍 Processing nested error structure:", {
            timestamp: new Date().toISOString(),
            sessionId,
            nestedError,
            nestedErrorMessage,
            status: nestedError.status,
            emailValue: form.getValues("email")
          });
          
          // Check if this is an email duplicate error
          if (nestedErrorMessage === "Email already taken" || nestedErrorMessage.includes("Email already taken")) {
            console.warn("📧 Email already exists error detected:", {
              timestamp: new Date().toISOString(),
              sessionId,
              errorMessage: nestedErrorMessage,
              emailValue: form.getValues("email"),
              responseData: errorResponse
            });
            
            // Set field-specific error
            setEmailError("Email already taken");
            
            // Set form field error for styling
            form.setError("email", {
              type: "manual",
              message: "Email already taken"
            });
            
            // Show toast notification with helpful message
            toast({
              title: "Email Already Registered",
              description: "This email address is already in use. Please use a different email address.",
              variant: "destructive",
            });
            return;
          }
          
          // Handle other nested error messages
          errorMessage = nestedErrorMessage;
        }
        
        // Fallback: Handle direct error field
        if (errorResponse.error && typeof errorResponse.error === 'string') {
          errorMessage = errorResponse.error;
        }
        
        // Fallback: Handle direct message field
        if (errorResponse.message) {
          errorMessage = errorResponse.message;
        }
      }
      
      // Check if this is an email duplicate error (fallback for string-based detection)
      if (errorMessage.includes("Email already taken")) {
        console.warn("📧 Email duplicate error (fallback detection):", {
          timestamp: new Date().toISOString(),
          sessionId,
          errorMessage,
          emailValue: form.getValues("email")
        });
        
        // Set field-specific error
        setEmailError("Email already taken");
        
        // Set form field error for styling
        form.setError("email", {
          type: "manual",
          message: "Email already taken"
        });
        
        // Show toast notification with helpful message
        toast({
          title: "Email Already Registered",
          description: "This email address is already in use. Please use a different email address.",
          variant: "destructive",
        });
      } else {
        // Handle other errors normally
        console.warn("⚠️ General error handling:", {
          timestamp: new Date().toISOString(),
          sessionId,
          errorMessage,
          originalError: error
        });
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = async (data: FounderFormData) => {
    setIsSubmitting(true);
    // Clear any existing email error
    setEmailError(null);
    form.clearErrors("email");
    
    try {
      await submitMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
      data-testid="onboarding-founder-container"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Tell us about yourself
        </h2>
        <p className="text-muted-foreground">
          Let's start with your personal information and background
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="onboarding-founder-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              {...form.register("fullName")}
              className="mt-1"
              placeholder="John Doe"
              data-testid="input-full-name"
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
              className={`mt-1 ${form.formState.errors.email || emailError ? 'border-red-500' : ''} ${emailLocked ? 'bg-muted cursor-not-allowed' : ''}`}
              placeholder="john@example.com"
              data-testid="input-email"
              disabled={emailLocked}
              onChange={(e) => {
                if (!emailLocked) {
                  form.register("email").onChange(e);
                  // Clear email error when user starts typing
                  if (emailError) {
                    setEmailError(null);
                    form.clearErrors("email");
                  }
                }
              }}
            />
            {emailLocked && (
              <p className="text-muted-foreground text-sm mt-1">
                Email pre-filled from your payment
              </p>
            )}
            {!emailLocked && (form.formState.errors.email || emailError) && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.email?.message || emailError}
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
            data-testid="input-position-role"
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
              data-testid="input-age"
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender (Optional)</Label>
            <Select onValueChange={(value) => form.setValue("gender", value)}>
              <SelectTrigger className="mt-1" data-testid="select-gender">
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
            data-testid="input-residence"
          />
        </div>

        <div>
          <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
          <Input
            id="linkedinProfile"
            {...form.register("linkedinProfile")}
            className="mt-1"
            placeholder="https://linkedin.com/in/johndoe"
            data-testid="input-linkedin"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isTechnical"
            checked={form.watch("isTechnical")}
            onCheckedChange={(checked) => form.setValue("isTechnical", checked)}
            data-testid="switch-is-technical"
          />
          <Label htmlFor="isTechnical">I have a technical background</Label>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2"
            data-testid="button-continue-venture"
          >
            {isSubmitting ? "Saving..." : "Next: Venture Info"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}