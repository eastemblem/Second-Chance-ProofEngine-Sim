import { ALL_PROOF_TAGS, CATEGORY_TO_FIELDS_MAP, ALL_API_FIELDS, CATEGORY_DESCRIPTIONS } from './constants';
import type { ExtractedProofTags, AnalysisData } from './types';

// Badge imports
import Badge01 from "../../../assets/badges/score/Badge_01.svg";
import Badge02 from "../../../assets/badges/score/Badge_02.svg";
import Badge03 from "../../../assets/badges/score/Badge_03.svg";
import Badge04 from "../../../assets/badges/score/Badge_04.svg";
import Badge05 from "../../../assets/badges/score/Badge_05.svg";
import Badge06 from "../../../assets/badges/score/Badge_06.svg";
import Badge07 from "../../../assets/badges/score/Badge_07.svg";
import Badge09 from "../../../assets/badges/score/Badge_09.svg";

const SCORE_BADGES = [Badge01, Badge02, Badge03, Badge04, Badge05, Badge06, Badge07, Badge09];

export function getScoreBadge(score: number): string {
  if (score >= 91) return Badge09;
  const badgeIndex = Math.ceil((score - 10) / 10);
  return SCORE_BADGES[badgeIndex] || Badge01;
}

export function getBadgeNumber(score: number): number {
  return score >= 91 ? 9 : Math.ceil((score - 10) / 10) + 1;
}

export function getMilestoneText(score: number): string {
  if (score >= 90) return "Leader in Validation";
  if (score >= 80) return "Investor Match Ready";
  return "ProofScaler Candidate";
}

export function extractAnalysisData(scoringResult: any): AnalysisData {
  return {
    total_score: scoringResult?.output?.total_score || scoringResult?.total_score || 0,
    categories: scoringResult?.output || {},
    overall_feedback: scoringResult?.output?.overall_feedback || [],
    proofTags: scoringResult?.output?.tags || scoringResult?.tags || [],
  };
}

export function extractProofTags(scoringResult: any): ExtractedProofTags {
  const currentScore = scoringResult?.output?.total_score || scoringResult?.total_score || 0;
  
  // Get tags directly from API response first
  const apiTags = scoringResult?.output?.tags || [];
  
  // Use API tags if available, otherwise calculate based on score thresholds
  const unlockedTags: string[] = apiTags.length > 0
    ? apiTags
    : ALL_PROOF_TAGS.filter(tag => currentScore >= tag.scoreThreshold).map(tag => tag.name);

  const lockedTags: {
    name: string;
    emoji: string;
    currentScore: number;
    neededScore: number;
    pointsNeeded: number;
  }[] = [];

  // Find which tags are NOT unlocked (these are locked)
  ALL_PROOF_TAGS.forEach((tag) => {
    const isUnlocked = unlockedTags.includes(tag.name);
    if (!isUnlocked) {
      lockedTags.push({
        name: tag.name,
        emoji: tag.emoji,
        currentScore: currentScore,
        neededScore: tag.scoreThreshold,
        pointsNeeded: Math.max(0, tag.scoreThreshold - currentScore),
      });
    }
  });

  return {
    unlocked: unlockedTags.length,
    total: ALL_PROOF_TAGS.length,
    unlockedTags,
    lockedTags,
  };
}

export function getProofTagJustification(tagName: string, scoringResult: any): string {
  // Find the ProofTag to get its category
  const proofTag = ALL_PROOF_TAGS.find(tag => tag.name === tagName);
  if (!proofTag) return "No justification available for this ProofTag.";
  
  const category = proofTag.category;
  
  // Get justification from API response - try both output and direct access
  const output = scoringResult?.output || scoringResult;
  
  const fieldsToCheck = CATEGORY_TO_FIELDS_MAP[category] || [];
  
  // Check each relevant field for this category
  for (const field of fieldsToCheck) {
    if (output[field]) {
      const categoryData = output[field];
      const justification = categoryData.justification || categoryData.recommendation;
      if (justification && justification.length > 10) {
        return justification;
      }
    }
  }
  
  // Try all API fields as fallback
  for (const field of ALL_API_FIELDS) {
    if (output[field]) {
      const categoryData = output[field];
      const justification = categoryData.justification || categoryData.recommendation;
      if (justification && justification.length > 10) {
        return justification;
      }
    }
  }
  
  // Final fallback with category description
  return CATEGORY_DESCRIPTIONS[category] || `This ${category} ProofTag shows strong validation signals in your startup.`;
}

export function getProofTagIcon(tagName: string): string {
  const tag = ALL_PROOF_TAGS.find(t => t.name === tagName);
  return tag?.emoji || "✨";
}

export function shouldShowCelebration(score: number): boolean {
  return score > 50;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}