import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Target, Lightbulb, ExternalLink, Download } from "lucide-react";

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
  const scoringResult = sessionData?.stepData?.processing?.scoringResult;
  const founderData = sessionData?.stepData?.founder;
  const ventureData = sessionData?.stepData?.venture;
  const teamData = sessionData?.stepData?.team;
  const folderStructure = sessionData?.stepData?.venture?.folderStructure;

  // Extract scores from EastEmblem API response
  const pitchDeckScore = scoringResult?.output?.total_score || scoringResult?.total_score || 75;
  const overallFeedback = scoringResult?.output?.overall_feedback || scoringResult?.overall_feedback || [];
  
  // Generate mock ProofScore based on available data
  const proofScore = {
    total: Math.round(pitchDeckScore * 0.8 + (teamData?.teamMembers?.length >= 3 ? 20 : 10)),
    dimensions: {
      desirability: Math.round(pitchDeckScore * 0.85),
      feasibility: Math.round(pitchDeckScore * 0.75 + (founderData?.isTechnical ? 15 : 5)),
      viability: Math.round(pitchDeckScore * 0.8),
      traction: Math.round((ventureData?.userSignups || 0) > 0 ? 80 : 45),
      readiness: Math.round(pitchDeckScore * 0.9)
    },
    insights: {
      strengths: [
        founderData?.isTechnical && "Strong technical founding team",
        teamData?.teamMembers?.length >= 3 && "Well-balanced team composition",
        ventureData?.userSignups > 100 && "Demonstrated user traction",
        pitchDeckScore > 70 && "Clear business model presentation"
      ].filter(Boolean),
      improvements: [
        pitchDeckScore < 80 && "Enhance market opportunity section",
        !ventureData?.website && "Establish online presence",
        (ventureData?.customerDiscoveryCount || 0) < 25 && "Increase customer discovery interviews",
        teamData?.teamMembers?.length < 4 && "Consider expanding core team"
      ].filter(Boolean),
      recommendations: [
        "Focus on customer validation and early traction metrics",
        "Develop a clearer go-to-market strategy", 
        "Strengthen competitive differentiation",
        "Build strategic partnerships in your industry"
      ]
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-100 rounded-full mb-4">
          <Trophy className="h-8 w-8 text-gold-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your ProofScore Analysis</h2>
        <p className="text-gray-600">
          Comprehensive insights into your venture's investment readiness
        </p>
      </div>

      {/* Overall Score */}
      <Card className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <div className={`text-6xl font-bold ${getScoreColor(proofScore.total)} mb-2`}>
              {proofScore.total}
            </div>
            <div className="text-2xl font-semibold text-gray-700">ProofScore</div>
            <Badge variant={getScoreBadgeVariant(proofScore.total)} className="mt-2">
              {proofScore.total >= 80 ? "Investment Ready" : 
               proofScore.total >= 60 ? "Strong Potential" : "Needs Development"}
            </Badge>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your venture shows {proofScore.total >= 70 ? "strong" : "good"} investment potential. 
            Review the detailed breakdown below to understand your strengths and areas for improvement.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Dimension Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Dimension Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(proofScore.dimensions).map(([dimension, score]) => (
              <div key={dimension} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">
                    {dimension.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                    {score}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      score >= 80 ? "bg-green-500" :
                      score >= 60 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {proofScore.insights.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-orange-700 mb-2">Areas for Improvement</h4>
                <ul className="space-y-1">
                  {proofScore.insights.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-orange-500 mr-2">→</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proofScore.insights.recommendations.map((recommendation, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Venture Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Venture Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Company</h4>
              <p className="text-lg font-medium">{ventureData?.name}</p>
              <p className="text-sm text-gray-600">{ventureData?.industry}</p>
              <p className="text-sm text-gray-600">{ventureData?.geography}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Founder</h4>
              <p className="text-lg font-medium">{founderData?.fullName}</p>
              <p className="text-sm text-gray-600">{founderData?.positionRole}</p>
              {founderData?.isTechnical && (
                <Badge variant="secondary" className="mt-1">Technical</Badge>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Stage</h4>
              <p className="text-lg font-medium">{ventureData?.revenueStage}</p>
              <p className="text-sm text-gray-600">{ventureData?.mvpStatus}</p>
              <p className="text-sm text-gray-600">
                {teamData?.teamMembers?.length || 0} team members
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {folderStructure && (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <h4 className="font-semibold text-green-800">ProofVault Created</h4>
                  <p className="text-sm text-green-700">
                    Your organized document vault is ready for investor materials
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-green-700 border-green-300">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Vault
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <h4 className="font-semibold text-blue-800">Download Report</h4>
                <p className="text-sm text-blue-700">
                  Get a detailed PDF report of your ProofScore analysis
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Onboarding */}
      <div className="text-center">
        <Button
          onClick={onComplete}
          size="lg"
          className="px-12 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Complete Onboarding
        </Button>
        <p className="text-sm text-gray-600 mt-4">
          You can access your ProofScore dashboard anytime from your account
        </p>
      </div>
    </motion.div>
  );
}