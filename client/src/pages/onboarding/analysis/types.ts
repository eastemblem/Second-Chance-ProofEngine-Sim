// Type definitions for analysis components

export interface AnalysisProps {
  sessionId: string;
  sessionData: any;
  onComplete: () => void;
}

export interface ProofTagData {
  name: string;
  emoji: string;
  scoreThreshold: number;
  category: string;
}

export interface ExtractedProofTags {
  unlocked: number;
  total: number;
  unlockedTags: string[];
  lockedTags: {
    name: string;
    emoji: string;
    currentScore: number;
    neededScore: number;
    pointsNeeded: number;
  }[];
}

export interface AnalysisData {
  total_score: number;
  categories: any;
  overall_feedback: string[];
  proofTags: string[];
}

export interface CelebrationState {
  showCelebration: boolean;
  celebrationTriggered: boolean;
}

export interface ScoreDisplayProps {
  analysisData: AnalysisData;
  proofScore: any;
  scoreBadge: string;
  badgeNumber: number;
}

export interface ProofTagSystemProps {
  extractedProofTags: ExtractedProofTags;
  proofScore: any;
  scoringResult: any;
}

export interface CategoryBreakdownProps {
  proofScore: any;
  analysisData: AnalysisData;
}