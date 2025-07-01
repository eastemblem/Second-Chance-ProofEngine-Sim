import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Briefcase,
  DollarSign,
  Folder,
  FileText,
  CheckCircle,
  Star,
  Target,
  Lightbulb,
  BarChart3,
  ThumbsUp,
  AlertTriangle,
  Download,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import ProgressBar from "@/components/progress-bar";
import { ProofScoreResult } from "@shared/schema";

// Import score badges
import Badge01 from "../../assets/badges/score/Badge_01.svg";
import Badge02 from "../../assets/badges/score/Badge_02.svg";
import Badge03 from "../../assets/badges/score/Badge_03.svg";
import Badge04 from "../../assets/badges/score/Badge_04.svg";
import Badge05 from "../../assets/badges/score/Badge_05.svg";
import Badge06 from "../../assets/badges/score/Badge_06.svg";
import Badge07 from "../../assets/badges/score/Badge_07.svg";
import Badge09 from "../../assets/badges/score/Badge_09.svg";

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
  onComplete,
}: AnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionFromAPI, setSessionFromAPI] = useState<any>(null);

  // Extract data from session with comprehensive checking
  console.log("Analysis component received sessionData:", sessionData);
  console.log("SessionData stepData:", sessionData?.stepData);
  console.log("Processing step data:", sessionData?.stepData?.processing);
  
  let scoringResult = sessionData?.scoringResult || 
                     sessionData?.stepData?.processing?.scoringResult || 
                     sessionData?.stepData?.scoringResult ||
                     sessionData?.processing?.scoringResult;
  
  console.log("Initial scoringResult found:", scoringResult);

  const founderData = sessionData?.stepData?.founder;
  const ventureData =
    sessionData?.stepData?.venture?.venture || sessionData?.stepData?.venture;

  console.log("Analysis component - scoringResult:", scoringResult);
  console.log(
    "Analysis component - sessionData keys:",
    Object.keys(sessionData || {}),
  );

  // Try to fetch session data from API if not available
  useEffect(() => {
    if (!scoringResult && sessionId) {
      setIsLoading(true);
      const fetchSessionData = async () => {
        try {
          const response = await fetch(`/api/onboarding/session/${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            console.log("Fetched session data from API:", data);
            setSessionFromAPI(data?.data || data?.session || data);
          }
        } catch (error) {
          console.error("Failed to fetch session data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSessionData();
    }
  }, [sessionId, scoringResult]);

  // Use API data if available (prioritize fresh API data)
  if (sessionFromAPI) {
    const apiScoringResult = sessionFromAPI?.stepData?.processing?.scoringResult ||
                            sessionFromAPI?.stepData?.scoringResult ||
                            sessionFromAPI?.scoringResult;
    if (apiScoringResult) {
      console.log("Using scoring result from API:", apiScoringResult);
      scoringResult = apiScoringResult;
    } else {
      console.log("No scoring result in API data. SessionFromAPI stepData:", sessionFromAPI?.stepData);
      console.log("Full sessionFromAPI:", sessionFromAPI);
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Analysis...</h2>
          <p className="text-muted-foreground">
            Retrieving your scoring results...
          </p>
        </div>
      </div>
    );
  }

  // If still no scoring result, try to use sessionFromAPI data directly
  if (!scoringResult && sessionFromAPI?.stepData?.processing?.scoringResult) {
    scoringResult = sessionFromAPI.stepData.processing.scoringResult;
  }

  // Check if we have valid scoring data
  if (!scoringResult) {
    console.error("No scoring result found in sessionData:", sessionData);
    console.error("No scoring result found in sessionFromAPI:", sessionFromAPI);
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Analysis Not Available</h2>
          <p className="text-muted-foreground">
            Please complete the scoring process first.
          </p>
        </div>
      </div>
    );
  }

  // Use real scoring data only
  const analysisData = {
    total_score:
      scoringResult?.output?.total_score || scoringResult?.total_score || 0,
    categories: scoringResult?.output || {},
    overall_feedback: scoringResult?.output?.overall_feedback || [],
    proofTags: scoringResult?.output?.tags || scoringResult?.tags || [],
  };

  console.log("Analysis data for ProofTags:", analysisData);

  // Extract ProofTags directly from API response
  function extractProofTags(scoringResult: any) {
    console.log("Extracting ProofTags from scoring result:", scoringResult);
    
    // Look for tags in various locations in the API response
    const apiTags = scoringResult?.output?.tags || 
                   scoringResult?.tags || 
                   scoringResult?.output?.proof_tags ||
                   scoringResult?.proof_tags ||
                   [];
    
    console.log("Found API tags:", apiTags);
    
    // Only use tags from the API response, no generation
    return {
      unlocked: apiTags.length,
      total: 10,
      tags: apiTags
    };
  }

  const dimensionColors = {
    desirability: "bg-green-500",
    feasibility: "bg-blue-500",
    viability: "bg-orange-500",
    traction: "bg-yellow-500",
    readiness: "bg-red-500",
  };

  const dimensionLabels = {
    desirability: "🟩 Desirability",
    feasibility: "🟦 Feasibility",
    viability: "🟧 Viability",
    traction: "🟨 Traction",
    readiness: "🟥 Readiness",
  };

  // Extract ProofTags directly from API response
  const extractedProofTags = extractProofTags(scoringResult);
  
  console.log("Extracted ProofTags result:", extractedProofTags);

  // Score badge mapping function
  function getScoreBadge(score: number): string | null {
    const badges = {
      1: Badge01,
      2: Badge02,
      3: Badge03,
      4: Badge04,
      5: Badge05,
      6: Badge06,
      7: Badge07,
      8: Badge07, // Using Badge07 as fallback since Badge08 is missing
      9: Badge09,
    };

    if (score < 10) return null; // No badge for scores below 10
    if (score >= 91) return badges[9]; // Score 91-100 → Badge 9
    
    // Calculate badge number (10-90 maps to badges 1-8)
    const badgeNumber = Math.ceil((score - 10) / 10) + 1;
    const clampedBadgeNumber = Math.min(Math.max(badgeNumber, 1), 9);
    
    return badges[clampedBadgeNumber as keyof typeof badges] || null;
  }

  // Get badge for current score
  const scoreBadge = getScoreBadge(analysisData.total_score);
  const badgeNumber = analysisData.total_score >= 91 ? 9 : Math.ceil((analysisData.total_score - 10) / 10) + 1;

  // Map to ProofScore format for consistency with feedback.tsx
  const proofScore: ProofScoreResult = {
    total: analysisData.total_score,
    dimensions: {
      desirability: analysisData.categories.Problem?.score || analysisData.categories.desirability?.score || 0,
      feasibility: analysisData.categories.product_technology?.score || analysisData.categories.feasibility?.score || 0,
      viability: analysisData.categories.business_model?.score || analysisData.categories.viability?.score || 0,
      traction: analysisData.categories.traction_milestones?.score || analysisData.categories.traction?.score || 0,
      readiness: analysisData.categories.financials_projections_ask?.score || analysisData.categories.readiness?.score || 0,
    },
    prooTags: extractedProofTags,
    insights: {
      strengths:
        scoringResult?.output?.key_insights?.filter(
          (insight: any) => insight.title === "Strong Foundation",
        ) ||
        scoringResult?.key_insights?.filter(
          (insight: any) => insight.title === "Strong Foundation",
        ) ||
        [],
      improvements:
        scoringResult?.output?.key_insights?.filter(
          (insight: any) => insight.title === "Needs Attention",
        ) ||
        scoringResult?.key_insights?.filter(
          (insight: any) => insight.title === "Needs Attention",
        ) ||
        [],
      recommendations:
        scoringResult?.output?.key_insights?.filter(
          (insight: any) => insight.title === "Next Steps",
        ) ||
        scoringResult?.key_insights?.filter(
          (insight: any) => insight.title === "Next Steps",
        ) ||
        [],
    },
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Score Header */}
          <Card className="p-8 border-border bg-card mb-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Your ProofScore is Ready
            </h2>
            
            {/* Score Badge */}
            {scoreBadge && (
              <motion.div
                className="flex justify-center mb-6"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="relative">
                  <img 
                    src={scoreBadge} 
                    alt={`Score Badge ${badgeNumber}`}
                    className="w-32 h-32 drop-shadow-lg"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.1 }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatType: "reverse",
                      delay: 0.5 
                    }}
                  />
                </div>
              </motion.div>
            )}
            
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
              
              {/* Badge Achievement Text */}
              {scoreBadge && (
                <motion.p 
                  className="text-sm text-primary font-medium mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Achievement Badge #{badgeNumber} Unlocked!
                </motion.p>
              )}
            </div>

            {/* ProofTags Tracker */}
            <div className="bg-background rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                ProofTags Unlocked: {proofScore.prooTags.unlocked}/
                {proofScore.prooTags.total}
              </h3>
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: proofScore.prooTags.total }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index < proofScore.prooTags.unlocked
                          ? index % 2 === 0
                            ? "bg-primary"
                            : "bg-primary-gold"
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
                  ),
                )}
              </div>
              {proofScore.prooTags.tags.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {proofScore.prooTags.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Complete more validation steps to unlock ProofTags
                </p>
              )}
            </div>
          </Card>

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Dimension Scores */}
            <Card className="p-6 border-border bg-card">
              <h3 className="text-xl font-semibold mb-6">
                Validation Dimensions
              </h3>
              <div className="space-y-4">
                {Object.entries(proofScore.dimensions).map(
                  ([dimension, score]) => {
                    const maxScores = {
                      desirability: 20,
                      feasibility: 15,
                      viability: 15,
                      traction: 40,
                      readiness: 10,
                    };
                    const maxScore =
                      maxScores[dimension as keyof typeof maxScores];
                    const percentage = (score / maxScore) * 100;

                    return (
                      <div key={dimension}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            {
                              dimensionLabels[
                                dimension as keyof typeof dimensionLabels
                              ]
                            }
                          </span>
                          <span className="text-sm font-bold">
                            {score}/{maxScore}
                          </span>
                        </div>
                        <div className="w-full bg-border rounded-full h-2">
                          <motion.div
                            className={`h-2 rounded-full ${dimensionColors[dimension as keyof typeof dimensionColors]}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </Card>

            {/* Key Insights */}
            <Card className="p-6 border-border bg-card">
              <h3 className="text-xl font-semibold mb-6">Key Insights</h3>
              <div className="space-y-4">
                {proofScore.insights.strengths
                  .slice(0, 2)
                  .map((strength: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <ThumbsUp className="text-green-500 mt-1 w-4 h-4 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-green-400 text-sm">
                          {strength.title || "Strength"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {strength.description || strength}
                        </p>
                      </div>
                    </div>
                  ))}
                {proofScore.insights.improvements
                  .slice(0, 2)
                  .map((improvement: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <AlertTriangle className="text-yellow-500 mt-1 w-4 h-4 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-400 text-sm">
                          {improvement.title || "Area for Improvement"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {improvement.description || improvement}
                        </p>
                      </div>
                    </div>
                  ))}
                {proofScore.insights.recommendations
                  .slice(0, 1)
                  .map((recommendation: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <TrendingUp className="text-primary mt-1 w-4 h-4 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-primary text-sm">
                          {recommendation.title || "Recommendation"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {recommendation.description || recommendation}
                        </p>
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
                <h3 className="text-xl font-semibold mb-2">
                  Your Detailed Analysis Report
                </h3>
                <p className="text-muted-foreground">
                  Comprehensive pitch deck analysis with actionable
                  recommendations
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
            <Button
              onClick={onComplete}
              className="gradient-button px-8 py-6 text-lg"
              size="lg"
            >
              See My Pathway
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
