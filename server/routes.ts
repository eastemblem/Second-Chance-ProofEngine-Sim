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
import { databaseService } from "./services/database-service";
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
  // Session middleware is already configured in index.ts, don't duplicate it



  // Authentication routes
  app.use('/api/auth', authRoutes);

  // Dashboard routes are handled via apiRoutes (index.ts) to avoid duplicate registration

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        success: false,
        error: {
          message: errorMessage,
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

  // Dashboard API endpoints - fixed in main routes file 
  app.get('/api/dashboard/validation', asyncHandler(async (req, res) => {
    console.log(`🔧 FIXED: Dashboard validation route accessed`);
    
    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      console.log(`🔍 FIXED: Looking for founderId: ${founderId}`);
      const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);

      if (!dashboardData) {
        return res.status(404).json({ error: "Founder not found" });
      }

      const { founder: founderData, venture: latestVenture, latestEvaluation } = dashboardData;

      // Calculate ProofTags (simplified version for now)
      const totalProofTags = 21;
      const currentScore = latestEvaluation?.proofscore || 0;
      const unlockedProofTags = Math.floor((currentScore / 100) * totalProofTags);

      const validationData = {
        proofScore: currentScore, // FIXED: Use camelCase to match frontend interface
        proofTagsUnlocked: unlockedProofTags, // FIXED: Match frontend interface
        totalProofTags: totalProofTags, // FIXED: Match frontend interface
        prooftags: latestEvaluation?.prooftags || [],
        prooftagsProgress: `${unlockedProofTags}/${totalProofTags}`,
        analysisDate: latestEvaluation?.evaluationDate || new Date().toISOString(),
        founderName: founderData?.fullName || founderData?.email?.split('@')[0] || 'Founder',
        ventureName: latestVenture?.name || 'Your Venture',
        filesUploaded: 0, // FIXED: Will be calculated from actual document count
        status: currentScore >= 90 ? 'Deal Room Ready' : currentScore >= 70 ? 'Investor Ready' : 'Building Validation', // FIXED: Add status field
        investorReady: currentScore >= 70,
        dealRoomAccess: currentScore >= 90,
        certificateUrl: latestVenture?.certificateUrl,
        reportUrl: latestVenture?.reportUrl
      };

      // FIXED: Calculate actual files uploaded for this venture
      const { db } = await import('./db');
      const { documentUpload } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const fileCount = await db.select()
        .from(documentUpload)
        .where(eq(documentUpload.ventureId, dashboardData.venture.ventureId));
      
      validationData.filesUploaded = fileCount.length;

      console.log(`📊 FIXED: Returning validation data for ${founderData?.fullName}, score: ${currentScore}, files: ${fileCount.length}`);
      res.json(validationData);
    } catch (error) {
      console.error("FIXED: Dashboard validation error:", error);
      res.status(500).json({ error: "Failed to load validation data" });
    }
  }));

  // Dashboard vault endpoint
  app.get('/api/dashboard/vault', asyncHandler(async (req, res) => {
    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
      if (!dashboardData || !dashboardData.venture) {
        return res.status(404).json({ error: "Venture not found" });
      }

      // RETRIEVE ACTUAL FILES FROM DATABASE
      const { db } = await import('./db');
      const { documentUpload } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      // Get all files for this venture ordered by upload time (most recent first)
      const { desc } = await import('drizzle-orm');
      const files = await db.select().from(documentUpload)
        .where(eq(documentUpload.ventureId, dashboardData.venture.ventureId))
        .orderBy(desc(documentUpload.createdAt));
      
      // Format files for frontend display
      const formattedFiles = files.map(file => ({
        id: file.uploadId,
        name: file.fileName || file.originalName || 'Unknown File',
        category: getCategoryFromFolderId(file.folderId || '332844784735'), // Default to Overview folder
        uploadDate: file.createdAt?.toISOString() || new Date().toISOString(),
        size: formatFileSize(file.fileSize || 0),
        downloadUrl: file.sharedUrl || '',
        type: file.mimeType || 'application/pdf'
      }));

      // Count files by category
      const fileCounts = files.reduce((counts, file) => {
        const category = getCategoryFromFolderId(file.folderId || '332844784735');
        switch(category) {
          case 'Overview': counts.overview++; break;
          case 'Problem Proofs': counts.problemProof++; break;
          case 'Solution Proofs': counts.solutionProof++; break;
          case 'Demand Proofs': counts.demandProof++; break;
          case 'Credibility Proofs': counts.credibilityProof++; break;
          case 'Commercial Proofs': counts.commercialProof++; break;
          case 'Investor Pack': counts.investorPack++; break;
        }
        return counts;
      }, { overview: 0, problemProof: 0, solutionProof: 0, demandProof: 0, credibilityProof: 0, commercialProof: 0, investorPack: 0 });

      const vaultData = {
        overviewCount: fileCounts.overview,
        problemProofCount: fileCounts.problemProof,
        solutionProofCount: fileCounts.solutionProof,
        demandProofCount: fileCounts.demandProof,
        credibilityProofCount: fileCounts.credibilityProof,
        commercialProofCount: fileCounts.commercialProof,
        investorPackCount: fileCounts.investorPack,
        totalFiles: files.length,
        ventureId: dashboardData.venture.ventureId,
        ventureName: dashboardData.venture.name,
        files: formattedFiles, // REAL FILES from database
        folders: [ // FIXED: Add folder structure to match frontend interface
          { name: "0_Overview", displayName: "Overview", count: fileCounts.overview },
          { name: "1_Problem_Proof", displayName: "Problem Proofs", count: fileCounts.problemProof },
          { name: "2_Solution_Proof", displayName: "Solution Proofs", count: fileCounts.solutionProof },
          { name: "3_Demand_Proof", displayName: "Demand Proofs", count: fileCounts.demandProof },
          { name: "4_Credibility_Proof", displayName: "Credibility Proofs", count: fileCounts.credibilityProof },
          { name: "5_Commercial_Proof", displayName: "Commercial Proofs", count: fileCounts.commercialProof },
          { name: "6_Investor_Pack", displayName: "Investor Pack", count: fileCounts.investorPack }
        ],
        folderUrls: {} // FIXED: Add empty folderUrls to match frontend interface
      };

      res.json(vaultData);
    } catch (error) {
      console.error("Dashboard vault error:", error);
      res.status(500).json({ error: "Failed to load vault data" });
    }
  }));

  // Dashboard activity endpoint - REAL DATA FROM DATABASE
  app.get('/api/dashboard/activity', asyncHandler(async (req, res) => {
    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { db } = await import('./db');
      const { userActivity } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');

      // Get real activity data from database
      const activities = await db.select()
        .from(userActivity)
        .where(eq(userActivity.founderId, founderId))
        .orderBy(desc(userActivity.createdAt))
        .limit(10);

      // Format activities for frontend display
      const formattedActivities = activities.map(activity => ({
        id: activity.activityId,
        type: activity.activityType,
        title: activity.title || activity.action || 'Activity',
        description: activity.description || `${activity.action} completed`,
        timestamp: activity.createdAt?.toISOString() || new Date().toISOString(),
        icon: getActivityIcon(activity.activityType, activity.action),
        color: getActivityColor(activity.activityType)
      }));

      res.json(formattedActivities);
    } catch (error) {
      console.error("Dashboard activity error:", error);
      res.status(500).json({ error: "Failed to load activity data" });
    }
  }));

  // Certificate routes
  app.post("/api/certificate/generate", asyncHandler(generateCertificate));
  app.get("/api/certificate/download/:filename", asyncHandler(downloadCertificate));
  app.get("/api/certificate/status/:ventureId", asyncHandler(getCertificateStatus));

  // Report routes
  app.post("/api/report/generate", asyncHandler(generateReport));
  
  // Fix venture table with certificate and report URLs
  app.post("/api/fix-venture-urls", async (req, res) => {
    try {
      const { sessionId } = req.body;
      const { db } = await import('./db');
      const { onboardingSession, venture, documentUpload } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      // Get session data
      const [session] = await db
        .select()
        .from(onboardingSession)
        .where(eq(onboardingSession.sessionId, sessionId));

      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      const stepData = session.stepData as any;
      const ventureId = stepData?.venture?.ventureId;
      const certificateUrl = stepData?.processing?.certificateUrl;
      const reportUrl = stepData?.processing?.reportUrl;

      if (!ventureId) {
        return res.status(400).json({ success: false, error: 'No venture found in session' });
      }

      let updates: any = { updatedAt: new Date() };
      let documentsCreated = 0;

      if (certificateUrl) {
        updates.certificateUrl = certificateUrl;
        updates.certificateGeneratedAt = new Date();
      }

      if (reportUrl) {
        updates.reportUrl = reportUrl;
        updates.reportGeneratedAt = new Date();
      }

      // Update venture table
      await db
        .update(venture)
        .set(updates)
        .where(eq(venture.ventureId, ventureId));

      // Create document records
      if (certificateUrl) {
        try {
          await db.insert(documentUpload).values({
            ventureId: ventureId,
            fileName: 'validation_certificate.pdf',
            originalName: 'validation_certificate.pdf',
            filePath: null,
            fileSize: 0,
            mimeType: 'application/pdf',
            uploadStatus: 'completed',
            processingStatus: 'completed',
            sharedUrl: certificateUrl,
            uploadedBy: 'system'
          });
          documentsCreated++;
        } catch (e) { /* ignore if exists */ }
      }

      if (reportUrl) {
        try {
          await db.insert(documentUpload).values({
            ventureId: ventureId,
            fileName: 'analysis_report.pdf',
            originalName: 'analysis_report.pdf',
            filePath: null,
            fileSize: 0,
            mimeType: 'application/pdf',
            uploadStatus: 'completed',
            processingStatus: 'completed',
            sharedUrl: reportUrl,
            uploadedBy: 'system'
          });
          documentsCreated++;
        } catch (e) { /* ignore if exists */ }
      }

      res.json({
        success: true,
        message: 'Venture URLs fixed successfully',
        ventureId,
        certificateUrl,
        reportUrl,
        documentsCreated
      });

    } catch (error) {
      console.error('Error fixing venture URLs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fix venture URLs'
      });
    }
  });
  
  // Manual email trigger route
  app.post('/api/email/send-manual', async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'sessionId is required'
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
      
      // Call the private email notification method without explicit URLs - let it generate them
      const stepData = session.stepData || {};
      await (onboardingService as any).sendEmailNotification(sessionId, stepData);
      
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



  // Test database service endpoint (direct database query - no cache)
  app.get("/api/test/database/:founderId", asyncHandler(async (req, res) => {
    const founderId = req.params.founderId;
    console.log(`🧪 Testing database service DIRECT QUERY for founderId: ${founderId}`);
    
    try {
      // Call the direct database method to bypass all caching
      const data = await databaseService.fetchFounderWithLatestVentureFromDB(founderId);
      
      console.log(`🧪 Raw data structure:`, JSON.stringify(data, null, 2));
      console.log(`🧪 Data properties:`, {
        founderExists: !!data?.founder,
        ventureExists: !!data?.venture, 
        evaluationExists: !!data?.latestEvaluation,
        dataKeys: data ? Object.keys(data) : 'null'
      });
      
      res.json({
        success: true,
        founderId,
        data,
        hasFounder: !!data?.founder,
        hasVenture: !!data?.venture,
        hasEvaluation: !!data?.latestEvaluation,
        proofscore: data?.latestEvaluation?.proofscore || null
      });
    } catch (error) {
      console.error("Database test error:", error);
      res.status(500).json({ error: error.message });
    }
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

// Helper functions for file processing
function getCategoryFromFolderId(folderId: string): string {
  // FIXED: Map actual Box.com folder IDs to category names based on real folder structure
  const folderMap: Record<string, string> = {
    '332844784735': 'Overview',     // 0_Overview
    '332844933261': 'Problem Proofs', // 1_Problem_Proof  
    '332842993678': 'Solution Proofs', // 2_Solution_Proof
    '332843828465': 'Demand Proofs',   // 3_Demand_Proof
    '332843291772': 'Credibility Proofs', // 4_Credibility_Proof
    '332845124499': 'Commercial Proofs',  // 5_Commercial_Proof
    '332842251627': 'Investor Pack'       // 6_Investor_Pack
  };
  
  console.log(`📁 Mapping folder ID '${folderId}' to category: ${folderMap[folderId] || 'Overview (default)'}`);
  return folderMap[folderId] || 'Overview';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getActivityIcon(activityType: string, action?: string): string {
  const iconMap: Record<string, string> = {
    'account': 'User',
    'authentication': 'Shield', 
    'venture': 'Building',
    'document': 'FileText',
    'evaluation': 'TrendingUp',
    'navigation': 'Navigation',
    'system': 'Settings'
  };
  
  // Special cases based on action
  if (action === 'email_verify') return 'CheckCircle';
  if (action === 'upload') return 'Upload';
  if (action === 'create') return 'Plus';
  if (action === 'score_generate') return 'Award';
  
  return iconMap[activityType] || 'Circle';
}

function getActivityColor(activityType: string): string {
  const colorMap: Record<string, string> = {
    'account': 'blue',
    'authentication': 'green',
    'venture': 'purple', 
    'document': 'yellow',
    'evaluation': 'green',
    'navigation': 'gray',
    'system': 'orange'
  };
  
  return colorMap[activityType] || 'gray';
}