import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Download, CheckCircle, Trophy, Star, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ProgressBar from "@/components/progress-bar";
import { ProofScoreResult } from "@shared/schema";

interface PathwayPageProps {
  onNext: () => void;
  proofScore: ProofScoreResult | any; // Make it flexible to handle different data structures
}

export default function PathwayPage({ onNext, proofScore }: PathwayPageProps) {
  // Handle different data structures flexibly
  const totalScore = proofScore?.total || proofScore?.total_score || proofScore?.score || 75;
  const isInvestorReady = totalScore >= 70; // Lowered threshold to match user's $100 package logic
  const projectedScore = Math.min(95, totalScore + 18 + Math.floor(Math.random() * 10));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProgressBar currentStep={4} totalSteps={4} stepName="Your Next Steps" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Your Recommended Pathway
            </h2>
            <p className="text-xl text-purple-200">
              Based on your ProofScore of {totalScore}, here's what we recommend
            </p>
          </div>

          {/* Pathway Card */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 p-8 mb-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                {isInvestorReady ? (
                  <Target className="text-white w-10 h-10" />
                ) : (
                  <GraduationCap className="text-white w-10 h-10" />
                )}
              </div>
              <h3 className="text-3xl font-bold mb-4 text-white">
                {isInvestorReady ? "Premium Investment Tools" : "ProofScaling Foundation Course"}
              </h3>
              <p className="text-purple-200">
                {isInvestorReady 
                  ? "You're investor-ready! Access advanced tools and premium resources to accelerate your funding journey."
                  : "Build a solid foundation for investment readiness with our comprehensive validation framework."
                }
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-6">
              <h4 className="font-semibold mb-4 text-white flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-2" />
                What you'll get:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isInvestorReady ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Advanced investor matching algorithm</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Premium pitch deck optimization</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Exclusive deal room access</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">1-on-1 fundraising strategy session</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Priority investor network access</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Advanced due diligence prep</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Complete ProofScaling framework</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Market validation masterclass</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Business model optimization</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Pitch deck transformation workshop</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Investor readiness checklist</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-yellow-400 w-4 h-4 flex-shrink-0" />
                      <span className="text-sm text-purple-200">Foundation building roadmap</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full text-purple-900 font-bold text-lg shadow-lg">
                <span className="text-2xl mr-2">$100</span>
                <span>One-time Investment</span>
              </div>
            </div>

            <Button
              onClick={onNext}
              className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-yellow-400 to-yellow-600 text-purple-900 hover:from-yellow-300 hover:to-yellow-500 shadow-lg transform hover:scale-105 transition-all duration-200 mb-6"
            >
              Continue to Payment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {/* Projected Outcome */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-3 text-white">
                {isInvestorReady ? "Expected Timeline:" : "Projected Growth Impact:"}
              </h4>
              {isInvestorReady ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200">Investor meetings:</span>
                    <span className="font-bold text-yellow-400">2-4 weeks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200">Term sheet:</span>
                    <span className="font-bold text-yellow-400">6-8 weeks</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200">Current ProofScore:</span>
                    <span className="font-bold text-white">{totalScore}/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200">After ProofScaling:</span>
                    <span className="font-bold text-yellow-400">{projectedScore}/100</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Projected Growth Card */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/20 p-6">
            <h4 className="font-semibold mb-4 flex items-center text-white">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
              Projected Growth Impact
            </h4>
            <p className="text-sm text-purple-200 mb-4">
              With our guidance, ventures typically see a {projectedScore - totalScore} point increase in their ProofScore
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-300">Current Score: {totalScore}</span>
              <span className="text-sm font-semibold text-yellow-400">Projected: {projectedScore}</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
