import express from "express";
import { asyncHandler, createSuccessResponse } from "../../utils/error-handler";
import { getSessionId, getSessionData } from "../../utils/session-manager";
import { requireSession } from "../../middleware/auth";
import { appLogger } from "../../utils/logger";

const router = express.Router();

// Get legacy dashboard data (session-based)
router.get("/validation", requireSession, asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const sessionData = await getSessionData(sessionId);
  
  if (!sessionData) {
    throw new Error("Session not found");
  }

  appLogger.business("Legacy dashboard validation data for session:", sessionId);

  // Extract data from session
  const { founderData, ventureData, evaluationData } = sessionData;
  
  const responseData = {
    founder: {
      id: sessionId,
      name: founderData ? `${founderData.firstName} ${founderData.lastName}` : "Unknown",
      email: founderData?.email || "",
    },
    venture: {
      name: ventureData?.name || "Unnamed Venture",
      industry: ventureData?.industry || "Unknown",
      stage: ventureData?.revenueStage || "Unknown",
    },
    validation: {
      proofScore: evaluationData?.proofScore || 0,
      proofTags: evaluationData?.proofTags || [],
      unlockedTags: evaluationData?.proofTags?.length || 0,
      totalTags: 21,
      investmentReadiness: getInvestmentReadiness(evaluationData?.proofScore || 0),
      lastUpdated: evaluationData?.lastUpdated || new Date().toISOString(),
    },
  };

  res.json(createSuccessResponse(responseData));
}));

// Get legacy vault data (session-based)
router.get("/vault", requireSession, asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const sessionData = await getSessionData(sessionId);
  
  if (!sessionData) {
    throw new Error("Session not found");
  }

  appLogger.business("Legacy dashboard vault data for session:", sessionId);

  const { vaultData } = sessionData;
  
  const responseData = {
    totalFiles: vaultData?.totalFiles || 0,
    categories: vaultData?.categories || {},
    files: vaultData?.files || [],
    folders: vaultData?.folders || [],
    lastUpdated: new Date().toISOString(),
  };

  res.json(createSuccessResponse(responseData));
}));

// Get legacy activity data (session-based)
router.get("/activity", requireSession, asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const sessionData = await getSessionData(sessionId);
  
  if (!sessionData) {
    throw new Error("Session not found");
  }

  appLogger.business("Legacy dashboard activity data for session:", sessionId);

  const { activityData } = sessionData;
  
  // Generate recent activities based on session progress
  const activities = generateSessionActivities(sessionData);

  const responseData = {
    recentActivities: activities,
    totalActivities: activities.length,
    lastActivity: activities[0]?.timestamp || new Date().toISOString(),
  };

  res.json(createSuccessResponse(responseData));
}));

// Helper function to determine investment readiness
function getInvestmentReadiness(proofScore: number): string {
  if (proofScore >= 80) return "Investment Ready";
  if (proofScore >= 60) return "Nearly Ready";
  if (proofScore >= 40) return "Development Stage";
  if (proofScore >= 20) return "Early Stage";
  return "Concept Stage";
}

// Helper function to generate activities from session data
function generateSessionActivities(sessionData: any): any[] {
  const activities = [];
  const now = new Date();

  // Add onboarding completion activities
  if (sessionData.founderData) {
    activities.push({
      id: `founder-${sessionData.sessionId}`,
      type: "onboarding",
      action: "completed_founder_profile",
      description: "Completed founder profile",
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      icon: "User",
      color: "blue",
    });
  }

  if (sessionData.ventureData) {
    activities.push({
      id: `venture-${sessionData.sessionId}`,
      type: "onboarding",
      action: "completed_venture_details",
      description: "Added venture information",
      timestamp: new Date(now.getTime() - 45000).toISOString(),
      icon: "Building",
      color: "green",
    });
  }

  if (sessionData.vaultData?.files?.length > 0) {
    activities.push({
      id: `upload-${sessionData.sessionId}`,
      type: "upload",
      action: "uploaded_documents",
      description: `Uploaded ${sessionData.vaultData.files.length} document(s)`,
      timestamp: new Date(now.getTime() - 30000).toISOString(),
      icon: "Upload",
      color: "purple",
    });
  }

  if (sessionData.evaluationData) {
    activities.push({
      id: `score-${sessionData.sessionId}`,
      type: "evaluation",
      action: "score_generated",
      description: `ProofScore calculated: ${sessionData.evaluationData.proofScore}`,
      timestamp: new Date(now.getTime() - 15000).toISOString(),
      icon: "Award",
      color: "gold",
    });
  }

  return activities.slice(0, 10); // Return most recent 10 activities
}

export default router;