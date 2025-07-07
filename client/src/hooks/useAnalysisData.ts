import { useState, useEffect } from "react";
import { extractScoringResult, normalizeAnalysisData, extractFounderAndVentureData } from "@/utils/sessionUtils";
import type { SessionData, AnalysisData, ScoringResult } from "@/types/analysis";

export const useAnalysisData = (sessionId: string, sessionData: SessionData) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionFromAPI, setSessionFromAPI] = useState<any>(null);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  // Extract founder and venture data
  const { founderData, ventureData } = extractFounderAndVentureData(sessionData);

  // Try to fetch session data from API if not available
  useEffect(() => {
    const currentScoringResult = extractScoringResult(sessionData);
    
    if (!currentScoringResult && sessionId) {
      setIsLoading(true);
      const fetchSessionData = async () => {
        try {
          const response = await fetch(`/api/onboarding/session/${sessionId}`);
          if (response.ok) {
            const data = await response.json();
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
  }, [sessionId, sessionData]);

  // Process scoring result and create analysis data
  useEffect(() => {
    const finalScoringResult = extractScoringResult(sessionData, sessionFromAPI);
    
    if (finalScoringResult) {
      setScoringResult(finalScoringResult);
      const processedData = normalizeAnalysisData(finalScoringResult);
      setAnalysisData(processedData);
    }
  }, [sessionData, sessionFromAPI]);

  return {
    isLoading,
    scoringResult,
    analysisData,
    founderData,
    ventureData,
    hasData: !!analysisData
  };
};