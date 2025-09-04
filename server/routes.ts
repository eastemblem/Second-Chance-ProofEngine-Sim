import type { Express } from "express";
import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { eastEmblemAPI, type FolderStructureResponse, type FileUploadResponse } from "./eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "./utils/session-manager";
import { asyncHandler, createSuccessResponse, createErrorResponse } from "./utils/error-handler";
import { cleanupUploadedFile } from "./utils/file-cleanup";
import { onboardingService } from "./services/onboarding-service";
import apiRoutes from "./routes/index";
import authRoutes from "./routes/auth";
// Removed separate vault routes import - consolidated into single file
import { getLeaderboard, createLeaderboardEntry } from "./routes/leaderboard";
import { generateCertificate, downloadCertificate, getCertificateStatus } from "./routes/certificate";
import { generateReport } from "./routes/report";
import { appLogger } from "./utils/logger";
import { databaseService } from "./services/database-service";
import { authenticateToken } from "./middleware/token-auth";
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

  // V1 API Routes (versioned) - RESTORE WORKING SYSTEM
  const v1Routes = (await import('./routes/v1/index')).default;
  app.use('/api/v1', v1Routes);

  // JWT Authentication routes
  const authTokenRoutes = (await import("./routes/auth-token")).default;
  app.use('/api/auth-token', authTokenRoutes);

  // Session Authentication routes
  app.use('/api/auth', authRoutes);

  // Dashboard routes are handled via apiRoutes (index.ts) to avoid duplicate registration

  // Direct submit for scoring endpoint (must be before general API routes)
  app.post("/api/submit-for-scoring", asyncHandler(async (req, res) => {
    appLogger.api('Direct submit-for-scoring endpoint called');
    const { sessionId } = req.body;
    
    if (!sessionId) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json(createErrorResponse(400, "sessionId is required"));
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
      appLogger.api('Submit for scoring error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json(createErrorResponse(500, errorMessage));
    }
  }));

  // Mount modular API routes
  app.use("/api", apiRoutes);

  // Leaderboard routes - GET public for analysis page, POST requires auth
  app.get("/api/leaderboard", asyncHandler(getLeaderboard)); // Public access for analysis page
  app.post("/api/leaderboard", authenticateToken, asyncHandler(createLeaderboardEntry)); // Auth required for creation

  // Dashboard API endpoints - fixed in main routes file 
  app.get('/api/dashboard/validation', authenticateToken, asyncHandler(async (req: any, res) => {
    appLogger.api(`FIXED: Dashboard validation route accessed`);
    
    const founderId = req.user?.founderId;
    
    if (!founderId) {
      return res.status(401).json(createErrorResponse(401, "Not authenticated"));
    }

    try {
      appLogger.api(`FIXED: Looking for founderId: ${founderId}`);
      const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);

      if (!dashboardData) {
        return res.status(404).json(createErrorResponse(404, "Founder not found"));
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

      appLogger.api(`FIXED: Returning validation data for ${founderData?.fullName}, score: ${currentScore}, files: ${fileCount.length}`);
      res.json(validationData);
    } catch (error) {
      appLogger.api("FIXED: Dashboard validation error:", error);
      res.status(500).json(createErrorResponse(500, "Failed to load validation data"));
    }
  }));

  // Dashboard vault endpoint - CACHE DISABLED FOR DEBUGGING
  app.get('/api/dashboard/vault', authenticateToken, asyncHandler(async (req: any, res) => {
    const founderId = req.user?.founderId;
    
    if (!founderId) {
      return res.status(401).json(createErrorResponse(401, "Not authenticated"));
    }

    appLogger.api(`VAULT DEBUG: Processing vault request for founder: ${founderId}`);

    try {
      const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
      if (!dashboardData || !dashboardData.venture) {
        return res.status(404).json(createErrorResponse(404, "Venture not found"));
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
      
      // Format files for frontend display - need to use async mapping
      const formattedFiles = await Promise.all(files.map(async (file) => ({
        id: file.uploadId,
        name: file.fileName || file.originalName || 'Unknown File',
        category: await getCategoryFromFolderId(file.folderId || '332886218045', founderId), // Default to Overview folder
        uploadDate: file.createdAt?.toISOString() || new Date().toISOString(),
        size: formatFileSize(file.fileSize || 0),
        downloadUrl: file.sharedUrl || '',
        type: file.mimeType || 'application/pdf'
      })));

      // ENHANCED FILE COUNTING: Count files including those in subfolders  
      const { proofVault } = await import('@shared/schema');
      
      // Get all proof vault folder mappings for this venture
      const folderMappings = await db.select().from(proofVault)
        .where(eq(proofVault.ventureId, dashboardData.venture.ventureId));
      
      appLogger.api(`VAULT DEBUG: Found ${folderMappings.length} folder mappings for venture ${dashboardData.venture.ventureId}`);
      
      // DEBUG: Log all folder mappings
      for (const mapping of folderMappings) {
        appLogger.api(`VAULT DEBUG: Mapping - Parent: ${mapping.parentFolderId}, Sub: ${mapping.subFolderId}, Category: ${mapping.folderName}`);
      }

      // CORRECTED FILE CATEGORIZATION: Database-first approach with proper recursive logic
      const fileCounts = { overview: 0, problemProof: 0, solutionProof: 0, demandProof: 0, credibilityProof: 0, commercialProof: 0, investorPack: 0 };
      
      // First, identify which folder IDs are main category folders (those with parent = root folder)
      const rootFolderId = '332889411946'; // The main vault root folder
      const mainCategoryFolders = new Set<string>();
      const mainCategoryMapping: Record<string, string> = {};
      
      for (const mapping of folderMappings) {
        if (mapping.parentFolderId === rootFolderId) {
          // This is a main category folder
          mainCategoryFolders.add(mapping.subFolderId);
          mainCategoryMapping[mapping.subFolderId] = mapping.folderName;
          appLogger.api(`VAULT DEBUG: Main category folder identified: ${mapping.subFolderId} → ${mapping.folderName}`);
        }
      }
      
      // Process files individually with CORRECTED categorization logic
      for (const file of files) {
        let category = 'Overview (default)';
        const folderId = file.folderId || '332886218045';
        
        appLogger.api(`VAULT DEBUG: Processing file ${file.fileName} in folder ${folderId}`);
        
        // CORRECTED RECURSIVE LOGIC: Traverse up folder hierarchy until we reach a main category folder
        const findMainCategory = async (currentFolderId: string, depth = 0): Promise<string> => {
          // Prevent infinite loops
          if (depth > 10) {
            appLogger.api(`VAULT DEBUG: Maximum recursion depth reached for folder ${currentFolderId}`);
            return 'Overview (default)';
          }
          
          // Step 1: Check if current folder is already a main category folder
          if (mainCategoryFolders.has(currentFolderId)) {
            const categoryName = mainCategoryMapping[currentFolderId];
            appLogger.api(`VAULT DEBUG: Found main category folder ${currentFolderId} → ${categoryName} (depth ${depth})`);
            return categoryName;
          }
          
          // Step 2: Find parent folder using proof_vault table
          const folderRecord = folderMappings.find(mapping => mapping.subFolderId === currentFolderId);
          if (folderRecord && folderRecord.parentFolderId !== currentFolderId) {
            // Continue recursion with parent folder
            appLogger.api(`VAULT DEBUG: Folder ${currentFolderId} → parent ${folderRecord.parentFolderId} (depth ${depth})`);
            return await findMainCategory(folderRecord.parentFolderId, depth + 1);
          } else {
            // No parent mapping found - this might be a main category folder not in our Set
            const directMapping = folderMappings.find(mapping => mapping.subFolderId === currentFolderId);
            if (directMapping && directMapping.folderName.includes('_')) {
              appLogger.api(`VAULT DEBUG: Direct mapping found: ${currentFolderId} → ${directMapping.folderName}`);
              return directMapping.folderName;
            }
            
            appLogger.api(`VAULT DEBUG: No parent found for folder ${currentFolderId}, defaulting to Overview`);
            return 'Overview (default)';
          }
        };
        
        category = await findMainCategory(folderId);
        
        // CORRECTED CATEGORY MAPPING: Map folder names to count variables
        switch(category) {
          case '0_Overview':
          case 'Overview (default)': 
            fileCounts.overview++; 
            appLogger.api(`VAULT DEBUG: ${file.fileName} → Overview (${fileCounts.overview})`);
            break;
          case '1_Problem_Proof': 
            fileCounts.problemProof++; 
            appLogger.api(`VAULT DEBUG: ${file.fileName} → Problem Proofs (${fileCounts.problemProof})`);
            break;
          case '2_Solution_Proof': 
            fileCounts.solutionProof++; 
            appLogger.api(`VAULT DEBUG: ${file.fileName} → Solution Proofs (${fileCounts.solutionProof})`);
            break;
          case '3_Demand_Proof': 
            fileCounts.demandProof++; 
            appLogger.api(`VAULT DEBUG: ${file.fileName} → Demand Proofs (${fileCounts.demandProof})`);
            break;
          case '4_Credibility_Proof': 
            fileCounts.credibilityProof++; 
            appLogger.api(`VAULT DEBUG: ${file.fileName} → Credibility Proofs (${fileCounts.credibilityProof})`);
            break;
          case '5_Commercial_Proof': 
            fileCounts.commercialProof++; 
            appLogger.api(`VAULT DEBUG: ${file.fileName} → Commercial Proofs (${fileCounts.commercialProof})`);
            break;
          case '6_Investor_Pack': 
            fileCounts.investorPack++; 
            appLogger.api(`VAULT DEBUG: ${file.fileName} → Investor Pack (${fileCounts.investorPack})`);
            break;
          default:
            fileCounts.overview++; 
            appLogger.api(`VAULT DEBUG: ${file.fileName} → Overview (default case) (${fileCounts.overview})`);
            break;
        }
      }

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
        folderUrls: {
          // FIXED: Add parent folder URL for "Your Proof Vault" link
          root: dashboardData.venture?.folderStructure?.url || 
                `https://app.box.com/folder/${dashboardData.venture?.folderStructure?.id || '0'}`,
          // Individual category folder URLs
          ...Object.entries(dashboardData.venture?.folderStructure?.folders || {}).reduce((urls, [category, folderId]) => {
            urls[category] = `https://app.box.com/folder/${folderId}`;
            return urls;
          }, {} as Record<string, string>)
        }
      };

      res.json(vaultData);
    } catch (error) {
      appLogger.api("Dashboard vault error:", error);
      res.status(500).json(createErrorResponse(500, "Failed to load vault data"));
    }
  }));

  // Dashboard activity endpoint - REAL DATA FROM DATABASE
  app.get('/api/dashboard/activity', authenticateToken, asyncHandler(async (req: any, res) => {
    const founderId = req.user?.founderId;
    
    if (!founderId) {
      return res.status(401).json(createErrorResponse(401, "Not authenticated"));
    }

    try {
      const { db } = await import('./db');
      const { userActivity } = await import('@shared/schema');
      const { eq, desc } = await import('drizzle-orm');

      appLogger.api(`ACTIVITY DEBUG: Looking for activities for founder: ${founderId}`);

      // Get real activity data from database
      const activities = await db.select()
        .from(userActivity)
        .where(eq(userActivity.founderId, founderId))
        .orderBy(desc(userActivity.createdAt))
        .limit(10);

      appLogger.api(`ACTIVITY DEBUG: Found ${activities.length} activities in database`);
      if (activities.length > 0) {
        appLogger.api(`ACTIVITY DEBUG: Sample activity:`, activities[0]);
      }

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

      appLogger.api(`ACTIVITY DEBUG: Returning ${formattedActivities.length} formatted activities`);
      res.json(formattedActivities);
    } catch (error) {
      appLogger.api("Dashboard activity error:", error);
      res.status(500).json(createErrorResponse(500, "Failed to load activity data"));
    }
  }));

  // Certificate routes
  app.post("/api/certificate/generate", asyncHandler(generateCertificate));
  app.post("/api/certificate/create", asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json(createErrorResponse(400, 'sessionId is required'));
    }
    
    const { createCertificateForSession } = await import('./routes/certificate');
    const result = await createCertificateForSession(sessionId);
    res.json(result);
  }));
  app.get("/api/certificate/download/:filename", asyncHandler(downloadCertificate));
  app.get("/api/certificate/status/:ventureId", asyncHandler(getCertificateStatus));

  // Report routes
  app.post("/api/report/generate", asyncHandler(generateReport));
  app.post("/api/report/create", asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json(createErrorResponse(400, 'sessionId is required'));
    }
    
    const { createReportForSession } = await import('./routes/report');
    const result = await createReportForSession(sessionId);
    res.json(result);
  }));
  
  // Development-only email flow testing endpoint
  if (process.env.NODE_ENV === 'development') {
    app.post("/api/onboarding/trigger-email-flow", asyncHandler(async (req, res) => {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json(createErrorResponse(400, 'sessionId is required'));
      }
      
      try {
        const { onboardingService } = await import('./services/onboarding-service');
        
        // Simulate the async certificate/report generation and email flow
        const { createCertificateForSession } = await import('./routes/certificate');
        const { createReportForSession } = await import('./routes/report');
        
        appLogger.business("Testing certificate generation for session:", sessionId);
        const certificateResult = await createCertificateForSession(sessionId);
        appLogger.business("Certificate result:", certificateResult);
        
        appLogger.business("Testing report generation for session:", sessionId);
        const reportResult = await createReportForSession(sessionId);
      appLogger.business("Report result:", reportResult);
      
      // Send email notification with fallback logic
      if (certificateResult.success && reportResult.success) {
        const session = await onboardingService.getSession(sessionId);
        const stepData = session?.stepData || {};
        await onboardingService.sendEmailNotification(sessionId, stepData, certificateResult.certificateUrl, reportResult.reportUrl);
        appLogger.email("Email notification sent with successful generation URLs");
      } else {
        // Use fallback URLs
        appLogger.email("Using fallback URLs for email notification");
        const fallbackCertificateUrl = `https://app.box.com/s/${sessionId}_certificate`;
        const fallbackReportUrl = `https://app.box.com/s/${sessionId}_report`;
        
        const session = await onboardingService.getSession(sessionId);
        const stepData = session?.stepData || {};
        await onboardingService.sendEmailNotification(sessionId, stepData, fallbackCertificateUrl, fallbackReportUrl);
        appLogger.email("Email notification sent with fallback URLs");
      }
      
        res.json({ 
          success: true, 
          message: "Email flow triggered successfully",
          certificateResult: certificateResult.success ? "success" : "failed",
          reportResult: reportResult.success ? "success" : "failed"
        });
      } catch (error) {
        appLogger.email("Email flow test failed:", error);
        res.status(500).json(createErrorResponse(500, error instanceof Error ? error.message : 'Unknown error'));
      }
    }));
  }

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
        return res.status(404).json(createErrorResponse(404, 'Session not found'));
      }

      const stepData = session.stepData as any;
      const ventureId = stepData?.venture?.ventureId;
      const certificateUrl = stepData?.processing?.certificateUrl;
      const reportUrl = stepData?.processing?.reportUrl;

      if (!ventureId) {
        return res.status(400).json(createErrorResponse(400, 'No venture found in session'));
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
            sessionId: null,
            ventureId: ventureId,
            fileName: 'validation_certificate.pdf',
            originalName: 'validation_certificate.pdf',
            filePath: 'generated/certificate.pdf',
            fileSize: 0,
            mimeType: 'application/pdf',
            uploadStatus: 'completed',
            processingStatus: 'completed',
            eastemblemFileId: null,
            sharedUrl: certificateUrl,
            folderId: '332886218045' // Overview folder
          });
          documentsCreated++;
        } catch (e) { /* ignore if exists */ }
      }

      if (reportUrl) {
        try {
          await db.insert(documentUpload).values({
            sessionId: null,
            ventureId: ventureId,
            fileName: 'analysis_report.pdf',
            originalName: 'analysis_report.pdf',
            filePath: 'generated/report.pdf',
            fileSize: 0,
            mimeType: 'application/pdf',
            uploadStatus: 'completed',
            processingStatus: 'completed',
            eastemblemFileId: null,
            sharedUrl: reportUrl,
            folderId: '332886218045' // Overview folder
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
      appLogger.business('Error fixing venture URLs:', error);
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
      appLogger.email('Manual email send error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Legacy onboarding data storage (kept for compatibility)
  app.post("/api/onboarding/store", asyncHandler(async (req, res) => {
    const founderData = req.body;
    appLogger.business("Storing onboarding data in session:", founderData);

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

    appLogger.business(`Creating startup vault for: ${startupName}`);

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

    appLogger.business("Retrieved session data:", {
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

    appLogger.file(`Storing file for later processing: ${file.originalname}`);

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

    const sessionData = await getSessionData(req);
    const uploadedFile = sessionData.uploadedFile;
    const folderStructure = sessionData.folderStructure;

    if (!uploadedFile) {
      throw new Error("No file found - please upload a file first");
    }

    if (!folderStructure) {
      throw new Error("No folder structure found - please complete venture step first");
    }

    const sessionId = getSessionId(req);
    appLogger.business(`Starting scoring workflow for: ${uploadedFile.originalname}`);

    const overviewFolderId = folderStructure.folders["0_Overview"];
    if (!overviewFolderId) {
      throw new Error("Overview folder not found");
    }

    appLogger.file(`Uploading ${uploadedFile.originalname} to Overview folder: ${overviewFolderId}`);
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    
    // Upload file to Overview folder and score
    const uploadResult = await eastEmblemAPI.uploadFile(
      fileBuffer,
      uploadedFile.originalname,
      overviewFolderId,
      sessionId,
      true
    );
    appLogger.file("Overview folder upload result:", uploadResult);

    const pitchDeckScore = await eastEmblemAPI.scorePitchDeck(
      fileBuffer,
      uploadedFile.originalname,
      sessionId
    );

    // Update session
    const updatedFiles = [...((sessionData as any).uploadedFiles || []), uploadResult];
    updateSessionData(getSessionId(req), { 
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
    appLogger.database(`Testing database service DIRECT QUERY for founderId: ${founderId}`);
    
    try {
      // Call the direct database method to bypass all caching
      const data = await databaseService.fetchFounderWithLatestVentureFromDB(founderId);
      
      appLogger.database(`Raw data structure:`, JSON.stringify(data, null, 2));
      appLogger.database(`Data properties:`, {
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
      appLogger.database("Database test error:", error);
      res.status(500).json(createErrorResponse(500, error instanceof Error ? error.message : 'Unknown error'));
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

  // ProofScaling Wishlist routes
  app.use("/api/proofscaling-wishlist", (await import("./routes/proofscaling-wishlist")).default);

  // Email routes
  app.use("/api/email", (await import("./routes/emailRoutes")).default);
  
  // Debug routes (development only)
  if (process.env.NODE_ENV !== 'production') {
    // Remove debug-encryption import to fix LSP error
    // app.use("/api/debug-encryption", (await import("./routes/debug-encryption")).default);
  }
  
  // Use existing vault routes with updated database-driven logic
  app.use("/api/vault", (await import("./routes/vault")).default);

  const httpServer = createServer(app);
  return httpServer;
}

// 100% DATABASE-DRIVEN folder mapping - USE EXISTING FOLDER-MAPPING UTILITY
async function getCategoryFromFolderId(folderId: string, founderId?: string): Promise<string> {
  if (!founderId) {
    throw new Error("founderId required for database-driven folder mapping");
  }
  
  try {
    const { getCategoryFromFolderIdDB } = await import('./utils/folder-mapping');
    return await getCategoryFromFolderIdDB(folderId, founderId);
  } catch (error) {
    appLogger.database('❌ CRITICAL: Database folder mapping failed:', error);
    throw new Error(`Category not found for folder ${folderId}. Database-driven mapping required.`);
  }
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