import express from "express";
import { asyncHandler, createSuccessResponse } from "../../utils/error-handler";
import { eastEmblemAPI } from "../../eastemblem-api";
import { getSessionId, getSessionData } from "../../utils/session-manager";
import { requireSession } from "../../middleware/auth";
import { appLogger } from "../../utils/logger";

const router = express.Router();

// Generate report (session-based)
router.post("/generate", requireSession, asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const sessionData = await getSessionData(sessionId);
  
  if (!sessionData) {
    throw new Error("Session not found");
  }

  appLogger.business("Legacy report generation for session:", sessionId);

  try {
    // Extract relevant data from session
    const { founderData, ventureData, evaluationData, vaultData } = sessionData;
    
    if (!founderData || !ventureData) {
      throw new Error("Incomplete onboarding data for report generation");
    }

    // Use EastEmblem API to generate report
    const response = await eastEmblemAPI.generateReport({
      session_id: sessionId,
      founder_name: founderData.firstName + ' ' + founderData.lastName,
      venture_name: ventureData.name,
      proof_score: evaluationData?.proofScore || 0,
      proof_tags: evaluationData?.proofTags || [],
      file_count: vaultData?.totalFiles || 0,
      categories: vaultData?.categories || {},
      completion_date: new Date().toISOString(),
    });

    if (response.success) {
      res.json(createSuccessResponse({
        reportId: response.report_id,
        reportUrl: response.report_url,
        downloadUrl: response.download_url,
        generated_at: new Date().toISOString(),
      }));
    } else {
      throw new Error("Failed to generate report");
    }
  } catch (error) {
    appLogger.business("Legacy report generation failed:", error.message);
    throw error;
  }
}));

// Get report status
router.get("/status/:sessionId", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  appLogger.business("Legacy report status check for session:", sessionId);

  try {
    // Check with EastEmblem API for report status
    const response = await eastEmblemAPI.getReportStatus(sessionId);
    
    if (response.success) {
      res.json(createSuccessResponse({
        exists: response.exists,
        reportId: response.report_id,
        reportUrl: response.report_url,
        downloadUrl: response.download_url,
        generated_at: response.generated_at,
      }));
    } else {
      res.json(createSuccessResponse({
        exists: false,
        message: "Report not found",
      }));
    }
  } catch (error) {
    appLogger.business("Legacy report status check failed:", error.message);
    res.json(createSuccessResponse({
      exists: false,
      message: "Report status unavailable",
    }));
  }
}));

// Download report
router.get("/download/:sessionId", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  appLogger.business("Legacy report download for session:", sessionId);

  try {
    // Get report download URL from EastEmblem API
    const response = await eastEmblemAPI.getReportDownload(sessionId);
    
    if (response.success && response.download_url) {
      // Redirect to the actual download URL
      res.redirect(response.download_url);
    } else {
      throw new Error("Report download not available");
    }
  } catch (error) {
    appLogger.business("Legacy report download failed:", error.message);
    res.status(404).json({
      success: false,
      error: "Report not found or download unavailable",
    });
  }
}));

export default router;