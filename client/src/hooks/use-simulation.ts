import { useState, useCallback } from "react";
import { FounderData, ProofScore, SimulationState } from "@shared/schema";
import { generateProofScore } from "@/lib/data";

export function useSimulation() {
  const [state, setState] = useState<SimulationState>({
    currentPage: 1,
    founderData: {},
    proofScore: null,
    analysisProgress: 0,
    isAnalyzing: false
  });

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const updateFounderData = useCallback((data: Partial<FounderData>) => {
    setState(prev => ({
      ...prev,
      founderData: { ...prev.founderData, ...data }
    }));
  }, []);

  const startAnalysis = useCallback(() => {
    setState(prev => ({ ...prev, isAnalyzing: true, analysisProgress: 0 }));
    
    // Simulate analysis progress
    const interval = setInterval(() => {
      setState(prev => {
        const newProgress = prev.analysisProgress + 20;
        if (newProgress >= 100) {
          clearInterval(interval);
          const score = generateProofScore(prev.founderData.acceleratorApplications || 0, prev.founderData.name);
          return {
            ...prev,
            analysisProgress: 100,
            isAnalyzing: false,
            proofScore: score
          };
        }
        return { ...prev, analysisProgress: newProgress };
      });
    }, 800);

    return interval as any;
  }, []);

  const resetSimulation = useCallback(() => {
    setState({
      currentPage: 1,
      founderData: {},
      proofScore: null,
      analysisProgress: 0,
      isAnalyzing: false
    });
  }, []);

  return {
    state,
    setCurrentPage,
    updateFounderData,
    startAnalysis,
    resetSimulation
  };
}
