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
}

export default function FounderOnboarding({ 
  sessionId, 
  initialData, 
  onNext, 
  onDataUpdate 
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
      console.log("🚀 Initiating founder onboarding API request:", {
        timestamp: new Date().toISOString(),
        sessionId,
        endpoint: "/api/onboarding/founder",
        method: "POST",
        requestData: {
          ...data,
          email: data.email // Log email for debugging
        }
      });

      const res = await apiRequest("POST", "/api/onboarding/founder", {
        sessionId,
        ...data
      });
      
      console.log("📨 Raw API response received:", {
        timestamp: new Date().toISOString(),
        sessionId,
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        ok: res.ok
      });

      return await res.json();
    },
    onSuccess: async (data) => {
      console.log("🔄 Founder onboarding API response received:", {
        timestamp: new Date().toISOString(),
        success: data.success,
        sessionId,
        responseData: data,
        responseStructure: {
          hasSuccess: 'success' in data,
          hasError: 'error' in data,
          hasMessage: 'message' in data,
          keys: Object.keys(data)
        }
      });

      if (data.success) {
        console.log("✅ Founder onboarding successful:", {
          timestamp: new Date().toISOString(),
          sessionId,
          founderData: data.founder || 'No founder data in response',
          nextStep: 'venture_info'
        });

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
      } else {
        console.warn("❌ Founder onboarding response indicates failure:", {
          timestamp: new Date().toISOString(),
          sessionId,
          response: data,
          message: data.message || 'No message provided'
        });
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
          errorType: errorResponse.errorType,
          hasErrorField: 'error' in errorResponse,
          hasMessageField: 'message' in errorResponse,
          hasSuggestionField: 'suggestion' in errorResponse
        });

        // The API returns { error: "message", errorType: "type", suggestion: "suggestion" }
        const { error: responseError, errorType, suggestion, message } = errorResponse;
        
        // Handle email validation errors (personal, temp, suspicious)
        if (errorType && ['personal_email', 'temp_email', 'suspicious_pattern'].includes(errorType)) {
          const errorMsg = responseError || message || "Invalid email address";
          
          console.warn("📧 Email validation error detected:", {
            timestamp: new Date().toISOString(),
            sessionId,
            errorType,
            errorMessage: errorMsg,
            suggestion,
            emailValue: form.getValues("email")
          });
          
          // Set field-specific error
          setEmailError(errorMsg);
          
          // Set form field error for styling
          form.setError("email", {
            type: "manual",
            message: errorMsg
          });
          
          // Show toast with specific guidance
          const errorTitles = {
            personal_email: "Business Email Required",
            temp_email: "Permanent Email Required", 
            suspicious_pattern: "Invalid Email Address"
          };
          
          toast({
            title: errorTitles[errorType] || "Email Validation Error",
            description: suggestion || errorMsg,
            variant: "destructive",
          });
          return;
        }
        
        // Handle email validation errors without errorType (fallback check)
        if (responseError && (
          responseError.includes('business email') || 
          responseError.includes('personal email') ||
          responseError.includes('temporary') ||
          responseError.includes('temp')
        )) {
          // Set field-specific error
          setEmailError(responseError);
          
          // Set form field error for styling
          form.setError("email", {
            type: "manual",
            message: responseError
          });
          
          // Show toast with specific guidance
          toast({
            title: "Business Email Required",
            description: suggestion || responseError,
            variant: "destructive",
          });
          return;
        }
        
        // Handle email already taken error (409 status)
        if (responseError === "Email already taken" || message === "A user with this email address already exists") {
          console.warn("📧 Email already exists error:", {
            timestamp: new Date().toISOString(),
            sessionId,
            errorMessage: responseError || message,
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
        
        // Handle other structured errors
        errorMessage = responseError || message || errorMessage;
      }
      
      // Check if this is an email duplicate error (fallback for string-based detection)
      if (errorMessage.includes("Email already taken")) {
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
              className={`mt-1 ${form.formState.errors.email || emailError ? 'border-red-500' : ''}`}
              placeholder="john@example.com"
              onChange={(e) => {
                form.register("email").onChange(e);
                // Clear email error when user starts typing
                if (emailError) {
                  setEmailError(null);
                  form.clearErrors("email");
                }
              }}
            />
            {(form.formState.errors.email || emailError) && (
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