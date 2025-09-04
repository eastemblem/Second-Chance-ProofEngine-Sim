import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { asyncHandler, createSuccessResponse } from "../../utils/error-handler";
import { onboardingService } from "../../services/onboarding-service";
import { ActivityService } from "../../services/activity-service";
import { eastEmblemAPI } from "../../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../../utils/session-manager";
import { cleanupUploadedFile } from "../../utils/file-cleanup";
import { validateRequest, fileUploadSchema } from "../../middleware/validation";
import { EmailValidationService } from "../../services/email-validation-service";

const router = express.Router();

// Configure multer for onboarding file uploads
const onboardingUpload = multer({
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

// Founder data submission endpoint - extracted from main routes.ts
router.post("/founder", asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const founderData = req.body;

  console.log(`👤 ONBOARDING: Processing founder data for session ${sessionId}`);

  try {
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'startupName', 'stage'];
    const missingFields = requiredFields.filter(field => !founderData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields
      });
    }

    // Validate email (block personal and temporary emails)
    const emailValidation = EmailValidationService.validateEmail(founderData.email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        error: emailValidation.error || 'Invalid email address',
        errorType: emailValidation.errorType,
        suggestion: EmailValidationService.getEmailSuggestion(emailValidation.errorType || 'invalid_format')
      });
    }

    // Process founder data through onboarding service
    const result = await onboardingService.completeFounderStep(sessionId, founderData);

    // Update session with founder data
    await updateSessionData(sessionId, {
      founderData: {
        ...founderData,
        founderId: result.founderId
      }
    });

    // Log founder creation activity
    const context = ActivityService.getContextFromRequest(req);
    await ActivityService.logAccountActivity(
      { ...context, founderId: result.founderId },
      'signup',
      'Founder profile created',
      `Founder ${founderData.fullName} created profile during onboarding`,
      {
        founderId: result.founderId,
        email: founderData.email,
        sessionId
      }
    );

    console.log(`✅ ONBOARDING: Founder data processed successfully`, {
      founderId: result.founderId
    });

    res.json(createSuccessResponse({
      founderId: result.founderId,
      message: "Founder data saved successfully"
    }, "Founder information processed"));

  } catch (error) {
    console.error("❌ ONBOARDING: Founder data processing failed:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Handle email validation errors
      if ((error as any).errorType) {
        return res.status(400).json({
          error: error.message,
          errorType: (error as any).errorType,
          suggestion: (error as any).suggestion
        });
      }
      
      // Handle email already taken error
      if (error.message === "Email already taken") {
        return res.status(409).json({
          error: "Email already taken",
          message: "A user with this email address already exists"
        });
      }
    }
    
    // Handle all other errors as 500
    res.status(500).json({
      error: "Failed to process founder data", 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Team member data submission endpoint - extracted from main routes.ts
router.post("/team", asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const teamData = req.body;

  console.log(`👥 ONBOARDING: Processing team data for session ${sessionId}`);

  try {
    const sessionData = await getSessionData(sessionId);
    
    if (!sessionData?.founderData?.ventureId) {
      return res.status(400).json({
        error: "Founder data must be submitted first"
      });
    }

    // Process team members through onboarding service
    const result = await onboardingService.completeTeamStep(sessionId);

    console.log(`✅ ONBOARDING: Team data processed successfully`, {
      ventureId: sessionData.founderData.ventureId,
      teamMembersCount: teamData.teamMembers?.length || 0
    });

    res.json(createSuccessResponse({
      ventureId: sessionData.founderData.ventureId,
      message: "Team data saved successfully"
    }, "Team information processed"));

  } catch (error) {
    console.error("❌ ONBOARDING: Team data processing failed:", error);
    res.status(500).json({
      error: "Failed to process team data",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Pitch deck upload endpoint - extracted from main routes.ts
router.post("/upload-pitch-deck", 
  onboardingUpload.single("pitchDeck"),
  asyncHandler(async (req, res) => {
    if (!eastEmblemAPI.isConfigured()) {
      return res.status(500).json({ error: "EastEmblem API not configured" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No pitch deck uploaded" });
    }

    const sessionId = getSessionId(req);

    console.log(`📄 ONBOARDING: Processing pitch deck upload for session ${sessionId}`);

    try {
      const sessionData = await getSessionData(sessionId);
      
      if (!sessionData?.founderData?.ventureId) {
        throw new Error("Venture not found in session");
      }

      // Process pitch deck through onboarding service
      const result = await onboardingService.handleDocumentUpload(
        sessionId,
        req.file
      );

      // Update session with upload data
      await updateSessionData(sessionId, {
        uploadedFile: {
          filepath: req.file.path,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        },
        pitchDeckProcessed: true
      });

      console.log(`✅ ONBOARDING: Pitch deck processed successfully`, {
        fileName: req.file.originalname,
        ventureId: sessionData.founderData.ventureId
      });

      // Cleanup uploaded file
      await cleanupUploadedFile(req.file.path, req.file.originalname);

      res.json(createSuccessResponse({
        fileName: req.file.originalname,
        fileSize: req.file.size,
        ventureId: sessionData.founderData.ventureId,
        uploadProcessed: true
      }, "Pitch deck uploaded successfully"));

    } catch (error) {
      console.error("❌ ONBOARDING: Pitch deck upload failed:", error);
      
      // Cleanup on error
      if (req.file?.path) {
        await cleanupUploadedFile(req.file.path, req.file.originalname || "unknown");
      }

      res.status(500).json({
        error: "Pitch deck upload failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

// Scoring submission endpoint - extracted from main routes.ts
router.post("/submit-for-scoring", asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);

  console.log(`🎯 ONBOARDING: Submitting for scoring - session ${sessionId}`);

  try {
    const sessionData = await getSessionData(sessionId);
    
    if (!sessionData?.founderData?.ventureId) {
      return res.status(400).json({
        error: "Complete onboarding data not found in session"
      });
    }

    if (!sessionData?.pitchDeckProcessed) {
      return res.status(400).json({
        error: "Pitch deck must be uploaded first"
      });
    }

    // Process scoring through onboarding service
    const result = await onboardingService.submitForScoring(sessionId);

    console.log(`✅ ONBOARDING: Scoring completed successfully`, {
      ventureId: sessionData.founderData.ventureId,
      scoringResult: result
    });

    res.json(createSuccessResponse({
      scoringResult: result,
      ventureId: sessionData.founderData.ventureId
    }, "Scoring completed successfully"));

  } catch (error) {
    console.error("❌ ONBOARDING: Scoring failed:", error);
    res.status(500).json({
      error: "Scoring process failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Create startup vault endpoint - extracted from main routes.ts
router.post("/create-startup-vault", asyncHandler(async (req, res) => {
  if (!eastEmblemAPI.isConfigured()) {
    return res.status(500).json({ error: "EastEmblem API not configured" });
  }

  const { ventureId, ventureName } = req.body;
  const sessionId = getSessionId(req);

  if (!ventureId || !ventureName) {
    return res.status(400).json({
      error: "Venture ID and name are required"
    });
  }

  console.log(`🗃️ ONBOARDING: Creating startup vault for ${ventureName} (${ventureId})`);

  try {
    // Create folder structure through EastEmblem API
    const { eastEmblemAPI } = await import('../../eastemblem-api');
    const result = await eastEmblemAPI.createFolderStructure(ventureName, ventureId);

    // Update session with folder structure
    await updateSessionData(sessionId, {
      folderStructure: result,
      vaultCreated: true
    });

    console.log(`✅ ONBOARDING: Startup vault created successfully`, {
      ventureId,
      rootFolderId: result.id
    });

    res.json(createSuccessResponse({
      folderStructure: result,
      ventureId,
      ventureName,
      vaultCreated: true
    }, "Startup vault created successfully"));

  } catch (error) {
    console.error("❌ ONBOARDING: Vault creation failed:", error);
    res.status(500).json({
      error: "Failed to create startup vault",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;