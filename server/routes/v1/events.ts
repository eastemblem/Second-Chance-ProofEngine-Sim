import { Router } from "express";
import { asyncHandler } from "../../utils/error-handler";
import { eastEmblemAPI } from "../../eastemblem-api";
import { appLogger } from "../../utils/logger";

const router = Router();

/**
 * GET /api/v1/events/upcoming
 * Fetch upcoming Founders Live events from EastEmblem API
 */
router.get(
  "/upcoming",
  asyncHandler(async (req, res) => {
    appLogger.info("[Events] Fetching upcoming events");

    try {
      const events = await eastEmblemAPI.getUpcomingEvents();

      appLogger.info(`[Events] Successfully fetched ${events.length} upcoming events`);

      return res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      appLogger.error("[Events] Error fetching upcoming events", { error });

      return res.status(500).json({
        success: false,
        error: "Failed to fetch upcoming events",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  })
);

export default router;
