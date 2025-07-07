import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS } from "@/constants/proofTags";
import { getDimensionColor } from "@/utils/scoreUtils";
import type { ProofScoreResult } from "@shared/schema";

interface ScoreBreakdownProps {
  proofScore: ProofScoreResult;
  analysisData: any;
}

export const ScoreBreakdown = ({ proofScore, analysisData }: ScoreBreakdownProps) => {
  const dimensionEntries = Object.entries(proofScore.dimensions);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Dimension Scores */}
      <Card className="p-6 border-border bg-card">
        <h3 className="text-xl font-semibold mb-6">
          Validation Dimensions
        </h3>
        <div className="space-y-4">
          {dimensionEntries.map(([dimension, score], index) => (
            <motion.div
              key={dimension}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium capitalize">
                  {CATEGORY_COLORS[dimension as keyof typeof CATEGORY_COLORS] || dimension}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {score}/20
                </Badge>
              </div>
              <Progress 
                value={(score / 20) * 100} 
                className="h-2"
              />
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Key Insights */}
      <Card className="p-6 border-border bg-card">
        <h3 className="text-xl font-semibold mb-6">Key Insights</h3>
        <div className="space-y-4">
          {/* Strengths */}
          {proofScore.insights.strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="text-sm font-semibold text-green-600 mb-2">
                💪 Strengths
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {proofScore.insights.strengths.slice(0, 2).map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Improvements */}
          {proofScore.insights.improvements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="text-sm font-semibold text-yellow-600 mb-2">
                🔧 Areas for Improvement
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {proofScore.insights.improvements.slice(0, 2).map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Recommendations */}
          {proofScore.insights.recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h4 className="text-sm font-semibold text-blue-600 mb-2">
                💡 Recommendations
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {proofScore.insights.recommendations.slice(0, 2).map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
};