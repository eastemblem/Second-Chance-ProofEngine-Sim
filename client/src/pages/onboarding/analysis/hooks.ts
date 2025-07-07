import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { extractAnalysisData, extractProofTags, shouldShowCelebration } from './utils';
import type { AnalysisData, ExtractedProofTags, CelebrationState } from './types';

export function useAnalysisData(sessionId: string, sessionData: any) {
  const [sessionFromAPI, setSessionFromAPI] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract scoring result from various possible locations
  const scoringResult = sessionData?.scoringResult ||
    sessionData?.stepData?.processing?.scoringResult ||
    sessionData?.stepData?.scoringResult ||
    sessionData?.processing?.scoringResult;

  // Try to fetch session data from API if not available
  useEffect(() => {
    if (!scoringResult && sessionId) {
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
  }, [sessionId, scoringResult]);

  // Get the final scoring result
  const finalScoringResult = sessionFromAPI?.stepData?.processing?.scoringResult ||
    sessionFromAPI?.stepData?.scoringResult ||
    sessionFromAPI?.scoringResult ||
    scoringResult;

  // Extract analysis data
  const analysisData = extractAnalysisData(finalScoringResult);

  return {
    scoringResult: finalScoringResult,
    analysisData,
    isLoading,
    founderData: sessionData?.stepData?.founder,
    ventureData: sessionData?.stepData?.venture?.venture || sessionData?.stepData?.venture
  };
}

export function useProofTags(scoringResult: any): ExtractedProofTags {
  return extractProofTags(scoringResult);
}

export function useCelebration(totalScore: number): CelebrationState {
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationTriggered = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (totalScore > 70 && !celebrationTriggered.current) {
      celebrationTriggered.current = true;
      setShowCelebration(true);
      
      // Show celebration toast
      setTimeout(() => {
        toast({
          title: "Outstanding Score! 🎉",
          description: "Your startup shows exceptional validation across key dimensions!",
          duration: 5000,
        });
      }, 1000);

      // Hide celebration after animation
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }
  }, [totalScore, toast]);

  return {
    showCelebration,
    celebrationTriggered: celebrationTriggered.current
  };
}