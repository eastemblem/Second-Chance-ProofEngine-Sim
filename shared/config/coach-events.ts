/**
 * ProofCoach Event Tracking Constants
 * Defines standardized event types and actions for user_activity logging
 * Used to track progress towards coach journey milestones
 */

export const COACH_EVENTS = {
  // Onboarding & Account
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  
  // Dashboard & Tutorial
  DASHBOARD_VISITED: 'dashboard_visited',
  DASHBOARD_TUTORIAL_COMPLETED: 'dashboard_tutorial_completed',
  
  // ProofVault Activities
  VAULT_FILE_UPLOADED: 'vault_file_uploaded',
  VAULT_FIRST_UPLOAD: 'vault_first_upload', // First file uploaded to ProofVault
  VAULT_10_FILES_UPLOADED: 'vault_10_files_uploaded',
  VAULT_20_FILES_UPLOADED: 'vault_20_files_uploaded',
  VAULT_30_FILES_UPLOADED: 'vault_30_files_uploaded',
  VAULT_50_FILES_UPLOADED: 'vault_50_files_uploaded',
  VAULT_SCORE_UPDATED: 'vault_score_updated',
  
  // Validation Map & Experiments
  VALIDATION_MAP_VIEWED: 'validation_map_viewed',
  VALIDATION_MAP_EXPORTED: 'validation_map_exported', // CSV export
  VALIDATION_CSV_UPLOADED: 'validation_csv_uploaded', // CSV file uploaded to ProofVault
  EXPERIMENT_CREATED: 'experiment_created',
  EXPERIMENT_STARTED: 'experiment_started',
  EXPERIMENT_UPDATED: 'experiment_updated',
  EXPERIMENT_COMPLETED: 'experiment_completed',
  FIRST_EXPERIMENT_COMPLETED: 'first_experiment_completed',
  THREE_EXPERIMENTS_COMPLETED: 'three_experiments_completed',
  FIVE_EXPERIMENTS_COMPLETED: 'five_experiments_completed',
  
  // Score & Analysis
  PROOFSCORE_RECEIVED: 'proofscore_received',
  PROOFSCORE_VIEWED: 'proofscore_viewed',
  SCORE_IMPROVED: 'score_improved',
  PROOFSCORE_65_REACHED: 'proofscore_65_reached',
  PROOFSCORE_70_REACHED: 'proofscore_70_reached',
  PROOFSCORE_80_REACHED: 'proofscore_80_reached',
  
  // Deal Room & Payment
  DEAL_ROOM_VIEWED: 'deal_room_viewed',
  DEAL_ROOM_PURCHASED: 'deal_room_purchased',
  PATHWAY_VIEWED: 'pathway_viewed',
  
  // Community & Downloads
  COMMUNITY_ACCESSED: 'community_accessed',
  REPORT_DOWNLOADED: 'report_downloaded',
  CERTIFICATE_DOWNLOADED: 'certificate_downloaded',
  FILE_DOWNLOADED: 'file_downloaded',
} as const;

/**
 * Map journey step IDs to the events that complete them
 * Each step can be completed by one or more events
 */
export const JOURNEY_STEP_COMPLETION_EVENTS: Record<number, string[]> = {
  // Onboarding Steps (0-1)
  0: [COACH_EVENTS.ONBOARDING_STARTED], // Welcome - starting onboarding
  1: [COACH_EVENTS.ONBOARDING_COMPLETED], // Complete onboarding
  
  // ProofCoach Journey Steps (2-30) - Post-Onboarding
  2: [COACH_EVENTS.DASHBOARD_TUTORIAL_COMPLETED], // Review ProofScore (completed when dashboard tutorial is finished)
  3: [COACH_EVENTS.VALIDATION_MAP_VIEWED], // Explore Validation Map
  10: [COACH_EVENTS.DASHBOARD_TUTORIAL_COMPLETED], // Complete Dashboard Tutorial
  11: [COACH_EVENTS.VAULT_FIRST_UPLOAD], // Make Your First Upload
  13: [COACH_EVENTS.VAULT_10_FILES_UPLOADED], // Upload 10 Files
  14: [COACH_EVENTS.FIRST_EXPERIMENT_COMPLETED], // Complete First Validation Experiment
  15: [COACH_EVENTS.THREE_EXPERIMENTS_COMPLETED], // Complete 3 Validation Experiments
  16: [COACH_EVENTS.VALIDATION_MAP_EXPORTED], // Export Validation Map CSV
  17: [COACH_EVENTS.VALIDATION_CSV_UPLOADED], // Upload CSV to ProofVault
  18: [COACH_EVENTS.VAULT_20_FILES_UPLOADED], // Upload 20 Total Files
  19: [COACH_EVENTS.PROOFSCORE_65_REACHED], // Reach ProofScore 65+
  20: [COACH_EVENTS.VAULT_30_FILES_UPLOADED], // Upload 30 Total Files
  21: [COACH_EVENTS.PROOFSCORE_70_REACHED], // Reach ProofScore 70+ (unlocks Deal Room)
  22: [COACH_EVENTS.DEAL_ROOM_VIEWED], // Explore Deal Room
  23: [COACH_EVENTS.DEAL_ROOM_PURCHASED], // Complete Payment
  24: [COACH_EVENTS.CERTIFICATE_DOWNLOADED], // Download Certificate
  25: [COACH_EVENTS.REPORT_DOWNLOADED], // Download Report
  27: [COACH_EVENTS.FIVE_EXPERIMENTS_COMPLETED], // Complete 5 Validation Experiments
  28: [COACH_EVENTS.PROOFSCORE_80_REACHED], // Reach ProofScore 80+
  29: [COACH_EVENTS.VAULT_50_FILES_UPLOADED], // Upload 50 Total Files
  30: [COACH_EVENTS.PROOFSCORE_80_REACHED], // Investment Ready (80+ score)
};

/**
 * Event metadata structure for coach events
 * Ensures consistent data capture across all coach-related activities
 */
export interface CoachEventMetadata {
  // Common fields
  ventureId: string;
  founderId: string;
  
  // Step-specific fields
  stepId?: number;
  experimentId?: string;
  uploadId?: string;
  fileCount?: number;
  vaultScore?: number;
  proofScore?: number;
  experimentCount?: number;
  
  // Additional context
  [key: string]: any;
}

/**
 * Helper function to determine if a journey step is completed based on user activities
 * This will be used by CoachProgressService
 */
export function getStepCompletionEvents(stepId: number): string[] {
  return JOURNEY_STEP_COMPLETION_EVENTS[stepId] || [];
}
