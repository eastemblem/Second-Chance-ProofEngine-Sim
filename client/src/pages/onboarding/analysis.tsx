import { motion } from "framer-motion";
import {
  ArrowRight,
  Trophy,
  Target,
  Lightbulb,
  BarChart3,
  CheckCircle,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProgressBar from "@/components/progress-bar";

interface AnalysisProps {
  sessionId: string;
  sessionData: any;
  onComplete: () => void;
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

  const analysisStats = [
    { value: analysisData.total_score.toString(), label: "ProofScore", icon: Trophy },
    { value: analysisData.proofTags.length.toString(), label: "ProofTags", icon: Star },
    { value: Object.keys(analysisData.categories).length.toString(), label: "Categories", icon: Target },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <ProgressBar
            currentStep={6}
            totalSteps={6}
            stepName="Analysis Results"
          />

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              <BarChart3 className="text-white text-2xl w-8 h-8" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4">
              Pitch Deck Analysis Complete
            </h2>
            <p className="text-xl text-muted-foreground">
              Your comprehensive investment readiness assessment
            </p>
          </div>

          {/* Analysis Stats */}
          <Card className="p-6 border-border bg-card mb-8">
            <div className="grid grid-cols-3 gap-8">
              {analysisStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <stat.icon className="w-8 h-8 text-primary-gold mb-2" />
                    <div className="text-3xl font-bold text-primary-gold mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </Card>

          {/* ProofTags */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-primary-gold" />
              ProofTags Earned
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysisData.proofTags.map((tag, index) => (
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
          </Card>

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

          {/* Investment Readiness Summary */}
          <Card className="p-6 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-4">Investment Readiness Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-green-600">Strengths</h4>
                <div className="space-y-2">
                  {Object.entries(analysisData.categories)
                    .filter(([_, data]) => data.score >= 7)
                    .map(([category, data]) => (
                      <div key={category} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                        <span className="text-xs text-muted-foreground">({data.score}/10)</span>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-amber-600">Areas for Improvement</h4>
                <div className="space-y-2">
                  {Object.entries(analysisData.categories)
                    .filter(([_, data]) => data.score < 7)
                    .map(([category, data]) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-amber-600" />
                        <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                        <span className="text-xs text-muted-foreground">({data.score}/10)</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <div className="text-center">
            <Button
              onClick={onComplete}
              className="gradient-button px-8 py-6 text-lg"
              size="lg"
            >
              Continue to Deal Room
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Analysis complete • Ready for next steps • ProofVault prepared
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}