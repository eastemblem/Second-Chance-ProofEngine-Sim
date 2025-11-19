import { db } from "../db";
import { documentUpload, userActivity } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { COACH_EVENTS } from "@shared/config/coach-events";
import { ActivityService } from "./activity-service";
import type { ActivityContext } from "./activity-service";

/**
 * VaultMilestoneService - Centralized service for emitting ProofVault milestone events
 * 
 * This service checks upload counts and emits milestone events when thresholds are crossed.
 * It ensures idempotency by checking if milestone events already exist before emitting.
 */
export class VaultMilestoneService {
  /**
   * Check and emit milestone events after a ProofVault upload
   * @param founderId - The founder's ID
   * @param ventureId - The venture's ID
   * @param context - Activity context from the request
   */
  static async checkAndEmitMilestones(
    founderId: string,
    ventureId: string,
    context: ActivityContext
  ): Promise<void> {
    try {
      // Count proof-vault uploads (excludes onboarding pitch deck)
      const vaultUploads = await db.select()
        .from(documentUpload)
        .where(and(
          eq(documentUpload.ventureId, ventureId),
          eq(documentUpload.uploadSource, 'proof-vault')
        ));
      
      const uploadCount = vaultUploads.length;

      // Define milestone thresholds
      const milestones = [
        { count: 1, event: COACH_EVENTS.VAULT_FIRST_UPLOAD, title: 'First Upload', description: 'Made your first ProofVault upload!' },
        { count: 10, event: COACH_EVENTS.VAULT_10_FILES_UPLOADED, title: '10 Files Uploaded', description: 'Reached 10 files in ProofVault' },
        { count: 20, event: COACH_EVENTS.VAULT_20_FILES_UPLOADED, title: '20 Files Uploaded', description: 'Reached 20 files in ProofVault' },
        { count: 30, event: COACH_EVENTS.VAULT_30_FILES_UPLOADED, title: '30 Files Uploaded', description: 'Reached 30 files in ProofVault' },
        { count: 50, event: COACH_EVENTS.VAULT_50_FILES_UPLOADED, title: '50 Files Uploaded', description: 'Reached 50 files in ProofVault - Comprehensive proof vault milestone!' },
      ];

      // Check and emit milestone events (in reverse order to emit highest milestone)
      for (const milestone of milestones.reverse()) {
        if (uploadCount >= milestone.count) {
          // Check if milestone already exists (scoped by founderId AND ventureId)
          const existingMilestone = await this.hasMilestone(founderId, ventureId, milestone.event);
          
          if (!existingMilestone) {
            // Emit milestone event
            await ActivityService.logActivity(context, {
              activityType: 'document',
              action: milestone.event,
              title: milestone.title,
              description: milestone.description,
              metadata: { uploadCount },
            });
            
            console.log(`✅ VAULT MILESTONE: Emitted ${milestone.event} for venture ${ventureId} (${uploadCount} uploads)`);
          }
          
          // Only emit the highest milestone reached, not all of them
          break;
        }
      }
    } catch (error) {
      console.error('❌ VAULT MILESTONE: Failed to check/emit milestones:', error);
      // Don't throw - milestone failures shouldn't break uploads
    }
  }

  /**
   * Check if a milestone already exists for a founder/venture pair
   * @param founderId - The founder's ID
   * @param ventureId - The venture's ID
   * @param action - The milestone event action
   * @returns true if milestone exists, false otherwise
   */
  private static async hasMilestone(
    founderId: string,
    ventureId: string,
    action: string
  ): Promise<boolean> {
    const activities = await db.select()
      .from(userActivity)
      .where(and(
        eq(userActivity.founderId, founderId),
        eq(userActivity.ventureId, ventureId),
        eq(userActivity.action, action)
      ))
      .limit(1);
    
    return activities.length > 0;
  }
}
