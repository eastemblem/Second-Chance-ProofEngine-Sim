import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { asyncHandler, createSuccessResponse } from "../../utils/error-handler";
import { onboardingService } from "../../services/onboarding-service";
import { eastEmblemAPI } from "../../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../../utils/session-manager";
import { cleanupUploadedFile } from "../../utils/file-cleanup";
import { validateRequest, fileUploadSchema } from "../../middleware/validation";
import { requireSession, requireFields } from "../../middleware/auth";
import { safeValidate } from "../../utils/validation";
// Import schemas from the shared schema file
import { createInsertSchema } from "drizzle-zod";
import { founder, venture, teamMember } from "../../../shared/schema";

// Create validation schemas
const founderOnboardingSchema = createInsertSchema(founder);
const ventureOnboardingSchema = createInsertSchema(venture);
const teamMemberSchema = createInsertSchema(teamMember);
import { appLogger } from "../../utils/logger";

const router = express.Router();

// Configure multer for onboarding file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${timestamp}_${cleanName}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, PPT, and PPTX files are allowed."));
    }
  },
});

// Initialize onboarding session
router.post("/session/init", requireSession, asyncHandler(async (req, res) => {
  const sessionId = await onboardingService.initializeSession(req);
  const session = await onboardingService.getSession(sessionId);

  appLogger.business("Legacy onboarding session initialized:", sessionId);

  // If session is in analysis step but missing scoring result, reset to appropriate step
  let currentStep = session?.currentStep || "founder";
  let stepData = session?.stepData || {};
  
  if (currentStep === "analysis" && !stepData.scoringResult) {
    // Determine the correct step based on completed steps
    const completedSteps = session?.completedSteps || [];
    if (completedSteps.includes("founder") && completedSteps.includes("venture")) {
      currentStep = "team";
    } else if (completedSteps.includes("founder")) {
      currentStep = "venture";
    } else {
      currentStep = "founder";
    }
    
    appLogger.business("Reset session step from analysis to:", currentStep);
  }

  res.json(createSuccessResponse({
    sessionId,
    currentStep,
    stepData,
    completedSteps: session?.completedSteps || [],
    isComplete: session?.isComplete || false,
  }));
}));

// Get session status
router.get("/session/:sessionId", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await onboardingService.getSession(sessionId);

  if (!session) {
    return res.status(404).json({ success: false, error: "Session not found" });
  }

  // Apply same logic for session status endpoint
  let currentStep = session.currentStep;
  let stepData = session.stepData;
  
  if (currentStep === "analysis" && !stepData?.scoringResult) {
    const completedSteps = session.completedSteps || [];
    if (completedSteps.includes("founder") && completedSteps.includes("venture")) {
      currentStep = "team";
    } else if (completedSteps.includes("founder")) {
      currentStep = "venture";
    } else {
      currentStep = "founder";
    }
    
    appLogger.business("Reset session step from analysis to:", currentStep);
  }

  res.json(createSuccessResponse({
    sessionId,
    currentStep,
    stepData,
    completedSteps: session.completedSteps,
    isComplete: session.isComplete,
  }));
}));

// Founder onboarding step
router.post("/founder", asyncHandler(async (req, res) => {
  const { sessionId: requestSessionId, ...founderData } = req.body;
  const sessionId = requestSessionId || getSessionId(req);
  
  appLogger.business("Legacy founder onboarding for session:", sessionId);
  
  const validation = safeValidate(founderOnboardingSchema, founderData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.completeFounderStep(sessionId, validation.data);

  res.json(createSuccessResponse({
    sessionId: result.sessionId,
    founderId: result.founderId,
    nextStep: "venture",
  }));
}));

// Venture onboarding step
router.post("/venture", asyncHandler(async (req, res) => {
  const { sessionId: requestSessionId, ...ventureData } = req.body;
  const sessionId = requestSessionId || getSessionId(req);
  
  appLogger.business("Legacy venture onboarding for session:", sessionId);
  
  const validation = safeValidate(ventureOnboardingSchema, ventureData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.completeVentureStep(sessionId, validation.data);

  res.json(createSuccessResponse({
    sessionId: result.sessionId,
    ventureId: result.ventureId,
    nextStep: "team",
  }));
}));

// Team member endpoints
router.post("/team/add", asyncHandler(async (req, res) => {
  const { sessionId: bodySessionId, ...memberData } = req.body;
  let sessionId = bodySessionId;
  
  if (!sessionId) {
    try {
      sessionId = getSessionId(req);
    } catch (error) {
      throw new Error("Session ID required in request body");
    }
  }
  
  if (!sessionId || sessionId === 'undefined') {
    throw new Error("Valid session ID required");
  }
  
  const validation = safeValidate(teamMemberSchema, memberData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.addTeamMember(sessionId, validation.data);

  res.json(createSuccessResponse({
    teamMember: result,
    nextStep: "team",
  }));
}));

router.get("/team/:sessionId", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessionId || sessionId === 'undefined') {
    return res.status(400).json({ success: false, error: "Invalid session ID" });
  }
  
  const teamMembers = await onboardingService.getTeamMembers(sessionId);

  res.json(createSuccessResponse({
    teamMembers,
  }));
}));

// Document upload step
router.post("/upload", upload.single("pitchDeck"), validateRequest(fileUploadSchema), asyncHandler(async (req, res) => {
  const { sessionId: requestSessionId } = req.body;
  const sessionId = requestSessionId || getSessionId(req);
  
  if (!req.file) {
    throw new Error("No file uploaded");
  }

  appLogger.business("Legacy document upload for session:", sessionId);

  try {
    const result = await onboardingService.uploadDocument(sessionId, req.file);

    res.json(createSuccessResponse({
      upload: result.upload,
      nextStep: "processing",
    }));
  } catch (error) {
    await cleanupUploadedFile(req.file.path);
    throw error;
  }
}));

// Complete onboarding
router.post("/complete", asyncHandler(async (req, res) => {
  const { sessionId: requestSessionId } = req.body;
  const sessionId = requestSessionId || getSessionId(req);
  
  appLogger.business("Legacy onboarding completion for session:", sessionId);

  const result = await onboardingService.completeOnboarding(sessionId);

  res.json(createSuccessResponse({
    sessionId: result.sessionId,
    isComplete: true,
    summary: result.summary,
  }));
}));

export default router;