import { db } from "../db";
import { userActivity, coachState, venture, documentUpload, ventureExperiments } from "@shared/schema";
import { eq, and, desc, sql, count, countDistinct } from "drizzle-orm";
import { appLogger } from "../utils/logger";
import { COACH_EVENTS, JOURNEY_STEP_COMPLETION_EVENTS, type CoachEventMetadata } from "../../shared/config/coach-events";

/**
 * CoachProgressService
 * Aggregates user_activity events to calculate coach progress
 * Stores materialized progress in coach_state for fast API responses
 */
export class CoachProgressService {
  
  /**
   * Calculate coach progress for a founder by combining real database queries with event tracking
   * Returns a complete progress snapshot based on actual data and user actions
   */
  static async calculateProgress(founderId: string, ventureId?: string) {
    try {
      appLogger.info(`[CoachProgress] Calculating progress for founder: ${founderId}, ventureId: ${ventureId || 'all'}`);
      
      // STEP 1: Query real data from source tables
      
      // Get venture data (proofScore, vaultScore, onboarding status)
      const ventures = await db
        .select()
        .from(venture)
        .where(
          and(
            eq(venture.founderId, founderId),
            ventureId ? eq(venture.ventureId, ventureId) : sql`true`
          )
        );
      
      const currentVenture = ventureId ? ventures.find(v => v.ventureId === ventureId) : ventures[0];
      
      // Get ProofVault upload counts (uploadSource='proof-vault')
      const vaultUploadsQuery = db
        .select({ count: count() })
        .from(documentUpload)
        .where(
          and(
            eq(documentUpload.uploadSource, 'proof-vault'),
            ventureId ? eq(documentUpload.ventureId, ventureId) : sql`true`
          )
        );
      
      const totalUploadsQuery = db
        .select({ count: count() })
        .from(documentUpload)
        .where(
          ventureId ? eq(documentUpload.ventureId, ventureId) : sql`true`
        );
      
      // Get distinct artifact types count
      const distinctArtifactTypesQuery = db
        .select({ 
          artifactType: documentUpload.artifactType,
        })
        .from(documentUpload)
        .where(
          and(
            eq(documentUpload.uploadSource, 'proof-vault'),
            ventureId ? eq(documentUpload.ventureId, ventureId) : sql`true`
          )
        );
      
      // Get first vault upload timestamp
      const firstVaultUploadQuery = db
        .select({ createdAt: documentUpload.createdAt })
        .from(documentUpload)
        .where(
          and(
            eq(documentUpload.uploadSource, 'proof-vault'),
            ventureId ? eq(documentUpload.ventureId, ventureId) : sql`true`
          )
        )
        .orderBy(documentUpload.createdAt)
        .limit(1);
      
      // Get completed experiments count
      const completedExperimentsQuery = db
        .select({ 
          count: count(),
          completedAt: ventureExperiments.completedAt 
        })
        .from(ventureExperiments)
        .where(
          and(
            eq(ventureExperiments.status, 'completed'),
            ventureId ? eq(ventureExperiments.ventureId, ventureId) : sql`true`
          )
        );
      
      // Execute all queries in parallel
      const [
        vaultUploadsResult,
        totalUploadsResult,
        distinctArtifactTypesResult,
        firstVaultUploadResult,
        completedExperimentsResult,
      ] = await Promise.all([
        vaultUploadsQuery,
        totalUploadsQuery,
        distinctArtifactTypesQuery,
        firstVaultUploadQuery,
        completedExperimentsQuery,
      ]);
      
      const vaultUploadCount = vaultUploadsResult[0]?.count || 0;
      const totalUploads = totalUploadsResult[0]?.count || 0;
      const distinctArtifactTypes = new Set(distinctArtifactTypesResult.map(r => r.artifactType).filter(Boolean));
      const firstVaultUploadAt = firstVaultUploadResult[0]?.createdAt || null;
      const completedExperimentsCount = completedExperimentsResult.length;
      const firstExperimentCompletedAt = completedExperimentsResult
        .filter(e => e.completedAt)
        .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime())[0]?.completedAt || null;
      
      appLogger.info(`[CoachProgress] Real data counts:`, {
        vaultUploadCount,
        totalUploads,
        distinctArtifactTypesCount: distinctArtifactTypes.size,
        completedExperimentsCount,
      });
      
      // STEP 2: Query event data for milestone flags and action-based tracking
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
      
      // Initialize progress metrics with REAL DATA
      const progress = {
        // Onboarding - determined by venture having a proofScore
        onboardingComplete: currentVenture ? (currentVenture.proofScore || 0) > 0 : false,
        dashboardTutorialCompleted: false, // Event-based
        
        // Experiments - from database query
        completedExperimentsCount,
        hasCompletedExperiment: completedExperimentsCount > 0,
        hasCompleted3Experiments: completedExperimentsCount >= 3,
        hasCompleted5Experiments: completedExperimentsCount >= 5,
        firstExperimentCompletedAt,
        
        // ProofVault uploads - from database query
        vaultUploadCount: Number(vaultUploadCount),
        totalUploads: Number(totalUploads),
        distinctArtifactTypesCount: distinctArtifactTypes.size,
        firstVaultUploadAt,
        hasFirstUpload: false, // Event-based milestone
        has10Uploads: false, // Event-based milestone
        has20Uploads: false, // Event-based milestone
        has30Uploads: false, // Event-based milestone
        has50Uploads: false, // Event-based milestone
        
        // Scores - from venture table
        proofScore: currentVenture?.proofScore || 0,
        vaultScore: currentVenture?.vaultScore || 0,
        latestProofScoreAt: currentVenture?.updatedAt || null,
        hasReached65Score: false, // Event-based milestone
        hasReached70Score: false, // Event-based milestone
        hasReached80Score: false, // Event-based milestone
        
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
        hasCertificateDownloaded: false,
        hasReportDownloaded: false,
        
        // Journey steps completion
        completedSteps: [] as number[],
        
        // Metadata
        lastActivityAt: activities[0]?.createdAt || new Date(),
      };
      
      // STEP 3: Process event-based milestone flags and action-based tracking
      for (const activity of activities) {
        const action = activity.action;
        const metadata = activity.metadata as CoachEventMetadata | null;
        
        // Dashboard Tutorial (action-based, not stored in DB)
        if (action === COACH_EVENTS.DASHBOARD_TUTORIAL_COMPLETED) {
          progress.dashboardTutorialCompleted = true;
        }
        
        // Milestone flags (event-based achievements)
        if (action === COACH_EVENTS.VAULT_FIRST_UPLOAD) {
          progress.hasFirstUpload = true;
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
        
        if (action === COACH_EVENTS.VAULT_50_FILES_UPLOADED) {
          progress.has50Uploads = true;
        }
        
        if (action === COACH_EVENTS.PROOFSCORE_65_REACHED) {
          progress.hasReached65Score = true;
        }
        
        if (action === COACH_EVENTS.PROOFSCORE_70_REACHED) {
          progress.hasReached70Score = true;
        }
        
        if (action === COACH_EVENTS.PROOFSCORE_80_REACHED) {
          progress.hasReached80Score = true;
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
        
        // Community & Downloads
        if (action === COACH_EVENTS.COMMUNITY_ACCESSED || 
            action === COACH_EVENTS.REPORT_DOWNLOADED || 
            action === COACH_EVENTS.FILE_DOWNLOADED) {
          progress.hasAccessedCommunityOrDownloads = true;
        }
        
        if (action === COACH_EVENTS.CERTIFICATE_DOWNLOADED) {
          progress.hasCertificateDownloaded = true;
        }
        
        if (action === COACH_EVENTS.REPORT_DOWNLOADED) {
          progress.hasReportDownloaded = true;
        }
      }
      
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
