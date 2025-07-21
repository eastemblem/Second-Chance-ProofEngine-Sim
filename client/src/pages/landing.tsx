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
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Logo Section */}
          <div className="mb-2">
            <div className="inline-flex items-center justify-center">
              <Logo size="lg" />
            </div>
          </div>

          {/* Hero Message */}
          <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            <span className="gradient-text">
              Rejection isn't failure.
            </span>
            <br />
            <span className="text-foreground">It's missing proof.</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Turn investor rejection into validation and funding through our data-backed ProofSync™ framework. 
            Join 1000+ founders who've converted rejection into success.
          </p>

          {/* Social Proof */}
          <div className="grid grid-cols-3 gap-8 mb-12 max-w-xl mx-auto">
            {socialProofMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-primary-gold">
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div>
            <Button
              onClick={handleStartValidation}
              className="gradient-button px-8 py-6 text-lg"
              size="lg"
            >
              Start My Validation
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <p className="text-sm text-muted-foreground mt-4">
              Free ProofScore assessment • No credit card required
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
