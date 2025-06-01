import { motion } from "framer-motion";
import { ArrowRight, Download, ThumbsUp, AlertTriangle, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ProgressBar from "@/components/progress-bar";
import { ProofScore } from "@shared/schema";

interface FeedbackPageProps {
  onNext: () => void;
  proofScore: ProofScore;
}

export default function FeedbackPage({ onNext, proofScore }: FeedbackPageProps) {
  const dimensionColors = {
    desirability: "bg-green-500",
    feasibility: "bg-blue-500",
    viability: "bg-orange-500",
    traction: "bg-yellow-500",
    readiness: "bg-red-500"
  };

  const dimensionLabels = {
    desirability: "🟩 Desirability",
    feasibility: "🟦 Feasibility", 
    viability: "🟧 Viability",
    traction: "🟨 Traction",
    readiness: "🟥 Readiness"
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProgressBar currentStep={3} totalSteps={4} stepName="Your ProofScore" />

          {/* Score Header */}
          <Card className="p-8 border-border bg-card mb-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Your ProofScore is Ready</h2>
            <div className="mb-6">
              <motion.div 
                className="text-6xl font-black gradient-text mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {proofScore.total}
              </motion.div>
              <p className="text-xl text-muted-foreground">out of 100</p>
            </div>
            
            {/* ProofTags Tracker */}
            <div className="bg-background rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                ProofTags Unlocked: {proofScore.prooTags.unlocked}/{proofScore.prooTags.total}
              </h3>
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: proofScore.prooTags.total }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < proofScore.prooTags.unlocked
                        ? index % 2 === 0 ? "bg-primary" : "bg-primary-gold"
                        : "bg-border"
                    }`}
                  >
                    {index < proofScore.prooTags.unlocked ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-white"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </motion.div>
                    ) : (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {proofScore.prooTags.tags.join(" • ")}
              </p>
            </div>
          </Card>

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Dimension Scores */}
            <Card className="p-6 border-border bg-card">
              <h3 className="text-xl font-semibold mb-6">Validation Dimensions</h3>
              <div className="space-y-4">
                {Object.entries(proofScore.dimensions).map(([dimension, score]) => (
                  <div key={dimension}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        {dimensionLabels[dimension as keyof typeof dimensionLabels]}
                      </span>
                      <span className="text-sm font-bold">{score}/20</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${dimensionColors[dimension as keyof typeof dimensionColors]}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(score / 20) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Key Insights */}
            <Card className="p-6 border-border bg-card">
              <h3 className="text-xl font-semibold mb-6">Key Insights</h3>
              <div className="space-y-4">
                {proofScore.insights.strengths.slice(0, 1).map((strength, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <ThumbsUp className="text-green-500 mt-1 w-4 h-4 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-400 text-sm">Strong Foundation</h4>
                      <p className="text-sm text-muted-foreground">{strength}</p>
                    </div>
                  </div>
                ))}
                {proofScore.insights.improvements.slice(0, 1).map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <AlertTriangle className="text-yellow-500 mt-1 w-4 h-4 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-400 text-sm">Needs Attention</h4>
                      <p className="text-sm text-muted-foreground">{improvement}</p>
                    </div>
                  </div>
                ))}
                {proofScore.insights.recommendations.slice(0, 1).map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <TrendingUp className="text-primary mt-1 w-4 h-4 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-primary text-sm">Next Steps</h4>
                      <p className="text-sm text-muted-foreground">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Generated Report */}
          <Card className="p-6 border-border bg-card mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Your Detailed Founder Report</h3>
                <p className="text-muted-foreground">
                  Comprehensive analysis with actionable recommendations
                </p>
              </div>
              <Button className="gradient-button">
                <Download className="mr-2 w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </Card>

          {/* Continue Button */}
          <div className="text-center">
            <Button onClick={onNext} className="gradient-button px-8 py-6 text-lg" size="lg">
              See My Pathway
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
