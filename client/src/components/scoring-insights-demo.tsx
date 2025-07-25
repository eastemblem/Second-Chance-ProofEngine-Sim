import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Target, TrendingUp, Users, DollarSign } from "lucide-react";

interface ScoringInsights {
  evaluation: {
    id: string;
    venture: string;
    score: number;
    evaluationDate: string;
    proofTags: string[];
  };
  dimensionScores: {
    desirability?: number;
    feasibility?: number;
    viability?: number;
    traction?: number;
    readiness?: number;
  };
  detailedScores: Record<string, any>;
  keyInsights: Array<{ title: string; description: string }>;
  recommendations: string[];
  availableData: {
    hasTeamInfo: boolean;
    hasMarketData: boolean;
    hasFinancials: boolean;
    hasTraction: boolean;
    hasBusinessModel: boolean;
    totalCategories: number;
  };
}

export function ScoringInsightsDemo() {
  const { data: insights, isLoading, error } = useQuery<{ data: ScoringInsights }>({
    queryKey: ["/api/dashboard/scoring-insights"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Scoring Insights...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">No Detailed Scoring Data</CardTitle>
          <CardDescription>
            Complete the onboarding process to see rich scoring insights here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const scoringData = insights?.data;
  if (!scoringData) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Rich Scoring Data Storage Demo
          </CardTitle>
          <CardDescription>
            Complete API response now permanently stored in database for advanced ProofTag logic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Evaluation Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Venture</p>
              <p className="text-sm text-muted-foreground">{scoringData.evaluation.venture}</p>
            </div>
            <div>
              <p className="text-sm font-medium">ProofScore</p>
              <p className="text-2xl font-bold text-purple-600">{scoringData.evaluation.score}/100</p>
            </div>
          </div>

          <Separator />

          {/* Dimension Scores */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dimension Breakdown (Stored)
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(scoringData.dimensionScores).map(([dimension, score]) => (
                <div key={dimension} className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{score || 0}</div>
                  <div className="text-xs text-muted-foreground capitalize">{dimension}</div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Available Rich Data */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Rich Data Available for Advanced ProofTag Logic
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(scoringData.availableData).map(([key, available]) => {
                if (key === 'totalCategories') return null;
                return (
                  <div key={key} className="flex items-center gap-2">
                    {available ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total categories analyzed: {scoringData.availableData.totalCategories}
            </p>
          </div>

          <Separator />

          {/* ProofTags */}
          <div>
            <h4 className="font-medium mb-3">Current ProofTags ({scoringData.evaluation.proofTags.length})</h4>
            <div className="flex flex-wrap gap-2">
              {scoringData.evaluation.proofTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-purple-100 text-purple-800">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Key Insights Preview */}
          {scoringData.keyInsights.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Key Insights (Sample)</h4>
                <div className="space-y-2">
                  {scoringData.keyInsights.slice(0, 2).map((insight, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Advanced Logic Examples */}
          <Separator />
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-purple-800">Advanced ProofTag Logic Examples</h4>
            <div className="text-sm text-purple-700 space-y-1">
              <p>• <strong>Team Quality Tags:</strong> Can analyze team.score, team.experience, team.roles</p>
              <p>• <strong>Market Validation Tags:</strong> Can check market_opportunity.validation_score, customer_feedback</p>
              <p>• <strong>Revenue Model Tags:</strong> Can evaluate business_model.sustainability, revenue_projections</p>
              <p>• <strong>Traction Milestone Tags:</strong> Can assess traction.customer_acquisition, growth_metrics</p>
              <p>• <strong>Investment Ready Tags:</strong> Can combine multiple category scores with custom thresholds</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}