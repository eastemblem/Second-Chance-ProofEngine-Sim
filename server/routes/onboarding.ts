import { Router } from "express";
import { onboardingService } from "../services/onboarding-service";
import { asyncHandler, createSuccessResponse } from "../utils/error-handler";
import { validateRequestBody, safeValidate } from "../utils/validation";
import { requireSession, requireFields } from "../middleware/auth";
import { getSessionId } from "../utils/session-manager";
import { founderOnboardingSchema, ventureOnboardingSchema, teamMemberSchema } from "../onboarding";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for file uploads
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
      cb(null, file.originalname);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
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

  res.json(createSuccessResponse({
    sessionId,
    currentStep: session?.currentStep || "founder",
    stepData: session?.stepData || {},
    completedSteps: session?.completedSteps || [],
    isComplete: session?.isComplete || false,
  }));
}));

// Get session status
router.get("/session/:sessionId", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await onboardingService.getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  res.json(createSuccessResponse({
    sessionId: session.sessionId,
    currentStep: session.currentStep,
    stepData: session.stepData,
    completedSteps: session.completedSteps,
    isComplete: session.isComplete,
  }));
}));

// Founder onboarding step
router.post("/founder", asyncHandler(async (req, res) => {
  // Use session from middleware, ignore any provided sessionId
  const sessionId = getSessionId(req);
  const { sessionId: _, ...founderData } = req.body; // Remove sessionId from body
  
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
  // Use session from middleware, ignore any provided sessionId
  const sessionId = getSessionId(req);
  const { sessionId: _, ...ventureData } = req.body; // Remove sessionId from body
  
  const validation = safeValidate(ventureOnboardingSchema, ventureData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.completeVentureStep(sessionId, validation.data);

  res.json(createSuccessResponse({
    venture: result.venture,
    folderStructure: result.folderStructure,
    nextStep: "team",
  }));
}));

// Document upload
router.post("/upload", upload.single("pitchDeck"), asyncHandler(async (req, res) => {
  // Get sessionId from body (sent by frontend) or fallback to session middleware
  const sessionId = req.body.sessionId || getSessionId(req);
  
  console.log('Upload request received:', { 
    sessionId, 
    hasFile: !!req.file, 
    fileName: req.file?.originalname,
    bodySessionId: req.body.sessionId 
  });

  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  if (!req.file) {
    throw new Error("No file uploaded");
  }

  const result = await onboardingService.handleDocumentUpload(sessionId, req.file);

  res.json(createSuccessResponse({
    upload: result.upload,
    nextStep: "processing",
  }));
}));

// Team member endpoints
router.post("/team/add", asyncHandler(async (req, res) => {
  // Try to get sessionId from body first, then from session middleware
  const { sessionId: bodySessionId, ...memberData } = req.body;
  let sessionId = bodySessionId;
  
  // Fallback to session middleware if no sessionId in body
  if (!sessionId) {
    try {
      sessionId = getSessionId(req);
    } catch (error) {
      // If session middleware fails, still require sessionId in body
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
  
  // Validate sessionId is not undefined or invalid
  if (!sessionId || sessionId === 'undefined') {
    return res.status(400).json(createErrorResponse("Invalid session ID", 400));
  }
  
  const teamMembers = await onboardingService.getTeamMembers(sessionId);

  res.json(createSuccessResponse({
    teamMembers,
  }));
}));

router.put("/team/update/:memberId", asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const { memberId: _, ...memberData } = req.body;
  
  const validation = safeValidate(teamMemberSchema, memberData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.updateTeamMember(memberId, validation.data);

  res.json(createSuccessResponse({
    teamMember: result,
  }));
}));

router.delete("/team/delete/:memberId", asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  
  await onboardingService.deleteTeamMember(memberId);

  res.json(createSuccessResponse({
    message: "Team member deleted successfully",
  }));
}));

router.post("/team/complete", asyncHandler(async (req, res) => {
  // Try to get sessionId from body first, then from session middleware
  const { sessionId: bodySessionId } = req.body;
  const sessionId = bodySessionId || getSessionId(req);
  
  if (!sessionId) {
    throw new Error("Session ID required");
  }
  
  const result = await onboardingService.completeTeamStep(sessionId);

  res.json(createSuccessResponse({
    nextStep: "upload",
  }));
}));

// Submit for scoring
router.post("/submit-for-scoring", requireFields(['sessionId']), asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  console.log('Submit for scoring request:', { sessionId });
  
  try {
    const result = await onboardingService.submitForScoring(sessionId);
    console.log('Submit for scoring result:', result);

    const response = createSuccessResponse({
      session: {
        sessionId,
        stepData: {
          processing: result.scoringResult
        }
      },
      ...result
    });
    
    console.log('Sending JSON response:', JSON.stringify(response, null, 2));
    
    // Ensure proper JSON content type
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (error) {
    console.error('Submit for scoring error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        status: 500
      },
      sessionId
    });
  }
}));

export default router;