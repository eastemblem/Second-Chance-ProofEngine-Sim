// Centralized session management to prevent data loss and ensure proper sequencing
export interface SessionStep {
  stepKey: string;
  data: any;
  completedAt: string;
  version: number;
}

export interface OnboardingSessionData {
  sessionId: string;
  currentStep: string;
  currentStepIndex: number;
  stepData: Record<string, any>;
  completedSteps: string[];
  stepHistory: SessionStep[];
  isComplete: boolean;
  createdAt: string;
  lastUpdated: string;
  version: number;
}

export class SessionManager {
  private static readonly STORAGE_KEY = 'onboardingSession';
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
  private static readonly VERSION = 1;

  static async saveSession(sessionData: OnboardingSessionData): Promise<boolean> {
    try {
      const serialized = JSON.stringify(sessionData);
      
      // Check storage size limit
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        console.error('Session data exceeds storage limit');
        return false;
      }

      // Save with versioning
      const versionedData = {
        ...sessionData,
        version: this.VERSION,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versionedData));
      console.log('Session saved successfully:', versionedData);
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }

  static loadSession(): OnboardingSessionData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Version compatibility check
      if (parsed.version !== this.VERSION) {
        console.warn('Session version mismatch, clearing session');
        this.clearSession();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load session:', error);
      this.clearSession();
      return null;
    }
  }

  static async updateStep(
    sessionData: OnboardingSessionData, 
    stepKey: string, 
    stepData: any
  ): Promise<OnboardingSessionData> {
    // Prevent key collisions by using step-specific namespacing
    const stepTimestamp = new Date().toISOString();
    const stepVersion = (sessionData.stepHistory?.filter(s => s.stepKey === stepKey).length || 0) + 1;
    
    const stepRecord: SessionStep = {
      stepKey,
      data: stepData,
      completedAt: stepTimestamp,
      version: stepVersion
    };

    // Merge data properly without overwriting
    const existingStepData = sessionData.stepData?.[stepKey] || {};
    const mergedStepData = {
      ...existingStepData,
      ...stepData,
      completedAt: stepTimestamp,
      version: stepVersion
    };

    // Update completed steps array safely
    const completedSteps = Array.isArray(sessionData.completedSteps) 
      ? sessionData.completedSteps 
      : [];
    
    const updatedCompletedSteps = completedSteps.includes(stepKey)
      ? completedSteps
      : [...completedSteps, stepKey];

    // Update step history for audit trail
    const stepHistory = Array.isArray(sessionData.stepHistory)
      ? sessionData.stepHistory
      : [];
    
    const updatedStepHistory = [...stepHistory, stepRecord];

    const updatedSession: OnboardingSessionData = {
      ...sessionData,
      stepData: {
        ...sessionData.stepData,
        [stepKey]: mergedStepData
      },
      completedSteps: updatedCompletedSteps,
      stepHistory: updatedStepHistory,
      lastUpdated: stepTimestamp
    };

    // Save with error handling
    const saveSuccess = await this.saveSession(updatedSession);
    if (!saveSuccess) {
      throw new Error('Failed to save session data');
    }

    return updatedSession;
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  static validateSession(sessionData: OnboardingSessionData): boolean {
    return !!(
      sessionData?.sessionId &&
      sessionData?.currentStep &&
      typeof sessionData?.currentStepIndex === 'number' &&
      Array.isArray(sessionData?.completedSteps) &&
      sessionData?.stepData
    );
  }

  static getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const used = stored ? stored.length : 0;
      const available = this.MAX_STORAGE_SIZE - used;
      const percentage = (used / this.MAX_STORAGE_SIZE) * 100;
      
      return { used, available, percentage };
    } catch {
      return { used: 0, available: this.MAX_STORAGE_SIZE, percentage: 0 };
    }
  }
}