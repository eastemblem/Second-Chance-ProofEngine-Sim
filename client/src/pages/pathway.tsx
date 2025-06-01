import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ProgressBar from "@/components/progress-bar";
import { ProofScore } from "@shared/schema";

interface PathwayPageProps {
  onNext: () => void;
  proofScore: ProofScore;
}

export default function PathwayPage({ onNext, proofScore }: PathwayPageProps) {
  const isInvestorReady = proofScore.total >= 80;
  const projectedScore = Math.min(95, proofScore.total + 18 + Math.floor(Math.random() * 10));

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProgressBar currentStep={4} totalSteps={4} stepName="Your Next Steps" />

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Your Recommended Pathway</h2>
            <p className="text-xl text-muted-foreground">
              Based on your ProofScore of {proofScore.total}, here's what we recommend
            </p>
          </div>

          {/* Pathway Card */}
          <Card className="p-8 border-border bg-card mb-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="text-white text-2xl w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {isInvestorReady ? "Investor Matching" : "ProofScaling Course"}
              </h3>
              <p className="text-muted-foreground">
                {isInvestorReady 
                  ? "You're investor-ready! Connect with our network of pre-seed and seed investors."
                  : "You're close to investor-ready! Complete our validation framework to unlock your full potential."
                }
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 mb-6">
              <h4 className="font-semibold mb-4">What you'll get:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isInvestorReady ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-primary w-4 h-4" />
                      <span className="text-sm">Direct investor introductions</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-primary w-4 h-4" />
                      <span className="text-sm">Optimized pitch deck review</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-primary w-4 h-4" />
                      <span className="text-sm">Due diligence preparation</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-primary w-4 h-4" />
                      <span className="text-sm">Term sheet negotiation support</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-primary w-4 h-4" />
                      <span className="text-sm">Structured validation framework</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-primary w-4 h-4" />
                      <span className="text-sm">1:1 founder coaching calls</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-primary w-4 h-4" />
                      <span className="text-sm">ProofVault data room setup</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-primary w-4 h-4" />
                      <span className="text-sm">Investor introduction network</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isInvestorReady && (
              <div className="gradient-border rounded-lg mb-6">
                <div className="gradient-border-inner p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Special Offer</div>
                  <div className="text-2xl font-bold text-primary-gold mb-2">$99 Credit Applied</div>
                  <div className="text-sm text-muted-foreground">
                    For being part of the Second Chance program
                  </div>
                </div>
              </div>
            )}

            {/* Projected Outcome */}
            <div className="border border-border rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-3">
                {isInvestorReady ? "Expected Timeline:" : "Projected Outcome:"}
              </h4>
              {isInvestorReady ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Investor meetings:</span>
                    <span className="font-bold text-primary-gold">2-4 weeks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Term sheet:</span>
                    <span className="font-bold text-primary-gold">6-8 weeks</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Current ProofScore:</span>
                    <span className="font-bold text-primary">{proofScore.total}/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>After ProofScaling:</span>
                    <span className="font-bold text-primary-gold">{projectedScore}/100</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Alternative Option */}
          <Card className="p-6 border-border bg-card mb-8 opacity-75">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold mb-2">Not Ready Yet?</h4>
                <p className="text-sm text-muted-foreground">
                  Download your free ProofVault template and work on validation independently
                </p>
              </div>
              <Button variant="outline" className="border-border">
                <Download className="mr-2 w-4 h-4" />
                Download Template
              </Button>
            </div>
          </Card>

          {/* Final CTA */}
          <div className="text-center">
            <Button onClick={onNext} className="gradient-button px-8 py-6 text-lg mb-4" size="lg">
              {isInvestorReady ? "Access Deal Room" : "Start ProofScaling Course"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground">
              30-day money-back guarantee • Join 1000+ successful founders
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
