import { Router } from "express";
import { onboardingService } from "../services/onboarding-service";
import { asyncHandler, createSuccessResponse, createErrorResponse } from "../utils/error-handler";
import { validateRequestBody, safeValidate } from "../utils/validation";
import { requireSession, requireFields } from "../middleware/auth";
import { getSessionId } from "../utils/session-manager";
import { founderOnboardingSchema, ventureOnboardingSchema, teamMemberSchema } from "../onboarding";
import multer from "multer";
import path from "path";
import fs from "fs";
import { appLogger } from "../utils/logger";
// Removed clean encryption middleware

const router = Router();

// Encryption middleware removed

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
      // Generate incremented filename to prevent overwrites
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uploadDir = path.join(process.cwd(), "uploads");
      
      // Find existing files with same base name
      let counter = 0;
      let filename = file.originalname;
      
      console.log(`[UPLOAD] Checking file: ${filename} in ${uploadDir}`);
      
      while (fs.existsSync(path.join(uploadDir, filename))) {
        counter++;
        filename = `${baseName}-${counter}${ext}`;
        console.log(`[UPLOAD] File exists, trying: ${filename}`);
      }
      
      console.log(`[UPLOAD] Final filename: ${filename}`);
      cb(null, filename);
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

  let result;
  try {
    result = await onboardingService.completeFounderStep(sessionId, validation.data);
  } catch (error: any) {
    // Handle email duplicate error as validation error, not server error
    if (error.message === "Email already taken") {
      return res.status(400).json(createErrorResponse(400, "Email already taken"));
    }
    // Re-throw other errors to be handled by asyncHandler
    throw error;
  }

  res.json(createSuccessResponse({
    sessionId: result.sessionId,
    founderId: result.founderId,
    nextStep: "venture",
  }));
}));

// Venture onboarding step
router.post("/venture", asyncHandler(async (req, res) => {
  // Use sessionId from request body if provided, otherwise get from middleware
  const { sessionId: requestSessionId, ...ventureData } = req.body;
  const sessionId = requestSessionId || getSessionId(req);
  appLogger.business(`Venture API received sessionId: ${sessionId} (from request: ${requestSessionId})`);
  appLogger.business(`Venture data received:`, JSON.stringify(ventureData, null, 2));
  
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
  
  appLogger.business('Upload request received:', { 
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
    return res.status(400).json({
      success: false,
      message: "Invalid session ID",
      statusCode: 400
    });
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
  appLogger.business('Submit for scoring request:', { sessionId });
  
  try {
    const result = await onboardingService.submitForScoring(sessionId);
    appLogger.business('Submit for scoring result:', result);

    const response = createSuccessResponse({
      session: {
        sessionId,
        stepData: {
          processing: result.scoringResult
        }
      },
      ...result
    });
    
    appLogger.business('Sending JSON response:', JSON.stringify(response, null, 2));
    
    // Ensure proper JSON content type
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (error: any) {
    appLogger.business('Submit for scoring error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Unknown error',
        status: 500
      },
      sessionId
    });
  }
}));

// Manual email trigger
router.post("/send-email-manual", asyncHandler(async (req, res) => {
  const { sessionId, certificateUrl, reportUrl } = req.body;
  
  if (!sessionId || !certificateUrl || !reportUrl) {
    throw new Error('sessionId, certificateUrl, and reportUrl are required');
  }
  
  // Get session data
  const session = await onboardingService.getSession(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Call the email notification method
  const stepData = session.stepData || {};
  await onboardingService.sendEmailNotification(sessionId, stepData, certificateUrl, reportUrl);
  
  res.json(createSuccessResponse({
    emailSent: true
  }, 'Email sent successfully'));
}));

// Retry analysis for a completed session
router.post("/retry-analysis", asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  const session = await onboardingService.getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  if (!session.isComplete) {
    throw new Error("Session is not complete yet");
  }

  appLogger.business(`🔄 Retrying analysis for session: ${sessionId}`);
  
  // Get the uploaded file data
  const uploadData = (session.stepData as any)?.upload;
  if (!uploadData) {
    throw new Error("No upload data found in session");
  }

  // Retry the scoring process
  const result = await onboardingService.retryScoring(sessionId, uploadData);
  
  res.json(createSuccessResponse({
    sessionId,
    scoringResult: result,
    message: "Analysis retried successfully"
  }));
}));

export default router;