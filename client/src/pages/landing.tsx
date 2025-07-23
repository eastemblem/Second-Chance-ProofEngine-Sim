import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";

interface LandingPageProps {
  onNext: () => void;
}

export default function LandingPage({ onNext }: LandingPageProps) {
  const [, setLocation] = useLocation();

  const handleStartValidation = () => {
    setLocation("/onboarding-flow");
  };

  // Inline social proof data to avoid import
  const socialProofMetrics = [
    { value: "$2.3M+", label: "Follow-on Funding" },
    { value: "1000+", label: "Founders Validated" },
    { value: "85%", label: "Success Rate" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-card to-background py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Logo Section */}
          <div className="logo-container mb-2">
            <Logo size="lg" />
          </div>

          {/* Hero Message */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="gradient-text">
              Rejection isn't failure.
            </span>
            <br />
            <span className="text-foreground">It's missing proof.</span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
            Turn investor rejection into validation and funding through our data-backed ProofSync™ framework. 
            Join 1000+ founders who've converted rejection into success.
          </p>

          {/* Social Proof */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12 max-w-xl mx-auto">
            {socialProofMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary-gold">
                  {metric.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground leading-tight">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4 sm:space-y-6">
            <Button
              onClick={handleStartValidation}
              className="gradient-button px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
              size="lg"
            >
              Start My Validation
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <p className="text-xs sm:text-sm text-muted-foreground px-4">
              Free ProofScore assessment • No credit card required
            </p>

            <div className="pt-3 sm:pt-4 border-t border-border/20 px-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Already have an account?
                </p>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/login')}
                  className="px-4 py-2 text-xs sm:text-sm border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-background w-full sm:w-auto"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 sm:mt-0">
        <Footer />
      </div>
    </div>
  );
}
