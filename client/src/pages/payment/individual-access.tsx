import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";
import Logo from "@/components/logo";
import Layout from "@/components/layout/layout";

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

  const socialProofMetrics = [
    { value: "$2.3M+", label: "Follow-on Funding" },
    { value: "1000+", label: "Founders Validated" },
    { value: "85%", label: "Success Rate" }
  ];

  return (
    <Layout className="bg-gradient-to-br from-background via-card to-background">
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center md:text-left space-y-6">
              <div className="logo-container mb-4 flex justify-center md:justify-start">
                <Logo size="lg" />
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                <span className="gradient-text">
                  Rejection isn't failure.
                </span>
                <br />
                <span className="text-foreground">It's missing proof.</span>
              </h2>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">
                Turn investor rejection into validation and funding through our data-backed ProofSync™ framework.
              </p>

              <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-md mx-auto md:mx-0">
                {socialProofMetrics.map((metric, index) => (
                  <div key={index} className="text-center" data-testid={`metric-${index}`}>
                    <div className="text-xl sm:text-2xl font-bold text-primary-gold">
                      {metric.value}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground leading-tight">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/30">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary">Secure Payment via PayTabs</span>
                </div>
              </div>
            </div>

            <Card className="bg-card/50 border-primary/30 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-foreground">Platform Access</CardTitle>
                <CardDescription className="text-muted-foreground">
                  One-time payment for full access
                </CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold text-foreground">$99</span>
                  <span className="text-muted-foreground ml-2">USD</span>
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
                          <FormLabel className="text-muted-foreground">Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John Doe"
                              className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/50"
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
                          <FormLabel className="text-muted-foreground">Email Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="john@example.com"
                              className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/50"
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
                          <FormLabel className="text-muted-foreground">Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="+971 50 123 4567"
                              className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/50"
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full gradient-button py-6 text-lg font-semibold"
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

                    <p className="text-xs text-center text-muted-foreground pt-2">
                      By proceeding, you agree to our{" "}
                      <a href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
