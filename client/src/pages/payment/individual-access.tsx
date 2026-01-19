import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, TrendingUp, Users, Target, Award } from "lucide-react";
import Logo from "@/components/logo";
import Layout from "@/components/layout/layout";
import { PreOnboardingPaymentModal } from "@/components/ui/pre-onboarding-payment-modal";
import { captureUTMParams, getStoredUTMParams, type UTMParams } from "@/lib/analytics";

const paymentFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function IndividualAccessPayment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData | null>(null);
  const [utmParams, setUtmParams] = useState<UTMParams | null>(null);

  useEffect(() => {
    const captured = captureUTMParams();
    if (captured) {
      setUtmParams(captured);
    } else {
      setUtmParams(getStoredUTMParams());
    }
  }, []);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    setPaymentFormData(data);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (reservationToken: string) => {
    setIsPaymentModalOpen(false);
    toast({
      title: "Payment Successful",
      description: "Redirecting you to create your account...",
    });
    setLocation(`/onboarding?token=${reservationToken}`);
  };

  const handlePaymentClose = () => {
    setIsPaymentModalOpen(false);
  };

  const residencyResults = [
    { icon: TrendingUp, text: "80% commercial traction achieved (partner or customers signed)" },
    { icon: Users, text: "100% received 2x investor introductions" },
    { icon: Target, text: "$1m raised from the program" },
    { icon: Award, text: "100% reached investor ready score" },
  ];

  const platformFeatures = [
    "ProofScore",
    "ProofTags", 
    "ProofPlan",
    "ProofVault",
    "ProofCoach",
    "Validation Reports for Investors",
  ];

  return (
    <Layout className="bg-gradient-to-br from-background via-card to-background">
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center md:text-left space-y-6">
              <div className="logo-container mb-4 flex justify-center">
                <Logo size="lg" />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">
                  Our last Residency program delivered the following results:
                </h3>
                <ul className="space-y-3">
                  {residencyResults.map((result, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <result.icon className="w-5 h-5 text-primary-gold shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{result.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="text-lg font-semibold text-foreground">
                  Your payment today includes:
                </h3>
                <p className="text-sm text-muted-foreground">
                  Full access to our platform and features for one year:
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {platformFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Direct access and onboarding to a Second Chance program running throughout the year at no extra cost.
                </p>
                <p className="text-lg font-semibold text-primary-gold">
                  All for just $99 today.
                </p>
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
                      data-testid="button-pay"
                    >
                      Pay $99 - Get Started
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

      {paymentFormData && (
        <PreOnboardingPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          customerEmail={paymentFormData.email}
          customerName={paymentFormData.name}
          customerPhone={paymentFormData.phone}
          utmParams={utmParams}
        />
      )}
    </Layout>
  );
}
