import express from "express";
import { asyncHandler, createSuccessResponse } from "../../utils/error-handler";
import { eastEmblemAPI } from "../../eastemblem-api";
import { getSessionId, getSessionData } from "../../utils/session-manager";
import { requireSession } from "../../middleware/auth";
import { appLogger } from "../../utils/logger";

const router = express.Router();

// Generate certificate (session-based)
router.post("/generate", requireSession, asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const sessionData = await getSessionData(sessionId);
  
  if (!sessionData) {
    throw new Error("Session not found");
  }

  appLogger.business("Legacy certificate generation for session:", sessionId);

  try {
    // Extract relevant data from session
    const { founderData, ventureData, evaluationData } = sessionData;
    
    if (!founderData || !ventureData) {
      throw new Error("Incomplete onboarding data for certificate generation");
    }

    // Use EastEmblem API to generate certificate
    const response = await eastEmblemAPI.generateCertificate({
      session_id: sessionId,
      founder_name: founderData.firstName + ' ' + founderData.lastName,
      venture_name: ventureData.name,
      proof_score: evaluationData?.proofScore || 0,
      completion_date: new Date().toISOString(),
    });

    if (response.success) {
      res.json(createSuccessResponse({
        certificateId: response.certificate_id,
        certificateUrl: response.certificate_url,
        downloadUrl: response.download_url,
        generated_at: new Date().toISOString(),
      }));
    } else {
      throw new Error("Failed to generate certificate");
    }
  } catch (error) {
    appLogger.business("Legacy certificate generation failed:", error.message);
    throw error;
  }
}));

// Get certificate status
router.get("/status/:sessionId", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  appLogger.business("Legacy certificate status check for session:", sessionId);

  try {
    // Check with EastEmblem API for certificate status
    const response = await eastEmblemAPI.getCertificateStatus(sessionId);
    
    if (response.success) {
      res.json(createSuccessResponse({
        exists: response.exists,
        certificateId: response.certificate_id,
        certificateUrl: response.certificate_url,
        downloadUrl: response.download_url,
        generated_at: response.generated_at,
      }));
    } else {
      res.json(createSuccessResponse({
        exists: false,
        message: "Certificate not found",
      }));
    }
  } catch (error) {
    appLogger.business("Legacy certificate status check failed:", error.message);
    res.json(createSuccessResponse({
      exists: false,
      message: "Certificate status unavailable",
    }));
  }
}));

// Download certificate
router.get("/download/:sessionId", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  appLogger.business("Legacy certificate download for session:", sessionId);

  try {
    // Get certificate download URL from EastEmblem API
    const response = await eastEmblemAPI.getCertificateDownload(sessionId);
    
    if (response.success && response.download_url) {
      // Redirect to the actual download URL
      res.redirect(response.download_url);
    } else {
      throw new Error("Certificate download not available");
    }
  } catch (error) {
    appLogger.business("Legacy certificate download failed:", error.message);
    res.status(404).json({
      success: false,
      error: "Certificate not found or download unavailable",
    });
  }
}));

export default router;