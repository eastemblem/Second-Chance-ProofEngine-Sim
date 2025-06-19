import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Trophy, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Download,
  Share2,
  FileText,
  Users,
  Target,
  Lightbulb,
  BarChart3,
  Star
} from "lucide-react";

interface DealRoomProps {
  sessionId: string;
  sessionData: any;
  onComplete: () => void;
}

export default function DealRoom({ 
  sessionId, 
  sessionData, 
  onComplete 
}: DealRoomProps) {
  // Extract data from session
  const scoringResult = sessionData?.stepData?.processing?.scoringResult;
  const founderData = sessionData?.stepData?.founder;
  const ventureData = sessionData?.stepData?.venture?.venture || sessionData?.stepData?.venture;
  
  // Map scoring result to structured data
  const proofScore = {
    total: scoringResult?.total_score || 0,
    dimensions: {
      desirability: scoringResult?.desirability || 0,
      feasibility: scoringResult?.feasibility || 0,
      viability: scoringResult?.viability || 0,
      traction: scoringResult?.traction || 0,
      readiness: scoringResult?.readiness || 0,
    },
    insights: scoringResult?.key_insights || [],
    tags: scoringResult?.tags || []
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Strong";
    if (score >= 60) return "Moderate";
    return "Needs Focus";
  };

  const getDimensionIcon = (dimension: string) => {
    switch(dimension) {
      case 'desirability': return Target;
      case 'feasibility': return Lightbulb;
      case 'viability': return BarChart3;
      case 'traction': return TrendingUp;
      case 'readiness': return Star;
      default: return CheckCircle;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {ventureData?.name || "Venture"} - Deal Room
              </h1>
              <p className="text-gray-600 mt-1">
                Investment readiness analysis and proof documentation
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Overview */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ProofScore Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Trophy className="w-6 h-6 mr-2 text-yellow-600" />
                    Overall ProofScore
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{proofScore.total}</div>
                    <div className="text-sm text-gray-500">out of 100</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={proofScore.total} className="h-3 mb-4" />
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(proofScore.dimensions).map(([key, score]) => {
                    const Icon = getDimensionIcon(key);
                    return (
                      <div key={key} className="text-center">
                        <Icon className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                        <div className="text-2xl font-bold text-gray-900">{score}</div>
                        <div className="text-xs text-gray-500 capitalize">{key}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            {proofScore.insights.map((insight: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{insight.description}</p>
                </CardContent>
              </Card>
            ))}

            {/* Proof Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Validated Proof Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {proofScore.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Company Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Industry</label>
                  <p className="text-gray-900">{ventureData?.industry}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Geography</label>
                  <p className="text-gray-900">{ventureData?.geography}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Business Model</label>
                  <p className="text-gray-900">{ventureData?.businessModel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Revenue Stage</label>
                  <p className="text-gray-900">{ventureData?.revenueStage}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Status</label>
                  <p className="text-gray-900">{ventureData?.mvpStatus}</p>
                </div>
              </CardContent>
            </Card>

            {/* Founder Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Founder Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{founderData?.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Position</label>
                  <p className="text-gray-900">{founderData?.positionRole}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Experience</label>
                  <p className="text-gray-900">{founderData?.experience}</p>
                </div>
                {founderData?.acceleratorApplications && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Accelerator Applications</label>
                    <p className="text-gray-900">{founderData.acceleratorApplications}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dimension Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(proofScore.dimensions).map(([key, score]) => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium capitalize">{key}</span>
                      <span className="text-sm font-bold">{score}</span>
                    </div>
                    <Progress value={score as number} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-12 bg-white rounded-lg border p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to enhance your proof?</h3>
          <p className="text-gray-600 mb-6">
            Use this analysis to strengthen your investment case and improve your ProofScore.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Access Full Platform
            </Button>
            <Button onClick={onComplete}>
              Continue to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}