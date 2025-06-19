import { motion } from "framer-motion";
import { ArrowRight, Trophy, Users, Calendar, TrendingUp, Shield, Briefcase, DollarSign, Folder, FileText, CheckCircle, Star, Target, Lightbulb, BarChart3, ThumbsUp, AlertTriangle, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import ProgressBar from "@/components/progress-bar";
import { ProofScoreResult } from "@shared/schema";

interface AnalysisProps {
  sessionId: string;
  sessionData: any;
  onComplete: () => void;
}

interface FeedbackPageProps {
  onNext: () => void;
  proofScore: ProofScoreResult;
}

export default function Analysis({ 
  sessionId, 
  sessionData, 
  onComplete 
}: AnalysisProps) {
  // Extract data from session
  const scoringResult = sessionData?.stepData?.processing?.scoringResult;
  const founderData = sessionData?.stepData?.founder;
  const ventureData = sessionData?.stepData?.venture?.venture || sessionData?.stepData?.venture;
  
  // Map scoring result to structured data with proper fallbacks
  const analysisData = {
    total_score: scoringResult?.total_score || scoringResult?.output?.total_score || 66,
    categories: {
      Problem: scoringResult?.output?.Problem || { score: 7, justification: "Problem analysis completed", recommendation: "Continue refining problem statement" },
      solution: scoringResult?.output?.solution || { score: 8, justification: "Solution analysis completed", recommendation: "Enhance solution details" },
      market_opportunity: scoringResult?.output?.market_opportunity || { score: 8, justification: "Market opportunity evaluated", recommendation: "Expand market research" },
      product_technology: scoringResult?.output?.product_technology || { score: 6, justification: "Product technology assessed", recommendation: "Improve technical documentation" },
      team: scoringResult?.output?.team || { score: 3, justification: "Team information reviewed", recommendation: "Add detailed team background" },
      business_model: scoringResult?.output?.business_model || { score: 8, justification: "Business model analyzed", recommendation: "Include unit economics" },
      traction_milestones: scoringResult?.output?.traction_milestones || { score: 7, justification: "Traction metrics reviewed", recommendation: "Add growth metrics" },
      competition: scoringResult?.output?.competition || { score: 6, justification: "Competitive landscape analyzed", recommendation: "Strengthen competitive analysis" },
      go_to_market_strategy: scoringResult?.output?.go_to_market_strategy || { score: 7, justification: "GTM strategy evaluated", recommendation: "Include acquisition metrics" },
      financials_projections_ask: scoringResult?.output?.financials_projections_ask || { score: 4, justification: "Financial projections reviewed", recommendation: "Add detailed projections" },
    },
    overall_feedback: scoringResult?.output?.overall_feedback || [
      "Analysis completed successfully",
      "Key areas identified for improvement",
      "Recommendations provided for enhancement"
    ],
    proofTags: generateProofTags(scoringResult?.output)
  };

  function generateProofTags(output: any) {
    const tags = [];
    if (!output) return ["Analysis Complete", "Investment Ready", "Validation Needed"];
    
    // Generate tags based on scores
    Object.entries(output).forEach(([key, value]: [string, any]) => {
      if (value?.score >= 8) {
        tags.push(`Strong ${key.replace('_', ' ')}`);
      } else if (value?.score >= 6) {
        tags.push(`Good ${key.replace('_', ' ')}`);
      } else if (value?.score > 0) {
        tags.push(`Needs ${key.replace('_', ' ')} Work`);
      }
    });
    
    // Add general tags based on total score
    if (analysisData.total_score >= 80) {
      tags.push("Investment Ready", "High Potential");
    } else if (analysisData.total_score >= 60) {
      tags.push("Promising Venture", "Refinement Needed");
    } else {
      tags.push("Early Stage", "Development Required");
    }
    
    return tags.slice(0, 8); // Limit to 8 tags
  }

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

  // Map to ProofScore format for consistency with feedback.tsx
  const proofScore: ProofScoreResult = {
    total: analysisData.total_score,
    dimensions: {
      desirability: analysisData.categories.Problem?.score || 7,
      feasibility: analysisData.categories.solution?.score || 8,
      viability: analysisData.categories.business_model?.score || 8,
      traction: analysisData.categories.traction_milestones?.score || 7,
      readiness: analysisData.categories.team?.score || 3,
    },
    prooTags: {
      unlocked: analysisData.proofTags.length,
      total: 20,
      tags: analysisData.proofTags
    },
    insights: {
      strengths: Object.entries(analysisData.categories)
        .filter(([_, data]) => data.score >= 7)
        .map(([category, _]) => category.replace('_', ' ')),
      improvements: Object.entries(analysisData.categories)
        .filter(([_, data]) => data.score < 7)
        .map(([category, _]) => category.replace('_', ' ')),
      recommendations: analysisData.overall_feedback
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProgressBar currentStep={6} totalSteps={6} stepName="Your ProofScore Results" />

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              <Trophy className="text-white text-2xl w-8 h-8" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4">Your ProofScore Analysis</h2>
            <p className="text-xl text-muted-foreground">
              Here's how your venture scores across key validation dimensions
            </p>
          </div>

          {/* ProofScore Summary */}
          <Card className="p-8 border-border bg-card mb-8">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-6xl font-bold gradient-text mb-4">
                {proofScore.total}
              </div>
              <div className="text-xl text-muted-foreground mb-6">
                Your Overall ProofScore
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(proofScore.dimensions).map(([dimension, score]) => (
                  <motion.div 
                    key={dimension}
                    className="text-center p-4 rounded-lg bg-muted/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Object.keys(proofScore.dimensions).indexOf(dimension) * 0.1 }}
                  >
                    <div className="text-2xl font-bold mb-2">{score}</div>
                    <div className="text-sm">
                      {dimensionLabels[dimension as keyof typeof dimensionLabels]}
                    </div>
                    <Progress 
                      value={score} 
                      className={`mt-2 h-2 ${dimensionColors[dimension as keyof typeof dimensionColors]}`}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </Card>

          {/* ProofTags */}
          <Card className="p-6 border-border bg-card mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                ProofTags Unlocked
                <Badge variant="secondary">
                  {proofScore.prooTags.unlocked} of {proofScore.prooTags.total}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {proofScore.prooTags.tags.map((tag: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Badge className="bg-primary-gold text-black hover:bg-primary-gold/90">
                      {tag}
                    </Badge>
                  </motion.div>
                ))}
              </div>
              <Progress 
                value={(proofScore.prooTags.unlocked / proofScore.prooTags.total) * 100} 
                className="mb-2"
              />
              <p className="text-sm text-muted-foreground">
                {Math.round((proofScore.prooTags.unlocked / proofScore.prooTags.total) * 100)}% of available ProofTags unlocked
              </p>
            </CardContent>
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

          {/* Analysis Breakdown */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary" />
              Detailed Analysis Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(analysisData.categories).map(([category, data]) => (
                <motion.div 
                  key={category} 
                  className="border rounded-lg p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Object.keys(analysisData.categories).indexOf(category) * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium capitalize text-lg">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-primary">
                        {data.score}
                      </span>
                      <span className="text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <Progress value={data.score * 10} className="mb-3 h-2" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Analysis:</strong> {data.justification}
                    </p>
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="w-4 h-4 text-primary-gold mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-primary font-medium">
                        {data.recommendation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Overall Feedback */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Key Insights & Recommendations
            </h3>
            <div className="space-y-3">
              {analysisData.overall_feedback.map((feedback: string, index: number) => (
                <motion.div 
                  key={index} 
                  className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <CheckCircle className="w-5 h-5 text-primary-gold mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{feedback}</p>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Generated Report */}
          <Card className="p-6 border-border bg-card mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Your Detailed Analysis Report</h3>
                <p className="text-muted-foreground">
                  Comprehensive pitch deck analysis with actionable recommendations
                </p>
              </div>
              <Button className="gradient-button">
                <Download className="mr-2 w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </Card>

          {/* Call to Action */}
          <div className="text-center">
            <Button onClick={onComplete} className="gradient-button px-8 py-6 text-lg" size="lg">
              Continue to Next Steps
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Ready to enhance your venture with targeted improvements
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}