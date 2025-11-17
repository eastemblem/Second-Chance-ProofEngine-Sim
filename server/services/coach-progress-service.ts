import { db } from "../db";
import { userActivity, coachState } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { appLogger } from "../utils/logger";
import { COACH_EVENTS, JOURNEY_STEP_COMPLETION_EVENTS, type CoachEventMetadata } from "../../shared/config/coach-events";

/**
 * CoachProgressService
 * Aggregates user_activity events to calculate coach progress
 * Stores materialized progress in coach_state for fast API responses
 */
export class CoachProgressService {
  
  /**
   * Calculate coach progress for a founder by aggregating their user_activity events
   * Returns a complete progress snapshot based on actual user actions
   */
  static async calculateProgress(founderId: string, ventureId?: string) {
    try {
      appLogger.info(`[CoachProgress] Calculating progress for founder: ${founderId}`);
      
      // Query all relevant activities for this founder
      const activities = await db
        .select()
        .from(userActivity)
        .where(
          and(
            eq(userActivity.founderId, founderId),
            ventureId ? eq(userActivity.ventureId, ventureId) : sql`true`
          )
        )
        .orderBy(desc(userActivity.createdAt));
      
      appLogger.info(`[CoachProgress] Found ${activities.length} activities`);
      
      // Initialize progress metrics
      const progress = {
        // Onboarding
        onboardingComplete: false,
        dashboardTutorialCompleted: false,
        
        // Experiments
        completedExperimentsCount: 0,
        hasCompletedExperiment: false,
        hasCompleted3Experiments: false,
        firstExperimentCompletedAt: null as Date | null,
        
        // ProofVault uploads
        vaultUploadCount: 0,
        totalUploads: 0,
        distinctArtifactTypesCount: 0,
        firstVaultUploadAt: null as Date | null,
        hasFirstUpload: false,
        has10Uploads: false,
        has20Uploads: false,
        has30Uploads: false,
        
        // Scores
        proofScore: 0,
        vaultScore: 0,
        latestProofScoreAt: null as Date | null,
        
        // Validation Map
        validationMapExported: false,
        validationMapExportedAt: null as Date | null,
        validationMapUploadedToVault: false,
        validationMapUploadedAt: null as Date | null,
        
        // Deal Room
        hasDealRoomAccess: false,
        dealRoomPurchasedAt: null as Date | null,
        
        // Community
        hasAccessedCommunityOrDownloads: false,
        
        // Journey steps completion
        completedSteps: [] as number[],
        
        // Metadata
        lastActivityAt: activities[0]?.createdAt || new Date(),
      };
      
      // Track unique artifact types
      const artifactTypes = new Set<string>();
      
      // Process activities to calculate progress
      for (const activity of activities) {
        const action = activity.action;
        const metadata = activity.metadata as CoachEventMetadata | null;
        
        // Onboarding
        if (action === COACH_EVENTS.ONBOARDING_COMPLETED) {
          progress.onboardingComplete = true;
        }
        
        if (action === COACH_EVENTS.DASHBOARD_TUTORIAL_COMPLETED) {
          progress.dashboardTutorialCompleted = true;
        }
        
        // Experiments
        if (action === COACH_EVENTS.EXPERIMENT_COMPLETED) {
          progress.completedExperimentsCount++;
          progress.hasCompletedExperiment = true;
          if (!progress.firstExperimentCompletedAt) {
            progress.firstExperimentCompletedAt = activity.createdAt;
          }
        }
        
        if (action === COACH_EVENTS.FIRST_EXPERIMENT_COMPLETED) {
          progress.hasCompletedExperiment = true;
          if (!progress.firstExperimentCompletedAt) {
            progress.firstExperimentCompletedAt = activity.createdAt;
          }
        }
        
        if (action === COACH_EVENTS.THREE_EXPERIMENTS_COMPLETED) {
          progress.hasCompleted3Experiments = true;
        }
        
        // ProofVault uploads
        if (action === COACH_EVENTS.VAULT_FILE_UPLOADED) {
          progress.vaultUploadCount++;
          progress.totalUploads++;
          
          // Track artifact types
          if (metadata?.artifactType) {
            artifactTypes.add(metadata.artifactType);
          }
          
          if (!progress.firstVaultUploadAt) {
            progress.firstVaultUploadAt = activity.createdAt;
          }
        }
        
        if (action === COACH_EVENTS.VAULT_FIRST_UPLOAD) {
          progress.hasFirstUpload = true;
          if (!progress.firstVaultUploadAt) {
            progress.firstVaultUploadAt = activity.createdAt;
          }
        }
        
        if (action === COACH_EVENTS.VAULT_10_FILES_UPLOADED) {
          progress.has10Uploads = true;
        }
        
        if (action === COACH_EVENTS.VAULT_20_FILES_UPLOADED) {
          progress.has20Uploads = true;
        }
        
        if (action === COACH_EVENTS.VAULT_30_FILES_UPLOADED) {
          progress.has30Uploads = true;
        }
        
        // Scores
        if (action === COACH_EVENTS.PROOFSCORE_RECEIVED && metadata?.proofScore) {
          progress.proofScore = metadata.proofScore;
          progress.latestProofScoreAt = activity.createdAt;
        }
        
        if (action === COACH_EVENTS.VAULT_SCORE_UPDATED && metadata?.vaultScore) {
          progress.vaultScore = metadata.vaultScore;
        }
        
        // Validation Map
        if (action === COACH_EVENTS.VALIDATION_MAP_EXPORTED) {
          progress.validationMapExported = true;
          progress.validationMapExportedAt = activity.createdAt;
        }
        
        if (action === COACH_EVENTS.VALIDATION_CSV_UPLOADED) {
          progress.validationMapUploadedToVault = true;
          progress.validationMapUploadedAt = activity.createdAt;
        }
        
        // Deal Room
        if (action === COACH_EVENTS.DEAL_ROOM_PURCHASED) {
          progress.hasDealRoomAccess = true;
          progress.dealRoomPurchasedAt = activity.createdAt;
        }
        
        // Community
        if (action === COACH_EVENTS.COMMUNITY_ACCESSED || 
            action === COACH_EVENTS.REPORT_DOWNLOADED || 
            action === COACH_EVENTS.FILE_DOWNLOADED) {
          progress.hasAccessedCommunityOrDownloads = true;
        }
      }
      
      // Calculate distinct artifact types
      progress.distinctArtifactTypesCount = artifactTypes.size;
      
      // Determine completed journey steps based on progress
      progress.completedSteps = this.calculateCompletedSteps(progress, activities);
      
      appLogger.info(`[CoachProgress] Progress calculated:`, {
        experiments: progress.completedExperimentsCount,
        uploads: progress.vaultUploadCount,
        completedSteps: progress.completedSteps.length,
      });
      
      return progress;
      
    } catch (error) {
      appLogger.error(`[CoachProgress] Error calculating progress:`, error);
      throw error;
    }
  }
  
  /**
   * Determine which journey steps are completed based on progress and activities
   */
  private static calculateCompletedSteps(
    progress: any,
    activities: any[]
  ): number[] {
    const completedSteps: number[] = [];
    const activityActions = new Set(activities.map(a => a.action));
    
    // Check each journey step's completion criteria
    for (const [stepId, requiredEvents] of Object.entries(JOURNEY_STEP_COMPLETION_EVENTS)) {
      const stepNum = parseInt(stepId);
      
      // If any of the required events exist, mark step as complete
      const isComplete = requiredEvents.some(event => activityActions.has(event));
      
      if (isComplete) {
        completedSteps.push(stepNum);
      }
    }
    
    return completedSteps.sort((a, b) => a - b);
  }
  
  /**
   * Persist calculated progress to coach_state table
   */
  static async saveProgress(founderId: string, progress: any) {
    try {
      // Check if coach state exists
      const [existingState] = await db
        .select()
        .from(coachState)
        .where(eq(coachState.founderId, founderId))
        .limit(1);
      
      const stateData = {
        completedJourneySteps: progress.completedSteps,
        lastInteractionAt: progress.lastActivityAt,
        updatedAt: new Date(),
      };
      
      if (!existingState) {
        // Create new coach state
        await db.insert(coachState).values({
          founderId,
          currentJourneyStep: progress.completedSteps.length,
          ...stateData,
          isMinimized: false,
          isDismissed: false,
          tutorialCompletedPages: progress.dashboardTutorialCompleted ? ['dashboard'] : [],
        });
        
        appLogger.info(`[CoachProgress] Created new coach state for founder: ${founderId}`);
      } else {
        // Update existing coach state
        await db
          .update(coachState)
          .set(stateData)
          .where(eq(coachState.founderId, founderId));
        
        appLogger.info(`[CoachProgress] Updated coach state for founder: ${founderId}`);
      }
      
    } catch (error) {
      appLogger.error(`[CoachProgress] Error saving progress:`, error);
      throw error;
    }
  }
  
  /**
   * Full recalculation: Calculate and save progress in one operation
   */
  static async recalculateAndSave(founderId: string, ventureId?: string) {
    const progress = await this.calculateProgress(founderId, ventureId);
    await this.saveProgress(founderId, progress);
    return progress;
  }
}
