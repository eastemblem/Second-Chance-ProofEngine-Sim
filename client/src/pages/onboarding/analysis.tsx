import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Download,
  Share2
} from "lucide-react";

interface AnalysisScreenProps {
  sessionId: string;
  sessionData: any;
  onComplete: () => void;
}

export default function AnalysisScreen({ 
  sessionId, 
  sessionData, 
  onComplete 
}: AnalysisScreenProps) {
  // Extract data from session
  const scoringResult = sessionData?.stepData?.processing?.scoringResult;
  const founderData = sessionData?.stepData?.founder;
  const ventureData = sessionData?.stepData?.venture;
  
  // Mock ProofScore data (replace with actual scoring result)
  const proofScore = {
    total: scoringResult?.total_score || 78,
    dimensions: {
      problem: scoringResult?.output?.Problem?.score || 85,
      solution: scoringResult?.output?.solution?.score || 75,
      market: scoringResult?.output?.market_opportunity?.score || 82,
      team: scoringResult?.output?.team?.score || 70,
      traction: scoringResult?.output?.traction_milestones?.score || 68,
      financials: scoringResult?.output?.financials_projections_ask?.score || 80,
    },
    feedback: scoringResult?.output?.overall_feedback || [
      "Strong problem identification and market validation",
      "Solution demonstrates clear value proposition",
      "Team has relevant experience but could benefit from technical co-founder",
      "Financial projections are realistic and well-structured"
    ],
    recommendations: [
      "Strengthen your traction metrics with specific KPIs",
      "Add more competitive analysis depth",
      "Include customer testimonials or case studies",
      "Clarify your go-to-market strategy"
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-purple-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-yellow-500 rounded-full mb-4"
        >
          <Trophy className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Your ProofScore Analysis
        </h2>
        <p className="text-muted-foreground">
          Comprehensive analysis of {ventureData?.startupName || "your startup"}'s investment readiness
        </p>
      </div>

      {/* Overall Score */}
      <Card className="mb-8 border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Overall ProofScore</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className={`text-6xl font-bold mb-2 ${getScoreColor(proofScore.total)}`}
            >
              {proofScore.total}
            </motion.div>
            <Badge 
              variant={proofScore.total >= 80 ? "default" : proofScore.total >= 60 ? "secondary" : "destructive"}
              className="text-lg px-4 py-1"
            >
              {getScoreLabel(proofScore.total)}
            </Badge>
            <Progress value={proofScore.total} className="mt-4 h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Dimension Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(proofScore.dimensions).map(([key, score], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg capitalize flex items-center justify-between">
                  {key}
                  <span className={`text-2xl font-bold ${getScoreColor(score as number)}`}>
                    {score}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={score as number} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Feedback and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {proofScore.feedback.slice(0, 2).map((item: string, index: number) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {proofScore.recommendations.slice(0, 3).map((item: string, index: number) => (
                <li key={index} className="flex items-start">
                  <TrendingUp className="w-4 h-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <Button variant="outline" className="flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
        <Button variant="outline" className="flex items-center">
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
        <Button variant="outline" className="flex items-center">
          <ExternalLink className="w-4 h-4 mr-2" />
          Get Detailed Analysis
        </Button>
      </div>

      {/* Next Steps */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Ready to improve your ProofScore?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-700 mb-6">
            Based on your analysis, we recommend focusing on traction metrics and competitive positioning. 
            Our ProofSync™ platform can help you build the proof investors need to see.
          </p>
          <Button
            onClick={onComplete}
            size="lg"
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700"
          >
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}