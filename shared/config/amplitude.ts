/**
 * Amplitude Analytics Configuration
 * Shared event definitions and helpers for SC Platform
 */

export const AMPLITUDE_LICENSEE_ID = 'SC Platform';

export const AMPLITUDE_EVENTS = {
  // Onboarding Flow Events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_STEP_FAILED: 'onboarding_step_failed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned',
  
  // User Journey Events
  FOUNDER_CREATED: 'founder_created',
  VENTURE_CREATED: 'venture_created',
  FOLDER_STRUCTURE_CREATED: 'folder_structure_created',
  TEAM_MEMBER_ADDED: 'team_member_added',
  PITCH_DECK_UPLOADED: 'pitch_deck_uploaded',
  CERTIFICATE_GENERATED: 'certificate_generated',
  REPORT_GENERATED: 'report_generated',
  EMAIL_SENT: 'email_sent',
  EMAIL_VERIFIED: 'email_verified',
  
  // Authentication Events
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Dashboard Events
  DASHBOARD_VISITED: 'dashboard_visited',
  VALIDATION_MAP_VIEWED: 'validation_map_viewed',
  COMMUNITY_ACCESSED: 'community_accessed',
  
  // Vault Events
  FILE_UPLOADED_TO_VAULT: 'file_uploaded_to_vault',
  
  // Scoring Events
  SCORE_UPDATED: 'score_updated',
  SCORING_COMPLETED: 'scoring_completed',
  
  // Payment Events
  PAYMENT_STARTED: 'payment_started',
  PAYMENT_SUCCESS: 'payment_success',
  DEAL_ROOM_PURCHASED: 'deal_room_purchased',
  PAYMENT_CANCELLED: 'payment_cancelled',
  PAYMENT_FAILED: 'payment_failed',
} as const;

export type AmplitudeEventName = typeof AMPLITUDE_EVENTS[keyof typeof AMPLITUDE_EVENTS];

export interface AmplitudeUserContext {
  ventureId?: string;
  founderId?: string;
  sessionId?: string;
  licenseeId?: string;
}

export interface BaseEventProperties {
  timestamp: string;
  sessionId?: string;
  licenseeId: string;
  programId?: string;
  source: 'gateway' | 'sc_platform';
}

export interface OnboardingEventProperties extends BaseEventProperties {
  marketingId?: string;
  founderId?: string;
  founderEmail?: string;
  currentStep?: string;
  previousStep?: string;
  completedSteps?: string[];
  stepDurationMs?: number;
  totalDurationMs?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface FounderEventProperties extends BaseEventProperties {
  founderId: string;
  founderEmail: string;
  founderName: string;
  isExistingFounder?: boolean;
}

export interface VentureEventProperties extends BaseEventProperties {
  ventureId: string;
  ventureName: string;
  founderId: string;
  industry?: string;
  geography?: string;
}

export interface PaymentEventProperties extends BaseEventProperties {
  ventureId?: string;
  founderId?: string;
  amount?: number;
  currency?: string;
  orderReference?: string;
  paymentMethod?: string;
  packageType?: string;
}

export interface ScoringEventProperties extends BaseEventProperties {
  ventureId: string;
  ventureName?: string;
  proofScore: number;
  proofTagsCount?: number;
  dimensionScores?: {
    desirability?: number;
    feasibility?: number;
    viability?: number;
    traction?: number;
    readiness?: number;
  };
  scoringDurationMs?: number;
}

export interface VaultEventProperties extends BaseEventProperties {
  ventureId: string;
  ventureName?: string;
  fileName?: string;
  fileSize?: number;
  artifactType?: string;
  uploadCount?: number;
}

/**
 * Get user ID for Amplitude tracking
 * Priority: ventureId > founderId > licenseeId_sessionId
 */
export function getUserId(context: AmplitudeUserContext): string {
  if (context.ventureId) return context.ventureId;
  if (context.founderId) return context.founderId;
  const licensee = context.licenseeId || AMPLITUDE_LICENSEE_ID;
  return `${licensee}_${context.sessionId || 'anon'}`;
}

/**
 * Get base properties for all events
 */
export function getBaseProperties(
  sessionId?: string,
  programId?: string
): BaseEventProperties {
  return {
    timestamp: new Date().toISOString(),
    sessionId,
    licenseeId: AMPLITUDE_LICENSEE_ID,
    programId,
    source: 'sc_platform',
  };
}
