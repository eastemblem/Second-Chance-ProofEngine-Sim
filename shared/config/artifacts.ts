export type GrowthStage = "Pre-Seed" | "Seed" | "Series A";

export type Priority = "critical" | "high" | "medium" | "low";

export type ArtifactConfig = {
  name: string;
  description: string;
  allowedFormats: string[];
  maxSizeBytes: number;
  score: number;
  proofScoreContribution: number;
  mandatory: boolean;
  priority: Priority;
  fileFolder: "File" | "Folder";
  uploadGuidelines: string;
};

export type CategoryConfig = {
  name: string;
  description: string;
  artifacts: Record<string, ArtifactConfig>;
};

export type ArtifactsConfig = Record<string, CategoryConfig>;

// Import stage-specific configurations
import { PRE_SEED_ARTIFACTS } from './artifacts-pre-seed';
import { SEED_ARTIFACTS } from './artifacts-seed';
import { SERIES_A_ARTIFACTS } from './artifacts-series-a';

// Helper function to get artifacts based on growth stage
export function getArtifactsForStage(stage: GrowthStage | string | null | undefined): ArtifactsConfig {
  // Normalize the stage string to lowercase for case-insensitive comparison
  const normalizedStage = stage?.trim().toLowerCase();
  
  switch (normalizedStage) {
    case 'pre-seed':
    case 'pre seed':
      return PRE_SEED_ARTIFACTS;
    case 'seed':
      return SEED_ARTIFACTS;
    case 'series a':
    case 'seriesa':
      return SERIES_A_ARTIFACTS;
    default:
      // Default to Pre-Seed if stage is not set or unknown
      return PRE_SEED_ARTIFACTS;
  }
}

// Helper to get a specific artifact config by category and artifact key
export function getArtifactConfig(
  stage: GrowthStage | string | null | undefined,
  categoryId: string,
  artifactKey: string
): ArtifactConfig | null {
  const stageArtifacts = getArtifactsForStage(stage);
  const category = stageArtifacts[categoryId];
  
  if (!category) return null;
  
  return category.artifacts[artifactKey] || null;
}

// Export stage-specific configs for direct access if needed
export { PRE_SEED_ARTIFACTS, SEED_ARTIFACTS, SERIES_A_ARTIFACTS };

// Backward compatibility: Export Pre-Seed as default for now
export const PROOF_VAULT_ARTIFACTS = PRE_SEED_ARTIFACTS;
