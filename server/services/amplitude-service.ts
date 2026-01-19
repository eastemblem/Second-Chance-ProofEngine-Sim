/**
 * Amplitude Analytics Service - Server-side tracking
 * Fire-and-forget pattern for non-blocking event tracking
 */

import * as Amplitude from '@amplitude/analytics-node';
import {
  AMPLITUDE_EVENTS,
  AMPLITUDE_LICENSEE_ID,
  getUserId,
  getBaseProperties,
  type AmplitudeUserContext,
  type FounderEventProperties,
  type VentureEventProperties,
  type PaymentEventProperties,
  type ScoringEventProperties,
  type VaultEventProperties,
  type OnboardingEventProperties,
} from '@shared/config/amplitude';

let isInitialized = false;

/**
 * Initialize Amplitude SDK
 */
export function initAmplitude(): void {
  const apiKey = process.env.AMPLITUDE_API_KEY;
  
  if (!apiKey) {
    console.warn('[Amplitude] API key not configured - tracking disabled');
    return;
  }
  
  if (isInitialized) return;
  
  try {
    Amplitude.init(apiKey, {
      flushIntervalMillis: 1000,
      flushQueueSize: 10,
    });
    isInitialized = true;
    console.log('[Amplitude] Server-side tracking initialized');
  } catch (error) {
    console.error('[Amplitude] Failed to initialize:', error);
  }
}

/**
 * Track an event with fire-and-forget pattern
 */
async function trackEvent(
  eventName: string,
  properties: Record<string, any>,
  context: AmplitudeUserContext
): Promise<void> {
  if (!isInitialized) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Amplitude] Would track: ${eventName}`, properties);
    }
    return;
  }
  
  const userId = getUserId(context);
  
  try {
    await Amplitude.track(eventName, properties, {
      user_id: userId,
      device_id: context.sessionId,
    });
  } catch (error) {
    console.warn(`[Amplitude] Failed to track ${eventName}:`, error);
  }
}

/**
 * Fire-and-forget wrapper - does not block calling code
 */
function trackAsync(
  eventName: string,
  properties: Record<string, any>,
  context: AmplitudeUserContext
): void {
  trackEvent(eventName, properties, context).catch((err) => {
    console.warn(`[Amplitude] Async tracking failed for ${eventName}:`, err);
  });
}

// ============================================================================
// Onboarding Events
// ============================================================================

export function trackOnboardingStarted(
  sessionId: string,
  marketingId?: string,
  programId?: string
): void {
  const properties: OnboardingEventProperties = {
    ...getBaseProperties(sessionId, programId),
    marketingId,
    currentStep: 'founder',
    completedSteps: [],
  };
  
  trackAsync(AMPLITUDE_EVENTS.ONBOARDING_STARTED, properties, {
    sessionId,
    licenseeId: AMPLITUDE_LICENSEE_ID,
  });
}

export function trackOnboardingStepCompleted(
  sessionId: string,
  currentStep: string,
  previousStep: string,
  completedSteps: string[],
  context: AmplitudeUserContext,
  stepDurationMs?: number
): void {
  const properties: OnboardingEventProperties = {
    ...getBaseProperties(sessionId),
    currentStep,
    previousStep,
    completedSteps,
    stepDurationMs,
    founderId: context.founderId,
  };
  
  trackAsync(AMPLITUDE_EVENTS.ONBOARDING_STEP_COMPLETED, properties, context);
}

export function trackOnboardingCompleted(
  sessionId: string,
  context: AmplitudeUserContext,
  proofScore?: number,
  totalDurationMs?: number
): void {
  const properties = {
    ...getBaseProperties(sessionId),
    proofScore,
    totalDurationMs,
    founderId: context.founderId,
    ventureId: context.ventureId,
  };
  
  trackAsync(AMPLITUDE_EVENTS.ONBOARDING_COMPLETED, properties, context);
}

// ============================================================================
// User Journey Events
// ============================================================================

export function trackFounderCreated(
  sessionId: string,
  founderId: string,
  founderEmail: string,
  founderName: string,
  isExistingFounder: boolean = false
): void {
  const properties: FounderEventProperties = {
    ...getBaseProperties(sessionId),
    founderId,
    founderEmail,
    founderName,
    isExistingFounder,
  };
  
  trackAsync(AMPLITUDE_EVENTS.FOUNDER_CREATED, properties, {
    founderId,
    sessionId,
    licenseeId: AMPLITUDE_LICENSEE_ID,
  });
}

export function trackVentureCreated(
  sessionId: string,
  ventureId: string,
  ventureName: string,
  founderId: string,
  industry?: string,
  geography?: string
): void {
  const properties: VentureEventProperties = {
    ...getBaseProperties(sessionId),
    ventureId,
    ventureName,
    founderId,
    industry,
    geography,
  };
  
  trackAsync(AMPLITUDE_EVENTS.VENTURE_CREATED, properties, {
    ventureId,
    founderId,
    sessionId,
    licenseeId: AMPLITUDE_LICENSEE_ID,
  });
}

export function trackFolderStructureCreated(
  sessionId: string,
  ventureId: string,
  ventureName: string,
  folderId: string,
  folderUrl: string,
  context: AmplitudeUserContext
): void {
  const properties = {
    ...getBaseProperties(sessionId),
    ventureId,
    ventureName,
    folderId,
    folderUrl,
  };
  
  trackAsync(AMPLITUDE_EVENTS.FOLDER_STRUCTURE_CREATED, properties, context);
}

export function trackTeamMemberAdded(
  sessionId: string,
  ventureId: string,
  ventureName: string,
  memberName: string,
  memberRole: string,
  teamSize: number,
  context: AmplitudeUserContext
): void {
  const properties = {
    ...getBaseProperties(sessionId),
    ventureId,
    ventureName,
    memberName,
    memberRole,
    teamSize,
  };
  
  trackAsync(AMPLITUDE_EVENTS.TEAM_MEMBER_ADDED, properties, context);
}

export function trackPitchDeckUploaded(
  sessionId: string,
  ventureId: string,
  ventureName: string,
  fileName: string,
  fileSize: number,
  context: AmplitudeUserContext
): void {
  const properties = {
    ...getBaseProperties(sessionId),
    ventureId,
    ventureName,
    fileName,
    fileSize,
  };
  
  trackAsync(AMPLITUDE_EVENTS.PITCH_DECK_UPLOADED, properties, context);
}

export function trackCertificateGenerated(
  ventureId: string,
  ventureName: string,
  proofScore: number,
  certificateUrl: string,
  context: AmplitudeUserContext
): void {
  const properties = {
    ...getBaseProperties(context.sessionId),
    ventureId,
    ventureName,
    proofScore,
    certificateUrl,
  };
  
  trackAsync(AMPLITUDE_EVENTS.CERTIFICATE_GENERATED, properties, context);
}

export function trackReportGenerated(
  ventureId: string,
  ventureName: string,
  proofScore: number,
  reportUrl: string,
  context: AmplitudeUserContext
): void {
  const properties = {
    ...getBaseProperties(context.sessionId),
    ventureId,
    ventureName,
    proofScore,
    reportUrl,
  };
  
  trackAsync(AMPLITUDE_EVENTS.REPORT_GENERATED, properties, context);
}

export function trackEmailSent(
  founderId: string,
  emailType: string,
  recipientEmail: string,
  context: AmplitudeUserContext
): void {
  const properties = {
    ...getBaseProperties(context.sessionId),
    founderId,
    emailType,
    recipientEmail,
    ventureId: context.ventureId,
  };
  
  trackAsync(AMPLITUDE_EVENTS.EMAIL_SENT, properties, context);
}

export function trackEmailVerified(
  founderId: string,
  founderEmail: string
): void {
  const properties = {
    ...getBaseProperties(),
    founderId,
    founderEmail,
    verifiedAt: new Date().toISOString(),
  };
  
  trackAsync(AMPLITUDE_EVENTS.EMAIL_VERIFIED, properties, {
    founderId,
    licenseeId: AMPLITUDE_LICENSEE_ID,
  });
}

// ============================================================================
// Vault Events
// ============================================================================

export function trackFileUploadedToVault(
  ventureId: string,
  fileName: string,
  fileSize: number,
  artifactType: string,
  uploadCount: number,
  context: AmplitudeUserContext
): void {
  const properties: VaultEventProperties = {
    ...getBaseProperties(context.sessionId),
    ventureId,
    fileName,
    fileSize,
    artifactType,
    uploadCount,
  };
  
  trackAsync(AMPLITUDE_EVENTS.FILE_UPLOADED_TO_VAULT, properties, context);
}

// ============================================================================
// Scoring Events
// ============================================================================

export function trackScoreUpdated(
  ventureId: string,
  ventureName: string,
  proofScore: number,
  previousScore: number,
  context: AmplitudeUserContext
): void {
  const properties: ScoringEventProperties = {
    ...getBaseProperties(context.sessionId),
    ventureId,
    ventureName,
    proofScore,
  };
  
  trackAsync(AMPLITUDE_EVENTS.SCORE_UPDATED, {
    ...properties,
    previousScore,
    scoreDelta: proofScore - previousScore,
  }, context);
}

export function trackScoringCompleted(
  ventureId: string,
  ventureName: string,
  proofScore: number,
  proofTagsCount: number,
  dimensionScores: Record<string, number>,
  scoringDurationMs: number,
  context: AmplitudeUserContext
): void {
  const properties: ScoringEventProperties = {
    ...getBaseProperties(context.sessionId),
    ventureId,
    ventureName,
    proofScore,
    proofTagsCount,
    dimensionScores: dimensionScores as any,
    scoringDurationMs,
  };
  
  trackAsync(AMPLITUDE_EVENTS.SCORING_COMPLETED, properties, context);
}

// ============================================================================
// Payment Events
// ============================================================================

export function trackPaymentStarted(
  founderId: string,
  ventureId: string,
  amount: number,
  currency: string,
  packageType: string,
  context: AmplitudeUserContext
): void {
  const properties: PaymentEventProperties = {
    ...getBaseProperties(context.sessionId),
    founderId,
    ventureId,
    amount,
    currency,
    packageType,
  };
  
  trackAsync(AMPLITUDE_EVENTS.PAYMENT_STARTED, properties, context);
}

export function trackPaymentSuccess(
  founderId: string,
  ventureId: string,
  amount: number,
  currency: string,
  orderReference: string,
  packageType: string,
  context: AmplitudeUserContext
): void {
  const properties: PaymentEventProperties = {
    ...getBaseProperties(context.sessionId),
    founderId,
    ventureId,
    amount,
    currency,
    orderReference,
    packageType,
  };
  
  trackAsync(AMPLITUDE_EVENTS.PAYMENT_SUCCESS, properties, context);
  trackAsync(AMPLITUDE_EVENTS.DEAL_ROOM_PURCHASED, properties, context);
}

export function trackPaymentCancelled(
  founderId: string,
  ventureId: string,
  orderReference: string,
  context: AmplitudeUserContext
): void {
  const properties: PaymentEventProperties = {
    ...getBaseProperties(context.sessionId),
    founderId,
    ventureId,
    orderReference,
  };
  
  trackAsync(AMPLITUDE_EVENTS.PAYMENT_CANCELLED, properties, context);
}

export function trackPaymentFailed(
  founderId: string,
  ventureId: string,
  orderReference: string,
  errorMessage: string,
  context: AmplitudeUserContext
): void {
  const properties = {
    ...getBaseProperties(context.sessionId),
    founderId,
    ventureId,
    orderReference,
    errorMessage,
  };
  
  trackAsync(AMPLITUDE_EVENTS.PAYMENT_FAILED, properties, context);
}

// ============================================================================
// Authentication Events
// ============================================================================

export function trackLogin(
  founderId: string,
  founderEmail: string,
  ventureId?: string
): void {
  const properties = {
    ...getBaseProperties(),
    founderId,
    founderEmail,
    ventureId,
    loginMethod: 'email',
  };
  
  trackAsync(AMPLITUDE_EVENTS.LOGIN, properties, {
    founderId,
    ventureId,
    licenseeId: AMPLITUDE_LICENSEE_ID,
  });
}

export function trackLogout(
  founderId: string,
  ventureId?: string
): void {
  const properties = {
    ...getBaseProperties(),
    founderId,
    ventureId,
  };
  
  trackAsync(AMPLITUDE_EVENTS.LOGOUT, properties, {
    founderId,
    ventureId,
    licenseeId: AMPLITUDE_LICENSEE_ID,
  });
}

// Export for initialization in server startup
export default {
  init: initAmplitude,
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingCompleted,
  trackFounderCreated,
  trackVentureCreated,
  trackFolderStructureCreated,
  trackTeamMemberAdded,
  trackPitchDeckUploaded,
  trackCertificateGenerated,
  trackReportGenerated,
  trackEmailSent,
  trackEmailVerified,
  trackFileUploadedToVault,
  trackScoreUpdated,
  trackScoringCompleted,
  trackPaymentStarted,
  trackPaymentSuccess,
  trackPaymentCancelled,
  trackPaymentFailed,
  trackLogin,
  trackLogout,
};
