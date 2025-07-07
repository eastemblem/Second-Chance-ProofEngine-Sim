export interface ScoringResult {
  output?: {
    total_score?: number;
    tags?: string[];
    overall_feedback?: string[];
    [key: string]: any;
  };
  total_score?: number;
  score?: number;
  tags?: string[];
}

export interface AnalysisData {
  total_score: number;
  categories: Record<string, any>;
  overall_feedback: string[];
  proofTags: string[];
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

export interface AnalysisProps {
  sessionId: string;
  sessionData: any;
  onComplete: () => void;
}

export interface SessionData {
  scoringResult?: ScoringResult;
  stepData?: {
    founder?: any;
    venture?: any;
    processing?: {
      scoringResult?: ScoringResult;
    };
    scoringResult?: ScoringResult;
  };
  processing?: {
    scoringResult?: ScoringResult;
  };
}

export interface CategoryData {
  score?: number;
  justification?: string;
  recommendation?: string;
}