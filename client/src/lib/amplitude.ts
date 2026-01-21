/**
 * Amplitude Analytics - Client-side tracking
 * Browser SDK wrapper with identity synchronization
 */

import * as amplitude from '@amplitude/analytics-browser';
import {
  AMPLITUDE_EVENTS,
  AMPLITUDE_LICENSEE_ID,
  getUserId,
  getBaseProperties,
  type AmplitudeUserContext,
} from '@shared/config/amplitude';

let isInitialized = false;
let currentContext: AmplitudeUserContext = {
  licenseeId: AMPLITUDE_LICENSEE_ID,
};

/**
 * Initialize Amplitude Browser SDK
 * Automatically restores user identity from localStorage if authenticated
 */
export function initAmplitude(): void {
  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;
  
  if (!apiKey) {
    if (import.meta.env.MODE === 'development') {
      console.warn('[Amplitude] API key not configured - tracking disabled');
    }
    return;
  }
  
  if (isInitialized) return;
  
  try {
    amplitude.init(apiKey, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
        formInteractions: false,
        fileDownloads: false,
      },
    });
    isInitialized = true;
    console.log('[Amplitude] Browser tracking initialized');
    
    // Auto-identify user from stored auth data
    restoreUserIdentity();
  } catch (error) {
    console.error('[Amplitude] Failed to initialize:', error);
  }
}

/**
 * Restore user identity from localStorage
 * Called automatically on initialization to ensure returning users are identified
 */
function restoreUserIdentity(): void {
  try {
    // Check for authenticated user data
    const authUser = localStorage.getItem('auth_user');
    const authVenture = localStorage.getItem('auth_venture');
    
    if (authUser) {
      const user = JSON.parse(authUser);
      if (user.founderId) {
        currentContext.founderId = user.founderId;
        
        // Set user ID to founderId for authenticated users
        amplitude.setUserId(user.founderId);
        
        // Set user properties
        const identifyObj = new amplitude.Identify();
        identifyObj.set('founderId', user.founderId);
        if (user.email) identifyObj.set('founderEmail', user.email);
        if (user.fullName) identifyObj.set('founderName', user.fullName);
        identifyObj.set('licenseeId', AMPLITUDE_LICENSEE_ID);
        amplitude.identify(identifyObj);
        
        if (import.meta.env.MODE === 'development') {
          console.log('[Amplitude] Restored user identity:', user.founderId);
        }
      }
    }
    
    if (authVenture) {
      const venture = JSON.parse(authVenture);
      if (venture.ventureId) {
        currentContext.ventureId = venture.ventureId;
        
        // Update user ID to ventureId (preferred over founderId)
        amplitude.setUserId(venture.ventureId);
        
        // Add venture properties
        const identifyObj = new amplitude.Identify();
        identifyObj.set('ventureId', venture.ventureId);
        if (venture.name) identifyObj.set('ventureName', venture.name);
        amplitude.identify(identifyObj);
        
        if (import.meta.env.MODE === 'development') {
          console.log('[Amplitude] Restored venture identity:', venture.ventureId);
        }
      }
    }
    
    // Check for onboarding session
    const onboardingSession = localStorage.getItem('onboardingSession');
    if (onboardingSession && !currentContext.founderId && !currentContext.ventureId) {
      const session = JSON.parse(onboardingSession);
      if (session.sessionId) {
        currentContext.sessionId = session.sessionId;
        amplitude.setUserId(`session_${session.sessionId}`);
        
        if (import.meta.env.MODE === 'development') {
          console.log('[Amplitude] Restored session identity:', session.sessionId);
        }
      }
    }
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.warn('[Amplitude] Failed to restore user identity:', error);
    }
  }
}

/**
 * Set user context and update Amplitude identity
 */
export function setUserContext(context: Partial<AmplitudeUserContext>): void {
  currentContext = {
    ...currentContext,
    ...context,
  };
  
  if (!isInitialized) return;
  
  const userId = getUserId(currentContext);
  amplitude.setUserId(userId);
  
  if (context.sessionId) {
    amplitude.setDeviceId(context.sessionId);
  }
  
  if (import.meta.env.MODE === 'development') {
    console.log('[Amplitude] User context updated:', { userId, context: currentContext });
  }
}

/**
 * Clear user identity on logout
 */
export function clearUserContext(): void {
  currentContext = {
    licenseeId: AMPLITUDE_LICENSEE_ID,
  };
  
  if (isInitialized) {
    amplitude.reset();
  }
}

/**
 * Track an event
 */
function trackEvent(
  eventName: string,
  properties: Record<string, any> = {}
): void {
  if (!isInitialized) {
    if (import.meta.env.MODE === 'development') {
      console.log(`[Amplitude] Would track: ${eventName}`, properties);
    }
    return;
  }
  
  const eventProperties = {
    ...getBaseProperties(currentContext.sessionId),
    ...properties,
    ventureId: currentContext.ventureId,
    founderId: currentContext.founderId,
  };
  
  amplitude.track(eventName, eventProperties);
}

// ============================================================================
// Onboarding Events
// ============================================================================

export function trackOnboardingStarted(sessionId: string, marketingId?: string): void {
  setUserContext({ sessionId });
  trackEvent(AMPLITUDE_EVENTS.ONBOARDING_STARTED, {
    sessionId,
    marketingId,
    currentStep: 'founder',
  });
}

export function trackOnboardingStepCompleted(
  currentStep: string,
  previousStep: string,
  completedSteps: string[]
): void {
  trackEvent(AMPLITUDE_EVENTS.ONBOARDING_STEP_COMPLETED, {
    currentStep,
    previousStep,
    completedSteps,
  });
}

export function trackOnboardingStepFailed(
  currentStep: string,
  errorMessage: string,
  errorCode?: string
): void {
  trackEvent(AMPLITUDE_EVENTS.ONBOARDING_STEP_FAILED, {
    currentStep,
    errorMessage,
    errorCode,
  });
}

// ============================================================================
// Authentication Events
// ============================================================================

export function trackLogin(founderId: string, founderEmail: string, ventureId?: string): void {
  setUserContext({ founderId, ventureId });
  trackEvent(AMPLITUDE_EVENTS.LOGIN, {
    founderId,
    founderEmail,
    ventureId,
    loginMethod: 'email',
  });
}

export function trackLogout(): void {
  trackEvent(AMPLITUDE_EVENTS.LOGOUT, {
    founderId: currentContext.founderId,
    ventureId: currentContext.ventureId,
  });
  clearUserContext();
}

// ============================================================================
// Dashboard Events
// ============================================================================

export function trackDashboardVisited(): void {
  trackEvent(AMPLITUDE_EVENTS.DASHBOARD_VISITED, {});
}

export function trackValidationMapViewed(): void {
  trackEvent(AMPLITUDE_EVENTS.VALIDATION_MAP_VIEWED, {});
}

export function trackCommunityAccessed(): void {
  trackEvent(AMPLITUDE_EVENTS.COMMUNITY_ACCESSED, {});
}

// ============================================================================
// Payment Events (Client-side)
// ============================================================================

export function trackPaymentStarted(
  amount: number,
  currency: string,
  packageType: string
): void {
  trackEvent(AMPLITUDE_EVENTS.PAYMENT_STARTED, {
    amount,
    currency,
    packageType,
  });
}

export function trackPaymentSuccess(
  orderReference: string,
  amount: number,
  currency: string
): void {
  trackEvent(AMPLITUDE_EVENTS.PAYMENT_SUCCESS, {
    orderReference,
    amount,
    currency,
  });
  trackEvent(AMPLITUDE_EVENTS.DEAL_ROOM_PURCHASED, {
    orderReference,
    amount,
    currency,
  });
}

export function trackPaymentCancelled(orderReference?: string): void {
  trackEvent(AMPLITUDE_EVENTS.PAYMENT_CANCELLED, {
    orderReference,
  });
}

export function trackPaymentFailed(orderReference?: string, errorMessage?: string): void {
  trackEvent(AMPLITUDE_EVENTS.PAYMENT_FAILED, {
    orderReference,
    errorMessage,
  });
}

// ============================================================================
// Identity Updates
// ============================================================================

export function identifyFounder(founderId: string, founderEmail: string, founderName: string): void {
  setUserContext({ founderId });
  
  if (!isInitialized) return;
  
  const identifyObj = new amplitude.Identify();
  identifyObj.set('founderId', founderId);
  identifyObj.set('founderEmail', founderEmail);
  identifyObj.set('founderName', founderName);
  identifyObj.set('licenseeId', AMPLITUDE_LICENSEE_ID);
  
  amplitude.identify(identifyObj);
}

export function identifyVenture(ventureId: string, ventureName: string, founderId: string): void {
  setUserContext({ ventureId, founderId });
  
  if (!isInitialized) return;
  
  const identifyObj = new amplitude.Identify();
  identifyObj.set('ventureId', ventureId);
  identifyObj.set('ventureName', ventureName);
  identifyObj.set('founderId', founderId);
  
  amplitude.identify(identifyObj);
}

// Export all functions
export {
  AMPLITUDE_EVENTS,
  type AmplitudeUserContext,
};

export default {
  init: initAmplitude,
  setUserContext,
  clearUserContext,
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingStepFailed,
  trackLogin,
  trackLogout,
  trackDashboardVisited,
  trackValidationMapViewed,
  trackCommunityAccessed,
  trackPaymentStarted,
  trackPaymentSuccess,
  trackPaymentCancelled,
  trackPaymentFailed,
  identifyFounder,
  identifyVenture,
};
