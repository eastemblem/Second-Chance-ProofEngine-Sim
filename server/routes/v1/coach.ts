import { Router } from "express";
import { db } from "../../db";
import { coachState } from "../../../shared/schema";
import { insertCoachStateSchema, updateCoachStateSchema } from "../../../shared/schema";
import { authenticateToken, type AuthenticatedRequest } from "../../middleware/token-auth";
import { asyncHandler } from "../../utils/error-handler";
import { eq } from "drizzle-orm";
import { appLogger } from "../../utils/logger";
import { databaseService } from "../../services/database-service";
import { CoachProgressService } from "../../services/coach-progress-service";
import { ActivityService } from "../../services/activity-service";
import { COACH_EVENTS } from "../../../shared/config/coach-events";

const router = Router();

// Get current coach state for authenticated user
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const founderId = req.user?.founderId;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    appLogger.info(`[ProofCoach] Fetching state for founder: ${founderId}`);

    const [existingState] = await db
      .select()
      .from(coachState)
      .where(eq(coachState.founderId, founderId))
      .limit(1);

    // If no state exists, create initial state
    if (!existingState) {
      const [newState] = await db
        .insert(coachState)
        .values({
          founderId,
          currentJourneyStep: 0,
          completedJourneySteps: [],
          isMinimized: false,
          isDismissed: false,
          tutorialCompletedPages: [],
          lastInteractionAt: new Date(),
        })
        .returning();

      appLogger.info(`[ProofCoach] Created initial state for founder: ${founderId}`);

      return res.json({
        success: true,
        data: newState,
      });
    }

    return res.json({
      success: true,
      data: existingState,
    });
  })
);

// Update coach state
router.patch(
  "/",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const founderId = req.user?.founderId;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Validate the update payload
    const validatedData = updateCoachStateSchema.parse(req.body);

    appLogger.info(`[ProofCoach] Updating state for founder: ${founderId}`, validatedData);

    // Check if state exists
    const [existingState] = await db
      .select()
      .from(coachState)
      .where(eq(coachState.founderId, founderId))
      .limit(1);

    if (!existingState) {
      // Create new state if doesn't exist
      const [newState] = await db
        .insert(coachState)
        .values({
          founderId,
          ...validatedData,
          lastInteractionAt: new Date(),
        })
        .returning();

      return res.json({
        success: true,
        data: newState,
      });
    }

    // Update existing state
    const [updatedState] = await db
      .update(coachState)
      .set({
        ...validatedData,
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(coachState.founderId, founderId))
      .returning();

    appLogger.info(`[ProofCoach] State updated successfully for founder: ${founderId}`);

    return res.json({
      success: true,
      data: updatedState,
    });
  })
);

// Complete a journey step
router.post(
  "/complete-step",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const founderId = req.user?.founderId;
    const { stepId } = req.body;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (typeof stepId !== "number") {
      return res.status(400).json({
        success: false,
        error: "stepId must be a number",
      });
    }

    appLogger.info(`[ProofCoach] Completing step ${stepId} for founder: ${founderId}`);

    const [existingState] = await db
      .select()
      .from(coachState)
      .where(eq(coachState.founderId, founderId))
      .limit(1);

    if (!existingState) {
      // Create new state with this step completed
      const [newState] = await db
        .insert(coachState)
        .values({
          founderId,
          currentJourneyStep: stepId + 1,
          completedJourneySteps: [stepId],
          isMinimized: false,
          isDismissed: false,
          tutorialCompletedPages: [],
          lastInteractionAt: new Date(),
        })
        .returning();

      return res.json({
        success: true,
        data: newState,
      });
    }

    // Add step to completed steps if not already there
    const completedSteps = existingState.completedJourneySteps as number[];
    const updatedCompletedSteps = completedSteps.includes(stepId)
      ? completedSteps
      : [...completedSteps, stepId];

    const [updatedState] = await db
      .update(coachState)
      .set({
        currentJourneyStep: stepId + 1,
        completedJourneySteps: updatedCompletedSteps,
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(coachState.founderId, founderId))
      .returning();

    return res.json({
      success: true,
      data: updatedState,
    });
  })
);

// Mark tutorial as completed for a specific page
router.post(
  "/complete-tutorial",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const founderId = req.user?.founderId;
    const { page } = req.body;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (typeof page !== "string") {
      return res.status(400).json({
        success: false,
        error: "page must be a string",
      });
    }

    appLogger.info(`[ProofCoach] Completing tutorial for page "${page}" for founder: ${founderId}`);

    const [existingState] = await db
      .select()
      .from(coachState)
      .where(eq(coachState.founderId, founderId))
      .limit(1);

    if (!existingState) {
      // Create new state
      const [newState] = await db
        .insert(coachState)
        .values({
          founderId,
          currentJourneyStep: 0,
          completedJourneySteps: [],
          isMinimized: false,
          isDismissed: false,
          tutorialCompletedPages: [page],
          lastInteractionAt: new Date(),
        })
        .returning();

      return res.json({
        success: true,
        data: newState,
      });
    }

    // Add page to completed tutorials if not already there
    const completedPages = existingState.tutorialCompletedPages as string[];
    const updatedCompletedPages = completedPages.includes(page)
      ? completedPages
      : [...completedPages, page];

    const [updatedState] = await db
      .update(coachState)
      .set({
        tutorialCompletedPages: updatedCompletedPages,
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(coachState.founderId, founderId))
      .returning();

    // Emit DASHBOARD_TUTORIAL_COMPLETED event if dashboard tutorial was completed
    if (page === 'dashboard' && !completedPages.includes(page)) {
      try {
        // Get venture ID for the event
        const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
        const ventureId = dashboardData?.venture?.ventureId;

        await ActivityService.logActivity(
          { founderId, ventureId },
          {
            activityType: 'navigation',
            action: COACH_EVENTS.DASHBOARD_TUTORIAL_COMPLETED,
            title: 'Dashboard Tutorial Completed',
            description: 'Finished interactive dashboard tutorial',
            metadata: { page: 'dashboard' }
          }
        );
        appLogger.info(`[ProofCoach] DASHBOARD_TUTORIAL_COMPLETED event logged for founder: ${founderId}`);
      } catch (eventError) {
        appLogger.error('[ProofCoach] Failed to log DASHBOARD_TUTORIAL_COMPLETED event:', eventError);
        // Don't fail the request if event logging fails
      }
    }

    return res.json({
      success: true,
      data: updatedState,
    });
  })
);

// Track custom events (e.g., DEAL_ROOM_VIEWED)
router.post(
  "/track-event",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const founderId = req.user?.founderId;
    const { eventType, metadata } = req.body;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (typeof eventType !== "string") {
      return res.status(400).json({
        success: false,
        error: "eventType must be a string",
      });
    }

    appLogger.info(`[ProofCoach] Tracking event "${eventType}" for founder: ${founderId}`);

    // Map frontend event types to COACH_EVENTS
    const eventMapping: Record<string, string> = {
      'deal_room_viewed': COACH_EVENTS.DEAL_ROOM_VIEWED,
    };

    const coachEvent = eventMapping[eventType];
    if (!coachEvent) {
      return res.status(400).json({
        success: false,
        error: `Unknown event type: ${eventType}`,
      });
    }

    // Get venture ID for the event
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    const ventureId = dashboardData?.venture?.ventureId;

    // Emit the event
    try {
      await ActivityService.logActivity(
        { founderId, ventureId },
        {
          activityType: 'navigation',
          action: coachEvent,
          title: `${eventType.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
          description: `User triggered ${eventType} event`,
          metadata: metadata || {}
        }
      );
      appLogger.info(`[ProofCoach] ${coachEvent} event logged for founder: ${founderId}`);
    } catch (eventError) {
      appLogger.error(`[ProofCoach] Failed to log ${coachEvent} event:`, eventError);
      return res.status(500).json({
        success: false,
        error: 'Failed to log event',
      });
    }

    return res.json({
      success: true,
      message: `Event ${eventType} tracked successfully`,
    });
  })
);

// Reset coach state (for testing or user request)
router.post(
  "/reset",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const founderId = req.user?.founderId;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    appLogger.info(`[ProofCoach] Resetting state for founder: ${founderId}`);

    const [resetState] = await db
      .update(coachState)
      .set({
        currentJourneyStep: 0,
        completedJourneySteps: [],
        isMinimized: false,
        isDismissed: false,
        tutorialCompletedPages: [],
        lastInteractionAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(coachState.founderId, founderId))
      .returning();

    if (!resetState) {
      return res.status(404).json({
        success: false,
        error: "Coach state not found",
      });
    }

    return res.json({
      success: true,
      data: resetState,
      message: "Coach state reset successfully",
    });
  })
);

// Get venture progress metrics for Coach Mode journey tracking
router.get(
  "/progress",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const founderId = req.user?.founderId;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    appLogger.info(`[ProofCoach] Fetching progress for founder: ${founderId}`);

    // Get founder's latest venture
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({
        success: false,
        error: "No venture found. Please complete onboarding first.",
      });
    }

    const ventureId = dashboardData.venture.ventureId;

    // Calculate progress from user_activity events
    const progressData = await CoachProgressService.calculateProgress(founderId, ventureId);

    if (!progressData) {
      return res.status(404).json({
        success: false,
        error: "Unable to fetch progress data",
      });
    }

    appLogger.info(`[ProofCoach] Progress calculated from user activities for founder: ${founderId}`);

    return res.json({
      success: true,
      data: progressData,
    });
  })
);

// Recalculate and persist coach progress (for testing/debugging)
router.post(
  "/recalculate-progress",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const founderId = req.user?.founderId;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    appLogger.info(`[ProofCoach] Recalculating progress for founder: ${founderId}`);

    // Get founder's latest venture
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({
        success: false,
        error: "No venture found. Please complete onboarding first.",
      });
    }

    const ventureId = dashboardData.venture.ventureId;

    // Recalculate and save progress
    const progressData = await CoachProgressService.recalculateAndSave(founderId, ventureId);

    appLogger.info(`[ProofCoach] Progress recalculated and saved for founder: ${founderId}`);

    return res.json({
      success: true,
      data: progressData,
      message: "Progress recalculated and saved successfully",
    });
  })
);

export default router;
