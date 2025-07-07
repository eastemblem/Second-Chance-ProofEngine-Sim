import { motion } from "framer-motion";
import { TrendingUp, Shield, Briefcase, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DIMENSION_COLORS } from './constants';
import type { CategoryBreakdownProps } from './types';

export default function CategoryBreakdown({ proofScore, analysisData }: CategoryBreakdownProps) {
  const dimensionIcons = {
    desirability: TrendingUp,
    feasibility: Shield,
    viability: DollarSign,
    traction: Briefcase,
    readiness: Users,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Dimension Scores */}
      <Card className="p-6 border-border bg-card">
        <h3 className="text-xl font-semibold mb-6">
          Validation Dimensions
        </h3>
        <div className="space-y-4">
          {Object.entries(proofScore.dimensions).map(([key, value], index) => {
            const IconComponent = dimensionIcons[key as keyof typeof dimensionIcons];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${DIMENSION_COLORS[key as keyof typeof DIMENSION_COLORS]} bg-opacity-20`}>
                    <IconComponent className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium capitalize text-foreground">
                    {key}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Progress 
                    value={(value as number) * 5} 
                    className="w-24 h-2" 
                  />
                  <span className="text-sm font-semibold min-w-[2rem] text-primary">
                    {value}/20
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6 border-border bg-card">
        <h3 className="text-xl font-semibold mb-6">Key Insights</h3>
        <div className="space-y-4">
          {/* Strengths */}
          {proofScore.insights?.strengths?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <h4 className="text-sm font-semibold text-green-600 mb-2">
                Strengths
              </h4>
              <ul className="space-y-1">
                {proofScore.insights.strengths.slice(0, 3).map((strength: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Improvements */}
          {proofScore.insights?.improvements?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <h4 className="text-sm font-semibold text-orange-600 mb-2">
                Areas for Improvement
              </h4>
              <ul className="space-y-1">
                {proofScore.insights.improvements.slice(0, 3).map((improvement: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Overall Feedback */}
          {analysisData.overall_feedback?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <h4 className="text-sm font-semibold text-primary mb-2">
                Overall Feedback
              </h4>
              <ul className="space-y-1">
                {analysisData.overall_feedback.slice(0, 2).map((feedback: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <span className="text-primary mr-2">•</span>
                    {feedback}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
}