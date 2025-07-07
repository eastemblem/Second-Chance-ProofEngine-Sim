import { ALL_PROOF_TAGS, PROOF_TAG_ICONS } from "@/constants/proofTags";
import type { ProofTag, ScoringResult, ExtractedProofTags } from "@/types/analysis";

export const getProofTagJustification = (tagName: string, scoringResult: any): string => {
  const proofTag = ALL_PROOF_TAGS.find(tag => tag.name === tagName);
  if (!proofTag) return "No justification available for this ProofTag.";
  
  const category = proofTag.category;
  const output = scoringResult?.output || scoringResult;
  
  // Map ProofTag categories to API response fields
  const categoryToFieldsMap: Record<string, string[]> = {
    desirability: ["Problem", "market_opportunity"],
    feasibility: ["solution", "product_technology"], 
    viability: ["business_model", "competition", "financials_projections_ask"],
    traction: ["traction_milestones", "go_to_market_strategy"],
    readiness: ["team"]
  };
  
  const fieldsToCheck = categoryToFieldsMap[category] || [];
  
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
  const allApiFields = ["Problem", "solution", "market_opportunity", "product_technology", "team", "business_model", "traction_milestones", "competition", "go_to_market_strategy", "financials_projections_ask"];
  for (const field of allApiFields) {
    if (output[field]) {
      const categoryData = output[field];
      const justification = categoryData.justification || categoryData.recommendation;
      if (justification && justification.length > 10) {
        return justification;
      }
    }
  }
  
  // Category description fallback
  const categoryDescriptions: Record<string, string> = {
    desirability: "This ProofTag validates your startup's ability to solve real customer problems and create market demand.",
    feasibility: "This ProofTag confirms your technical capability to build and deliver your solution effectively.",
    viability: "This ProofTag demonstrates your ability to generate sustainable revenue and achieve profitability.",
    traction: "This ProofTag shows your success in acquiring customers and building measurable growth momentum.",
    readiness: "This ProofTag validates your preparedness to scale operations and attract investment."
  };
  
  return categoryDescriptions[category] || `This ${category} ProofTag shows strong validation signals in your startup.`;
};

export const getProofTagIcon = (tagName: string): string => {
  // Try exact match first
  if (PROOF_TAG_ICONS[tagName]) {
    return PROOF_TAG_ICONS[tagName];
  }

  // Try partial matching for similar names
  const lowerTagName = tagName.toLowerCase();
  for (const [key, icon] of Object.entries(PROOF_TAG_ICONS)) {
    if (
      key.toLowerCase().includes(lowerTagName) ||
      lowerTagName.includes(key.toLowerCase())
    ) {
      return icon;
    }
  }

  // Default fallback
  return "✨";
};

export const extractProofTags = (scoringResult: any, currentScore: number): ExtractedProofTags => {
  // Get tags directly from API response first
  const apiTags = scoringResult?.output?.tags || [];

  // Use API tags if available, otherwise calculate based on score thresholds
  const unlockedTags: string[] =
    apiTags.length > 0
      ? apiTags
      : ALL_PROOF_TAGS.filter(
          (tag) => currentScore >= tag.scoreThreshold,
        ).map((tag) => tag.name);

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
};