import { Router } from "express";
import { authenticateToken, type AuthenticatedRequest } from "../../middleware/token-auth";
import { asyncHandler } from "../../utils/error-handler";
import { ActivityService } from "../../services/activity-service";
import { appLogger } from "../../utils/logger";
import { z } from "zod";
import { storage } from "../../storage";

const router = Router();

// Schema for activity logging request
const logActivitySchema = z.object({
  action: z.string(),
  title: z.string(),
  description: z.string().optional(),
  activityType: z.enum(['account', 'venture', 'document', 'evaluation', 'authentication', 'navigation', 'system']).default('venture'),
  metadata: z.record(z.any()).optional(),
  entityId: z.string().optional(),
  entityType: z.string().optional()
});

/**
 * POST /api/v1/activity/log
 * Log a user activity event (e.g., CERTIFICATE_DOWNLOADED, REPORT_DOWNLOADED)
 */
router.post(
  "/log",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const founderId = req.user?.founderId;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Get founder's current venture for proper event scoping
    let ventureId: string | undefined;
    try {
      const ventures = await storage.getVenturesByFounderId(founderId);
      const currentVenture = ventures.find((v: any) => v.isCurrent === true) || ventures[0];
      ventureId = currentVenture?.ventureId;
    } catch (error) {
      appLogger.warn('Failed to get venture for activity logging', { 
        founderId,
        error 
      });
    }

    // Validate request body
    const validationResult = logActivitySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: validationResult.error.errors,
      });
    }

    const { action, title, description, activityType, metadata, entityId, entityType } = validationResult.data;

    appLogger.info(`[Activity] Logging user activity: ${action}`, {
      founderId,
      ventureId,
      action,
    });

    try {
      // Log the activity
      await ActivityService.logActivity(
        {
          founderId,
          ventureId: ventureId || undefined,
        },
        {
          activityType,
          action,
          title,
          description,
          metadata,
          entityId,
          entityType,
        }
      );

      appLogger.info(`[Activity] Successfully logged activity: ${action}`, {
        founderId,
        ventureId,
      });

      return res.json({
        success: true,
        message: "Activity logged successfully",
      });
    } catch (error) {
      appLogger.error(`[Activity] Error logging activity: ${action}`, {
        founderId,
        ventureId,
        error,
      });

      return res.status(500).json({
        success: false,
        error: "Failed to log activity",
      });
    }
  })
);

export default router;
