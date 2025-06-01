import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { socialProofMetrics } from "@/lib/data";

interface LandingPageProps {
  onNext: () => void;
}

export default function LandingPage({ onNext }: LandingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo Section */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <Logo size="lg" />
            </div>
          </div>

          {/* Hero Message */}
          <motion.h2 
            className="text-5xl md:text-6xl font-black mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="gradient-text">
              Rejection isn't failure.
            </span>
            <br />
            <span className="text-foreground">It's missing proof.</span>
          </motion.h2>

          <motion.p 
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Turn investor rejection into validation and funding through our data-backed ProofSync™ framework. 
            Join 1000+ founders who've converted rejection into success.
          </motion.p>

          {/* Social Proof */}
          <motion.div 
            className="grid grid-cols-3 gap-8 mb-12 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
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
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Button
              onClick={onNext}
              className="gradient-button px-8 py-6 text-lg"
              size="lg"
            >
              Start My Validation
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <p className="text-sm text-muted-foreground mt-4">
              Free ProofScore assessment • No credit card required
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
