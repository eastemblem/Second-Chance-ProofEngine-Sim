import { extractScoringResult, normalizeAnalysisData } from "@/utils/sessionUtils";
import { extractProofTags } from "@/utils/proofTagUtils";
import type { SessionData, AnalysisData, ScoringResult, ExtractedProofTags } from "@/types/analysis";

export class AnalysisService {
  /**
   * Process session data and return normalized analysis data
   */
  static processSessionData(sessionData: SessionData, sessionFromAPI?: any): {
    scoringResult: ScoringResult | null;
    analysisData: AnalysisData | null;
    extractedProofTags: ExtractedProofTags | null;
  } {
    try {
      const scoringResult = extractScoringResult(sessionData, sessionFromAPI);
      
      if (!scoringResult) {
        return {
          scoringResult: null,
          analysisData: null,
          extractedProofTags: null
        };
      }

      const analysisData = normalizeAnalysisData(scoringResult);
      const extractedProofTags = extractProofTags(scoringResult, analysisData.total_score);

      return {
        scoringResult,
        analysisData,
        extractedProofTags
      };
    } catch (error) {
      console.error("Error processing session data:", error);
      return {
        scoringResult: null,
        analysisData: null,
        extractedProofTags: null
      };
    }
  }

  /**
   * Fetch session data from API
   */
  static async fetchSessionData(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/onboarding/session/${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch session data: ${response.statusText}`);
      }
      const data = await response.json();
      return data?.data || data?.session || data;
    } catch (error) {
      console.error("Failed to fetch session data:", error);
      throw error;
    }
  }

  /**
   * Validate if analysis data is complete and valid
   */
  static validateAnalysisData(analysisData: AnalysisData | null): boolean {
    return !!(
      analysisData && 
      typeof analysisData.total_score === 'number' &&
      analysisData.categories &&
      Array.isArray(analysisData.overall_feedback)
    );
  }
}