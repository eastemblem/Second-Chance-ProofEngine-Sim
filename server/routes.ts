import type { Express } from "express";
import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { eastEmblemAPI, type FolderStructureResponse, type FileUploadResponse } from "./eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "./utils/session-manager";
import { asyncHandler, createSuccessResponse } from "./utils/error-handler";
import { cleanupUploadedFile } from "./utils/file-cleanup";
import { onboardingService } from "./services/onboarding-service";
import apiRoutes from "./routes/index";
import authRoutes from "./routes/auth";
import { getLeaderboard, createLeaderboardEntry } from "./routes/leaderboard";
import { generateCertificate, downloadCertificate, getCertificateStatus } from "./routes/certificate";
import { generateReport } from "./routes/report";
import multer from "multer";
import path from "path";
import fs from "fs";

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

// Legacy session interface for compatibility
interface SessionData {
  folderStructure?: FolderStructureResponse;
  uploadedFiles?: FileUploadResponse[];
  pitchDeckScore?: any;
  startupName?: string;
  uploadedFile?: {
    filepath: string;
    originalname: string;
    mimetype: string;
    size: number;
  };
  founderData?: {
    fullName?: string;
    email?: string;
    startupName?: string;
    stage?: string;
    acceleratorApplications?: number;
    founderId?: string;
    ventureId?: string;
    positionRole?: string;
    industry?: string;
    geography?: string;
    businessModel?: string;
    [key: string]: any;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication routes
  app.use('/api/auth', authRoutes);

  // Direct submit for scoring endpoint (must be before general API routes)
  app.post("/api/submit-for-scoring", asyncHandler(async (req, res) => {
    console.log('Direct submit-for-scoring endpoint called');
    const { sessionId } = req.body;
    
    if (!sessionId) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        success: false,
        error: {
          message: "sessionId is required",
          status: 400
        }
      });
    }

    try {
      const result = await onboardingService.submitForScoring(sessionId);
      
      const response = {
        success: true,
        data: {
          session: {
            sessionId,
            stepData: {
              processing: result.scoringResult
            }
          },
          ...result
        }
      };
      
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

  // Mount modular API routes
  app.use("/api", apiRoutes);

  // Leaderboard routes
  app.get("/api/leaderboard", asyncHandler(getLeaderboard));
  app.post("/api/leaderboard", asyncHandler(createLeaderboardEntry));

  // Certificate routes
  app.post("/api/certificate/generate", asyncHandler(generateCertificate));
  app.get("/api/certificate/download/:filename", asyncHandler(downloadCertificate));
  app.get("/api/certificate/status/:ventureId", asyncHandler(getCertificateStatus));

  // Report routes
  app.post("/api/report/generate", asyncHandler(generateReport));
  
  // Manual email trigger route
  app.post('/api/email/send-manual', async (req, res) => {
    try {
      const { sessionId, certificateUrl, reportUrl } = req.body;
      
      if (!sessionId || !certificateUrl || !reportUrl) {
        return res.status(400).json({
          success: false,
          error: 'sessionId, certificateUrl, and reportUrl are required'
        });
      }
      
      // Get session data
      const session = await onboardingService.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }
      
      // Call the private email notification method via reflection
      const stepData = session.stepData || {};
      await (onboardingService as any).sendEmailNotification(sessionId, stepData, certificateUrl, reportUrl);
      
      res.json({
        success: true,
        message: 'Email sent successfully'
      });
      
    } catch (error) {
      console.error('Manual email send error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Legacy onboarding data storage (kept for compatibility)
  app.post("/api/onboarding/store", asyncHandler(async (req, res) => {
    const founderData = req.body;
    console.log("Storing onboarding data in session:", founderData);

    updateSessionData(req, {
      founderData,
      startupName: founderData.startupName,
    });

    res.json(createSuccessResponse({
      sessionId: getSessionId(req),
    }, "Onboarding data stored successfully"));
  }));

  // Create startup vault structure
  app.post("/api/vault/create-startup-vault", asyncHandler(async (req, res) => {
    const { startupName } = req.body;

    if (!startupName) {
      throw new Error("startupName is required");
    }

    if (!eastEmblemAPI.isConfigured()) {
      throw new Error("EastEmblem API not configured");
    }

    console.log(`Creating startup vault for: ${startupName}`);

    const folderStructure = await eastEmblemAPI.createFolderStructure(startupName, getSessionId(req));

    updateSessionData(req, {
      folderStructure,
      startupName,
      uploadedFiles: [],
    });

    res.json(createSuccessResponse({
      folderStructure,
      sessionId: getSessionId(req),
    }, "Startup vault created successfully"));
  }));

  // Get session data
  app.get("/api/vault/session", asyncHandler(async (req, res) => {
    const sessionData = getSessionData(req);

    console.log("Retrieved session data:", {
      sessionId: getSessionId(req),
      hasStructure: !!sessionData.folderStructure,
      filesCount: sessionData.uploadedFiles?.length || 0,
      hasScore: !!sessionData.pitchDeckScore,
    });

    res.json(createSuccessResponse({
      sessionId: getSessionId(req),
      data: sessionData,
    }));
  }));

  // Upload file only (store for later processing)
  app.post("/api/vault/upload-only", upload.single("file"), asyncHandler(async (req, res) => {
    const file = req.file;

    if (!file) {
      throw new Error("File is required for upload");
    }

    console.log(`Storing file for later processing: ${file.originalname}`);

    updateSessionData(req, {
      uploadedFile: {
        filepath: file.path,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });

    res.json(createSuccessResponse({
      file: {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
      },
    }, "File uploaded and ready for processing"));
  }));

  // Submit for scoring workflow  
  app.post("/api/vault/submit-for-scoring", asyncHandler(async (req, res) => {
    if (!eastEmblemAPI.isConfigured()) {
      throw new Error("EastEmblem API not configured");
    }

    const sessionData = getSessionData(req);
    const uploadedFile = sessionData.uploadedFile;
    const folderStructure = sessionData.folderStructure;

    if (!uploadedFile) {
      throw new Error("No file found - please upload a file first");
    }

    if (!folderStructure) {
      throw new Error("No folder structure found - please complete venture step first");
    }

    const sessionId = getSessionId(req);
    console.log(`Starting scoring workflow for: ${uploadedFile.originalname}`);

    const overviewFolderId = folderStructure.folders["0_Overview"];
    if (!overviewFolderId) {
      throw new Error("Overview folder not found");
    }

    console.log(`Uploading ${uploadedFile.originalname} to Overview folder: ${overviewFolderId}`);
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    
    // Upload file to Overview folder and score
    const uploadResult = await eastEmblemAPI.uploadFile(
      fileBuffer,
      uploadedFile.originalname,
      overviewFolderId,
      sessionId,
      true
    );
    console.log("Overview folder upload result:", uploadResult);

    const pitchDeckScore = await eastEmblemAPI.scorePitchDeck(
      fileBuffer,
      uploadedFile.originalname,
      sessionId
    );

    // Update session
    const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
    updateSessionData(req, { 
      uploadedFiles: updatedFiles,
      pitchDeckScore,
      uploadedFile: undefined
    });

    // Clean up file after successful analysis
    cleanupUploadedFile(uploadedFile.filepath, uploadedFile.originalname, "Analysis complete");

    res.json(createSuccessResponse({
      uploadResult,
      pitchDeckScore,
      proofScore: pitchDeckScore.output?.total_score || 82,
      sessionId
    }, "Scoring workflow completed successfully"));
  }));



  // Slack notification endpoint
  app.post("/api/notification/send", asyncHandler(async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
      throw new Error("Message is required");
    }

    if (!eastEmblemAPI.isConfigured()) {
      throw new Error("EastEmblem API not configured");
    }

    const sessionId = getSessionId(req);
    const result = await eastEmblemAPI.sendSlackNotification(message, sessionId);

    res.json(createSuccessResponse(result, "Notification sent successfully"));
  }));

  // Email routes
  app.use("/api/email", (await import("./routes/emailRoutes")).default);

  const httpServer = createServer(app);
  return httpServer;
}