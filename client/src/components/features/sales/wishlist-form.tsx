import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, Users, Building, User, Mail, Phone, Briefcase } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertProofScalingWishlistSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { z } from "zod";
import "react-phone-number-input/style.css";

type WishlistFormData = z.infer<typeof insertProofScalingWishlistSchema>;

interface WishlistFormProps {
  onSuccess?: () => void;
}

export function WishlistForm({ onSuccess }: WishlistFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<WishlistFormData>({
    resolver: zodResolver(insertProofScalingWishlistSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      companyName: "",
      role: "",
      organizationStage: "Idea Stage",
    },
  });

  const joinWishlistMutation = useMutation({
    mutationFn: async (data: WishlistFormData) => {
      const response = await apiRequest("POST", "/api/proofscaling-wishlist", data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#fbbf24', '#ffffff']
      });
      
      // Show success toast
      toast({
        title: "Success!",
        description: "You've successfully joined the ProofScaling waitlist!",
        variant: "success",
      });
      
      setShowSuccess(true);
      form.reset();
      onSuccess?.(); // This will trigger the email popup in parent component
    },
    onError: (error: any) => {
      // The apiRequest function already extracts user-friendly error messages
      let errorMessage = error?.message || "Failed to join waitlist. Please try again.";
      
      // Check specifically for duplicate email error
      if (errorMessage.includes("Email already exists") || errorMessage.includes("already exists in the waitlist")) {
        toast({
          title: "Already registered",
          description: "You're already on our waitlist! We'll contact you soon.",
          variant: "success",
        });
      } else {
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: WishlistFormData) => {
    joinWishlistMutation.mutate(data);
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-card rounded-xl border-2 border-green-500/20"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-foreground mb-2">
          You're on the list!
        </h3>
        <p className="text-muted-foreground">
          Thanks for joining our ProofScaling cohort. Our team will connect with you soon to discuss next steps.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-card/30 backdrop-blur-sm border-2 border-white/20 rounded-xl p-6">
        <div className="text-center mb-6">
          <Users className="w-12 h-12 text-purple-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            Join Next Cohort
          </h3>
          <p className="text-sm text-muted-foreground">
            All fields are required to secure your spot
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={(e) => {
            console.log("Form submit event triggered");
            console.log("Form state:", form.getValues());
            console.log("Form errors before submit:", form.formState.errors);
            form.handleSubmit(onSubmit)(e);
          }} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium">
                    <User className="w-4 h-4" />
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full name"
                      {...field}
                      className="bg-background/50 border-white/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                      className="bg-background/50 border-white/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <PhoneInput
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry="US"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your phone number"
                      className="phone-input bg-background/50 border border-white/20 rounded-md px-3 py-2"
                      style={{
                        '--PhoneInputCountryFlag-height': '1em',
                        '--PhoneInputCountrySelectArrow-color': '#6b7280',
                      }}
                      error={field.value && field.value.replace(/\D/g, '').length < 7 ? 'INVALID' : undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium">
                    <Building className="w-4 h-4" />
                    Company/Organization Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter company or organization name"
                      {...field}
                      className="bg-background/50 border-white/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium">
                    <Briefcase className="w-4 h-4" />
                    Role in Organization
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Founder, CEO, Product Manager"
                      {...field}
                      className="bg-background/50 border-white/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Stage of Organization
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50 border-white/20">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Idea Stage">Idea Stage</SelectItem>
                      <SelectItem value="Pre-Product">Pre-Product</SelectItem>
                      <SelectItem value="MVP">MVP</SelectItem>
                      <SelectItem value="Early Traction">Early Traction</SelectItem>
                      <SelectItem value="Growth Stage">Growth Stage</SelectItem>
                      <SelectItem value="Scaling">Scaling</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={joinWishlistMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-semibold py-3"
            >
              {joinWishlistMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining Waitlist...
                </>
              ) : (
                "Join Next Cohort"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}