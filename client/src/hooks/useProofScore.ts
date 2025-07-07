import { useMemo } from "react";
import { ProofScoreResult } from "@shared/schema";
import { extractProofTags } from "@/utils/proofTagUtils";
import type { AnalysisData, ScoringResult } from "@/types/analysis";

export const useProofScore = (analysisData: AnalysisData | null, scoringResult: ScoringResult | null): ProofScoreResult | null => {
  return useMemo(() => {
    if (!analysisData || !scoringResult) return null;

    const extractedProofTags = extractProofTags(scoringResult, analysisData.total_score);

    const proofScore: ProofScoreResult = {
      total: analysisData.total_score,
      dimensions: {
        desirability: analysisData.categories?.Problem?.score || 0,
        feasibility: analysisData.categories?.solution?.score || 0,
        viability: analysisData.categories?.business_model?.score || 0,
        traction: analysisData.categories?.traction_milestones?.score || 0,
        readiness: analysisData.categories?.team?.score || 0,
      },
      prooTags: {
        unlocked: extractedProofTags.unlocked,
        total: extractedProofTags.total,
        tags: extractedProofTags.unlockedTags,
      },
      insights: {
        strengths: analysisData.overall_feedback.filter((_, index) => index % 3 === 0),
        improvements: analysisData.overall_feedback.filter((_, index) => index % 3 === 1),
        recommendations: analysisData.overall_feedback.filter((_, index) => index % 3 === 2),
      },
    };

    return proofScore;
  }, [analysisData, scoringResult]);
};