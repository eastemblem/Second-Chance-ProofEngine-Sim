import type { ScoringResult, AnalysisData, SessionData } from "@/types/analysis";

export const extractScoringResult = (sessionData: SessionData, sessionFromAPI?: any): ScoringResult | null => {
  // Try multiple sources for scoring result
  let scoringResult = 
    sessionData?.scoringResult ||
    sessionData?.stepData?.processing?.scoringResult ||
    sessionData?.stepData?.scoringResult ||
    sessionData?.processing?.scoringResult;

  // Also check API session data if available
  if (!scoringResult && sessionFromAPI) {
    const apiScoringResult =
      sessionFromAPI?.stepData?.processing?.scoringResult ||
      sessionFromAPI?.stepData?.scoringResult ||
      sessionFromAPI?.scoringResult;
    if (apiScoringResult) {
      scoringResult = apiScoringResult;
    }
  }

  return scoringResult || null;
};

export const normalizeAnalysisData = (scoringResult: ScoringResult): AnalysisData => {
  return {
    total_score:
      scoringResult?.output?.total_score || scoringResult?.total_score || 0,
    categories: scoringResult?.output || {},
    overall_feedback: scoringResult?.output?.overall_feedback || [],
    proofTags: scoringResult?.output?.tags || scoringResult?.tags || [],
  };
};

export const validateSessionData = (sessionData: SessionData): boolean => {
  return !!(
    sessionData &&
    (sessionData.scoringResult || 
     sessionData.stepData?.processing?.scoringResult ||
     sessionData.stepData?.scoringResult ||
     sessionData.processing?.scoringResult)
  );
};

export const extractFounderAndVentureData = (sessionData: SessionData) => {
  const founderData = sessionData?.stepData?.founder;
  const ventureData =
    sessionData?.stepData?.venture?.venture || sessionData?.stepData?.venture;
  
  return { founderData, ventureData };
};