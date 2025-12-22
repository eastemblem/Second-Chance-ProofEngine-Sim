import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Shield, Rocket, Users, Award } from "lucide-react";

const paymentFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface InitiatePaymentResponse {
  success: boolean;
  paymentUrl?: string;
  reservationToken?: string;
  orderReference?: string;
  error?: string;
}

export default function IndividualAccessPayment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
    },
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest(
        "POST",
        "/api/v1/pre-onboarding-payments/initiate",
        data
      );
      return response.json() as Promise<InitiatePaymentResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        setIsRedirecting(true);
        toast({
          title: "Redirecting to payment...",
          description: "You'll be taken to our secure payment gateway.",
        });
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Payment Error",
          description: data.error || "Failed to initiate payment. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    initiatePaymentMutation.mutate(data);
  };

  const features = [
    { icon: Rocket, text: "Full Platform Access" },
    { icon: CheckCircle, text: "ProofScore Analysis" },
    { icon: Users, text: "Investor Matching (when qualified)" },
    { icon: Award, text: "Validation Certificate" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 text-white">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">
            Join Second Chance
          </h1>
          <p className="text-gray-300 text-lg">
            Get access to our startup validation platform and start your journey to investor readiness.
          </p>
          
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3" data-testid={`feature-item-${index}`}>
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-gray-200">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/30">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Secure Payment via PayTabs</span>
            </div>
          </div>
        </div>

        <Card className="bg-gray-800/50 border-purple-500/30 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Platform Access</CardTitle>
            <CardDescription className="text-gray-400">
              One-time payment for full access
            </CardDescription>
            <div className="pt-4">
              <span className="text-5xl font-bold text-white">$99</span>
              <span className="text-gray-400 ml-2">USD</span>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John Doe"
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                          data-testid="input-name"
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
                      <FormLabel className="text-gray-300">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="john@example.com"
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="+971 50 123 4567"
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-6 text-lg font-semibold"
                  disabled={initiatePaymentMutation.isPending || isRedirecting}
                  data-testid="button-pay"
                >
                  {initiatePaymentMutation.isPending || isRedirecting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isRedirecting ? "Redirecting..." : "Processing..."}
                    </>
                  ) : (
                    "Pay $99 - Get Started"
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 pt-2">
                  By proceeding, you agree to our{" "}
                  <a href="/terms" className="text-purple-400 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-purple-400 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
