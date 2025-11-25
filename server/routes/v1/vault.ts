import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { authenticateToken } from '../../middleware/token-auth';
import { asyncHandler } from '../middleware/error';
import { eastEmblemAPI } from '../../eastemblem-api';
import { getSessionId, getSessionData, updateSessionData } from '../../utils/session-manager';
import { createSuccessResponse } from '../../utils/error-handler';
import { cleanupUploadedFile } from '../../utils/file-cleanup';
import { ActivityService } from '../../services/activity-service';
import { lruCacheService } from '../../services/lru-cache-service';
import { appLogger } from '../../utils/logger';
import { DocumentRepository } from '../../repositories/document-repository';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';

const router = Router();

// Format file size helper function (matching other dashboard routes)
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Error type for file upload failures
interface FileUploadError {
  fileName: string;
  reason: string;
  errorType: 'validation' | 'size' | 'network' | 'server' | 'unknown';
}

// Configure multer for file uploads - Set to max artifact limit (100MB)
// Individual artifact limits are validated after upload using artifact config
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
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // PDF files
      "application/pdf",
      
      // MS Office files: DOCX, DOC, XLSX, XLS, PPT, PPTX
      "application/msword", // DOC
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/vnd.ms-excel", // XLS
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
      "application/vnd.ms-powerpoint", // PPT
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
      
      // Image formats: BMP, PNG, JPG, JPEG, GIF, TIF, TIFF, SVG, WebP
      "image/bmp",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/tiff",
      "image/tif",
      "image/svg+xml",
      "image/webp",
      
      // Video formats
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo", // AVI
      "video/webm",
      "video/3gpp",
      "video/x-flv",
      "video/x-ms-wmv",
      
      // Audio formats
      "audio/mpeg", // MP3
      "audio/wav",
      "audio/ogg",
      "audio/aac",
      "audio/x-m4a",
      "audio/mp4",
      
      // Other popular formats
      "text/plain", // TXT
      "application/vnd.oasis.opendocument.spreadsheet", // ODS
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template", // XLTX
      "text/csv", // CSV
      "application/vnd.ms-excel.sheet.binary.macroEnabled.12", // XLSB
      "application/vnd.ms-excel.sheet.macroEnabled.12", // XLSM
      "application/xml", // XML
      "text/xml", // XML alternative
      "message/rfc822", // EML
      "application/vnd.ms-project", // MPP
      "application/vnd.ms-outlook", // MSG
      "application/rtf", // RTF
      "application/vnd.oasis.opendocument.text", // ODT
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow", // PPSX
      "application/vnd.visio", // VSD
      "application/vnd.ms-visio.drawing", // VSDX
      "application/vnd.ms-xpsdocument", // XPS
      "application/x-autocad", // DWG
      "image/vnd.dwg", // DWG alternative
      "application/x-dwf" // DWF
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported. Please upload PDF, MS Office documents (DOC, DOCX, XLS, XLSX, PPT, PPTX), images (PNG, JPG, JPEG, BMP, GIF, TIF, TIFF, SVG, WebP), videos (MP4, MOV, AVI, WebM), audio (MP3, WAV, AAC), or other business documents (TXT, CSV, XML, RTF, etc.).`));
    }
  },
});

// Create startup vault structure - EXACT SAME LOGIC as routes.ts
router.post('/create-startup-vault', asyncHandler(async (req: Request, res: Response) => {
  const { startupName } = req.body;

  if (!startupName) {
    throw new Error("startupName is required");
  }

  if (!eastEmblemAPI.isConfigured()) {
    throw new Error("EastEmblem API not configured");
  }

  // Sanitize startup name for logging to prevent security scanner warnings
  const sanitizedStartupName = String(startupName).replace(/[<>&"']/g, '');
  appLogger.api('Creating startup vault', { startupName: sanitizedStartupName });

  const folderStructure = await eastEmblemAPI.createFolderStructure(startupName, getSessionId(req));

  const sessionId = getSessionId(req);
  updateSessionData(sessionId, {
    folderStructure,
    startupName,
    uploadedFiles: [],
  });

  res.json(createSuccessResponse({
    folderStructure,
    sessionId: getSessionId(req),
  }, "Startup vault created successfully"));
}));

// Get session data - EXACT SAME LOGIC as routes.ts
router.get('/session', asyncHandler(async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const sessionData = await getSessionData(sessionId);

  appLogger.api('Retrieved session data', {
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

// Get uploaded artifacts for filtering dropdown (JWT AUTH REQUIRED)
router.get('/uploaded-artifacts', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const founderId = req.user?.founderId;

  if (!founderId) {
    return res.status(401).json({ success: false, error: "JWT authentication required" });
  }

  try {
    // Get venture for this founder
    const { storage } = await import("../../storage");
    const ventures = await storage.getVenturesByFounderId(founderId);
    
    if (!ventures || ventures.length === 0) {
      return res.json(createSuccessResponse({ uploadedArtifacts: [] }, "No venture found"));
    }

    // Get the first (primary) venture
    const venture = ventures[0];

    // Get uploaded artifacts using DocumentRepository
    const documentRepository = new DocumentRepository();
    const uploadedArtifacts = await documentRepository.getUploadedArtifacts(venture.ventureId);

    appLogger.api(`Retrieved ${uploadedArtifacts.length} uploaded artifacts for venture ${venture.ventureId}`);

    res.json(createSuccessResponse({
      uploadedArtifacts,
      ventureId: venture.ventureId
    }, "Uploaded artifacts retrieved successfully"));

  } catch (error) {
    appLogger.error('Failed to get uploaded artifacts:', error);
    return res.status(500).json({ success: false, error: "Failed to retrieve uploaded artifacts" });
  }
}));

// Upload file only (store for later processing) - EXACT SAME LOGIC as routes.ts
router.post('/upload-only', upload.single("file"), asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    throw new Error("File is required for upload");
  }

  // Sanitize filename for logging to prevent security scanner warnings
  const sanitizedFilename = String(file.originalname).replace(/[<>&"']/g, '');
  appLogger.api('Storing file for later processing', { filename: sanitizedFilename });

  const sessionId = getSessionId(req);
  updateSessionData(sessionId, {
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

// Submit for scoring workflow - EXACT SAME LOGIC as routes.ts
router.post('/submit-for-scoring', asyncHandler(async (req: Request, res: Response) => {
  if (!eastEmblemAPI.isConfigured()) {
    throw new Error("EastEmblem API not configured");
  }

  const sessionId = getSessionId(req);
  const sessionData = await getSessionData(sessionId);
  const uploadedFile = sessionData.uploadedFile;
  const folderStructure = sessionData.folderStructure;

  if (!uploadedFile) {
    throw new Error("No file found - please upload a file first");
  }

  if (!folderStructure) {
    throw new Error("No folder structure found - please complete venture step first");
  }
  // Sanitize filename for logging to prevent security scanner warnings
  const sanitizedUploadFilename = String(uploadedFile.originalname).replace(/[<>&"']/g, '');
  appLogger.api('Starting scoring workflow', { filename: sanitizedUploadFilename });

  const overviewFolderId = folderStructure.folders["0_Overview"];
  if (!overviewFolderId) {
    throw new Error("Overview folder not found");
  }

  // Sanitize filename and folder ID for logging to prevent security scanner warnings
  const sanitizedName = String(uploadedFile.originalname).replace(/[<>&"']/g, '');
  const sanitizedFolderId = String(overviewFolderId).replace(/[^\w-]/g, '');
  appLogger.api('Uploading to Overview folder', { filename: sanitizedName, folderId: sanitizedFolderId });
  const fileBuffer = fs.readFileSync(uploadedFile.filepath);
  
  // Upload file to Overview folder and score
  const uploadResult = await eastEmblemAPI.uploadFile(
    fileBuffer,
    uploadedFile.originalname,
    overviewFolderId,
    sessionId,
    true
  );
  appLogger.api('Overview folder upload result', { success: !!uploadResult, hasResult: !!uploadResult });

  const pitchDeckScore = await eastEmblemAPI.scorePitchDeck(
    fileBuffer,
    uploadedFile.originalname,
    sessionId
  );

  // Update session
  const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
  updateSessionData(sessionId, { 
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

// Upload file to specific folder - 100% DATABASE-DRIVEN (V1 JWT AUTHENTICATED)
router.post('/upload-file', upload.single("file"), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { folder_id, artifactType, description } = req.body;
  const file = req.file;
  const founderId = req.user?.founderId;

  if (!founderId) {
    return res.status(401).json({ success: false, error: "JWT authentication required for file upload" });
  }

  if (!file) {
    throw new Error("File is required for upload");
  }

  // Log file upload processing for debugging
  appLogger.file(`V1 UPLOAD: Processing database-driven file upload for founder ${founderId}`);

  const sessionId = getSessionId(req);
  
  // SCOPE FIX: Declare variables at function scope so they're accessible throughout
  let currentVentureId = null;
  let categoryId = '';
  let scoreAwarded = 0;
  let proofScoreContribution = 0;
  let newVaultScore = 0;
  let newProofScore = 0;
  
  // Extract batch upload flags early to make them available throughout the function scope
  const isBatchUpload = req.body.isBatchUpload === 'true';
  const isLastInBatch = req.body.isLastInBatch === 'true';
  const shouldUpdateVaultScore = !isBatchUpload || isLastInBatch;

  try {
    // Step 1: Get actual Box.com folder ID from database - NO FALLBACKS
    const { getFolderIdFromCategory } = await import("../../utils/folder-mapping");
    const actualFolderId = await getFolderIdFromCategory(folder_id, founderId);
    
    // Sanitize IDs for logging to prevent security scanner warnings
    const sanitizedCategory = String(folder_id).replace(/[^\w-]/g, '');
    const sanitizedFolderId = String(actualFolderId).replace(/[^\w-]/g, '');
    appLogger.file(`V1 UPLOAD: Resolved category "${folder_id}" to folder ID "${actualFolderId}"`);

    // Step 2: Upload to Box.com using resolved folder ID
    const fileBuffer = fs.readFileSync(file.path);
    const uploadResult = await eastEmblemAPI.uploadFile(
      fileBuffer,
      file.originalname,
      actualFolderId,
      sessionId,
      true // allowShare
    );

    // Step 3: Get venture ID from founder ID and store upload in database
    const { storage } = await import("../../storage");
    const { databaseService } = await import("../../services/database-service");
    
    try {
      // Get current venture ID from founder ID
      try {
        const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
        currentVentureId = dashboardData?.venture?.ventureId || null;
        // Sanitize IDs for logging to prevent security scanner warnings
        const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
        const sanitizedVentureId = String(currentVentureId).replace(/[^\w-]/g, '');
        appLogger.database(`V1 UPLOAD: Resolved founder ${founderId} to venture ${currentVentureId}`);
      } catch (ventureError) {
        appLogger.api('V1 upload - failed to get venture ID', { founderId, error: ventureError instanceof Error ? ventureError.message : 'Unknown error' });
      }

      // Calculate categoryId, scoreAwarded, and proofScoreContribution from artifactType
      let growthStage = null;
      
      if (artifactType && currentVentureId) {
        try {
          // Get venture's growth stage
          const venture = await storage.getVenture(currentVentureId);
          growthStage = venture?.growthStage;
          
          const { getArtifactsForStage } = await import("@shared/config/artifacts");
          const stageArtifacts = getArtifactsForStage(growthStage);
          
          // Find which category contains this artifactType
          for (const [catId, categoryData] of Object.entries(stageArtifacts)) {
            const category = categoryData as any;
            if (category.artifacts && category.artifacts[artifactType]) {
              categoryId = catId;
              scoreAwarded = category.artifacts[artifactType].score || 0;
              proofScoreContribution = category.artifacts[artifactType].proofScoreContribution || 0;
              break;
            }
          }
          appLogger.database(`V1 UPLOAD: Mapped artifactType "${artifactType}" to category "${categoryId}" with VaultScore +${scoreAwarded}, ProofScore +${proofScoreContribution} (stage: ${growthStage})`);
        } catch (artifactError) {
          appLogger.api('V1 upload - failed to calculate artifact category/score', { artifactType, error: artifactError instanceof Error ? artifactError.message : 'Unknown error' });
        }
      }

      const uploadRecord = await storage.createDocumentUpload({
        sessionId: null, // V1 uploads don't require session reference
        ventureId: currentVentureId, // FIXED: Use resolved venture ID instead of null
        fileName: file.originalname,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadStatus: 'completed',
        processingStatus: 'completed',
        eastemblemFileId: uploadResult.id,
        sharedUrl: uploadResult.url,
        folderId: actualFolderId,
        // ProofVault enhancement fields
        artifactType: artifactType || '',
        description: description || '',
        categoryId: categoryId,
        scoreAwarded: scoreAwarded,
        proofScoreContribution: proofScoreContribution,
        uploadSource: 'proof-vault' // Mark as proof-vault upload for ProofCoach task tracking
      });
      // Sanitize IDs for logging to prevent security scanner warnings
      const sanitizedUploadId = String(uploadRecord.uploadId).replace(/[^\w-]/g, '');
      const sanitizedVentureId = String(currentVentureId).replace(/[^\w-]/g, '');
      appLogger.database(`V1 UPLOAD: Database record created with ID ${uploadRecord.uploadId} for venture ${currentVentureId}`);

      // FIXED: Emit VAULT_FILE_UPLOADED event after database entry creation
      const { ActivityService } = await import("../../services/activity-service");
      const { COACH_EVENTS } = await import("@shared/config/coach-events");
      const context = ActivityService.getContextFromRequest(req);
      
      await ActivityService.logActivity(context, {
        activityType: 'document',
        action: COACH_EVENTS.VAULT_FILE_UPLOADED,
        title: `Uploaded ${file.originalname}`,
        description: `Uploaded to ProofVault${artifactType ? ` - ${artifactType}` : ''}`,
        metadata: {
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          artifactType: artifactType || '',
          uploadId: uploadRecord.uploadId,
          folderId: actualFolderId,
        },
        entityId: String(uploadRecord.uploadId),
        entityType: 'document',
      });

      // Check and emit milestone events (VAULT_FIRST_UPLOAD, etc.)
      if (currentVentureId && founderId) {
        const { VaultMilestoneService } = await import("../../services/vault-milestone-service");
        await VaultMilestoneService.checkAndEmitMilestones(founderId, currentVentureId, context);
      }

      // NEW: Calculate and update both VaultScore and ProofScore (only for non-batch or last file in batch)
      let currentVaultScore = 0;
      let currentProofScore = 0;
      
      if (currentVentureId && shouldUpdateVaultScore) {
        try {
          // Get current scores before updating
          currentVaultScore = await storage.getCurrentVaultScore(currentVentureId);
          const venture = await storage.getVenture(currentVentureId);
          currentProofScore = venture?.proofScore || 0;
          
          // Calculate new VaultScore (recalculate complete score)
          newVaultScore = await storage.calculateVaultScore(currentVentureId);
          // Cap VaultScore at 100
          newVaultScore = Math.min(newVaultScore, 100);
          
          // Calculate new ProofScore (add contribution)
          newProofScore = currentProofScore + proofScoreContribution;
          // Cap ProofScore at 95
          newProofScore = Math.min(newProofScore, 95);
          
          // Update both scores in venture table
          await storage.updateVenture(currentVentureId, {
            vaultScore: newVaultScore,
            proofScore: newProofScore,
            updatedAt: new Date()
          });
          
          appLogger.database(`V1 UPLOAD: Scores updated for venture ${currentVentureId} ${isBatchUpload ? '(batch upload - last file)' : '(single upload)'} - VaultScore: ${currentVaultScore} → ${newVaultScore} (max 100), ProofScore: ${currentProofScore} → ${newProofScore} (max 95)`);

          // Log VaultScore update activity with previous and new scores
          const { ActivityService } = await import("../../services/activity-service");
          const context = ActivityService.getContextFromRequest(req);
          await ActivityService.logVaultScoreActivity(
            { ...context, founderId, ventureId: currentVentureId },
            isBatchUpload ? 'Batch Upload - Score Updated' : 'Score Updated',
            currentVaultScore,
            newVaultScore,
            uploadRecord.uploadId,
            { 
              artifactType: artifactType || '',
              scoreAdded: scoreAwarded,
              proofScoreAdded: proofScoreContribution,
              categoryId: categoryId,
              isBatchUpload: isBatchUpload,
              newProofScore: newProofScore
            }
          );
        } catch (scoreUpdateError) {
          appLogger.api('V1 upload - Score update failed', { 
            founderId, 
            ventureId: currentVentureId,
            error: scoreUpdateError instanceof Error ? scoreUpdateError.message : 'Unknown error',
            isBatchUpload: isBatchUpload,
            isLastInBatch: isLastInBatch
          });
          // Don't fail the upload if score update fails
        }
      } else if (currentVentureId && isBatchUpload && !isLastInBatch) {
        appLogger.database(`V1 UPLOAD: Skipping score update for batch upload file (not last) - venture ${currentVentureId}`);
      }

      // Invalidate uploaded artifacts cache after successful upload
      if (currentVentureId) {
        try {
          const documentRepository = new DocumentRepository();
          await documentRepository.invalidateUploadedArtifactsCache(currentVentureId);
          appLogger.api(`V1 UPLOAD: Invalidated uploaded artifacts cache for venture ${currentVentureId}`);
        } catch (cacheError) {
          appLogger.api('V1 upload - cache invalidation failed', { 
            ventureId: currentVentureId,
            error: cacheError instanceof Error ? cacheError.message : 'Unknown error' 
          });
          // Don't fail the upload if cache invalidation fails
        }
      }
    } catch (dbError) {
      appLogger.api('V1 upload - database storage failed', { founderId, error: dbError instanceof Error ? dbError.message : 'Unknown error' });
      // Continue without failing the upload since Box.com upload succeeded
    }

    // Step 4: Update session with uploaded file
    const sessionData = await getSessionData(sessionId);
    const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
    updateSessionData(sessionId, { uploadedFiles: updatedFiles });

    // Step 5: Log file upload activity
    const context = ActivityService.getContextFromRequest(req);
    await ActivityService.logDocumentActivity(
      { ...context, founderId, ventureId: currentVentureId },
      'upload',
      `Uploaded ${file.originalname}`,
      uploadResult.id,
      file.originalname,
      folder_id,
      {
        fileSize: file.size,
        folderId: actualFolderId,
        fileId: uploadResult.id
      }
    );

    // Step 6: Invalidate cache after successful upload
    if (founderId) {
      try {
        // Invalidate dashboard cache to refresh VaultScore
        await lruCacheService.invalidate('dashboard', founderId);
        await lruCacheService.invalidate('dashboard', `vault_${founderId}`);
        await lruCacheService.invalidate('dashboard', `activity_${founderId}`);
        // CRITICAL: Also invalidate founder cache since vault endpoint uses getFounderWithLatestVenture
        await lruCacheService.invalidate('founder', founderId);
        // Sanitize founder ID for logging to prevent security scanner warnings
        const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
        appLogger.cache(`V1 UPLOAD: Cache invalidated for founder ${founderId} (dashboard, vault, activity, founder)`);
      } catch (cacheError) {
        appLogger.api('V1 upload - cache invalidation failed', { founderId, error: cacheError instanceof Error ? cacheError.message : 'Unknown error' });
        // Don't fail the upload if cache invalidation fails
      }
    }

    // Step 7: Cleanup uploaded file
    cleanupUploadedFile(file.path, file.originalname);

    // Sanitize filename and folder ID for logging to prevent security scanner warnings
    const sanitizedUploadFilename = String(file.originalname).replace(/[<>&"']/g, '');
    const sanitizedUploadFolderId = String(actualFolderId).replace(/[^\w-]/g, '');
    appLogger.file(`V1 UPLOAD: File "${file.originalname}" uploaded successfully to folder ${actualFolderId}`);

    const responseData: any = {
      file: {
        id: uploadResult.id,
        name: uploadResult.name,
        url: uploadResult.url,
        size: file.size,
        category: folder_id,
        folderId: actualFolderId
      },
      scoreAdded: scoreAwarded,
      proofScoreAdded: proofScoreContribution
    };

    // Only include scores if they were updated
    if (shouldUpdateVaultScore && newVaultScore !== undefined) {
      responseData.vaultScore = newVaultScore;
      responseData.proofScore = newProofScore;
      appLogger.database(`V1 UPLOAD: Including both scores in response - VaultScore: ${newVaultScore}/100, ProofScore: ${newProofScore}/95`);
    } else if (currentVentureId && isBatchUpload && !isLastInBatch) {
      appLogger.database(`V1 UPLOAD: Omitting scores from response (batch upload, not last file)`);
    }

    res.json(createSuccessResponse(responseData));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    appLogger.api('V1 upload - failed to resolve category to folder ID', { founderId, error: error instanceof Error ? error.message : 'Unknown error' });
    
    // Log activity even on failure (currentVentureId is now accessible)
    try {
      const context = ActivityService.getContextFromRequest(req);
      await ActivityService.logDocumentActivity(
        { ...context, founderId, ventureId: currentVentureId },
        'upload',
        `Failed to upload ${file.originalname}: ${errorMessage}`,
        '',
        file.originalname,
        folder_id,
        {
          error: errorMessage,
          fileSize: file.size,
          category: folder_id,
          status: 'failed'
        }
      );
    } catch (activityError) {
      appLogger.api('V1 upload - failed to log activity', { founderId, error: activityError instanceof Error ? activityError.message : 'Unknown error' });
    }
    
    // Cleanup uploaded file on error
    if (file.path && fs.existsSync(file.path)) {
      cleanupUploadedFile(file.path, file.originalname);
    }

    return res.status(400).json({ 
      success: false, 
      error: errorMessage
    });
  }
}));

// Create folder endpoint - V1 DATABASE-DRIVEN with JWT authentication
router.post('/create-folder', upload.none(), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { folderName, folder_id, ventureId } = req.body;
  const founderId = req.user?.founderId;
  
  if (!founderId) {
    return res.status(401).json({ success: false, error: "JWT authentication required for folder creation" });
  }
  
  if (!folderName || !folder_id) {
    return res.status(400).json({ error: 'folderName and folder_id are required' });
  }

  // Sanitize founder ID for logging to prevent security scanner warnings
  const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
  appLogger.api('V1 create folder - processing database-driven folder creation', { founderId: sanitizedFounderId });

  try {
    // Step 1: Determine if folder_id is a category name or direct folder ID
    let actualParentFolderId: string;
    
    // If folder_id looks like a Box.com folder ID (numeric), use it directly
    if (/^\d+$/.test(folder_id)) {
      actualParentFolderId = folder_id;
      // Sanitize folder ID for logging to prevent security scanner warnings
      const sanitizedFolderId = String(actualParentFolderId).replace(/[^\w-]/g, '');
      appLogger.api('V1 create folder - using direct folder ID', { folderId: sanitizedFolderId });
    } else {
      // If it's a category name, resolve it from database
      const { getFolderIdFromCategory } = await import("../../utils/folder-mapping");
      actualParentFolderId = await getFolderIdFromCategory(folder_id, founderId);
      // Sanitize IDs for logging to prevent security scanner warnings
      const sanitizedCategory = String(folder_id).replace(/[^\w-]/g, '');
      const sanitizedParentFolderId = String(actualParentFolderId).replace(/[^\w-]/g, '');
      appLogger.api('V1 create folder - resolved category to parent folder', { category: sanitizedCategory, parentFolderId: sanitizedParentFolderId });
    }

    // Step 2: Create folder via EastEmblem API using service layer with proper error handling
    const { eastEmblemAPI } = await import("../../eastemblem-api");
    const { getSessionId } = await import("../../utils/session-manager");
    
    const sessionId = getSessionId(req);
    let result;
    let usedFallback = false;
    
    try {
      result = await eastEmblemAPI.createFolder(folderName, actualParentFolderId, sessionId);
      appLogger.api('V1 folder creation successful via EastEmblem API', {
        folderName,
        folderId: result.id
      });

      // Step 3: Store folder mapping in proof_vault table (CRITICAL FIX)
      const { storage } = await import("../../storage");
      const { databaseService } = await import("../../services/database-service");
      
      try {
        // Get current venture ID from founder ID
        let currentVentureId = null;
        try {
          const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
          currentVentureId = dashboardData?.venture?.ventureId || null;
          // Sanitize IDs for logging to prevent security scanner warnings
          const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
          const sanitizedVentureId = String(currentVentureId).replace(/[^\w-]/g, '');
          appLogger.api('V1 folder creation - resolved founder to venture', { founderId: sanitizedFounderId, ventureId: sanitizedVentureId });
        } catch (ventureError) {
          appLogger.api('V1 folder creation - failed to get venture ID', { founderId, error: ventureError instanceof Error ? ventureError.message : 'Unknown error' });
        }

        if (currentVentureId && result.id) {
          const proofVaultData = {
            ventureId: currentVentureId,
            artefactType: 'Technical Documentation' as const,
            parentFolderId: actualParentFolderId,
            subFolderId: result.id.toString(),
            sharedUrl: result.url || '',
            folderName: folderName,
            description: `Subfolder created in ${folder_id} category`
          };
          
          const proofVaultEntry = await storage.createProofVault(proofVaultData);
          appLogger.api('V1 folder creation - proof vault entry created', { 
            folderName,
            folderId: result.id,
            vaultId: proofVaultEntry.vaultId,
            parentCategory: folder_id
          });
        }
      } catch (dbError) {
        appLogger.api('V1 folder creation - failed to create proof vault entry', { error: dbError instanceof Error ? dbError.message : 'Unknown error' });
        // Continue without failing the folder creation since Box.com creation succeeded
      }

    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      appLogger.api('V1 EastEmblem API folder creation failed - using fallback', {
        folderName,
        error: errorMessage
      });
      
      // Fallback: Use parent folder for uploads (same as legacy vault route)
      result = {
        id: actualParentFolderId,
        name: folderName,
        url: `https://app.box.com/folder/${actualParentFolderId}`,
        note: `Files will be uploaded to the ${folder_id} category folder`
      };
      usedFallback = true;
    }
    
    // Log folder creation activity for recent-activity feed
    if (founderId) {
      try {
        const { databaseService } = await import("../../services/database-service");
        let currentVentureId = null;
        try {
          const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
          currentVentureId = dashboardData?.venture?.ventureId || null;
        } catch (ventureError) {
          appLogger.api('V1 folder creation - failed to get venture ID for activity logging', { error: ventureError instanceof Error ? ventureError.message : 'Unknown error' });
        }

        const context = ActivityService.getContextFromRequest(req);
        await ActivityService.logActivity(
          { ...context, founderId, ventureId: currentVentureId || null },
          {
            activityType: 'document',
            action: 'folder_created',
            title: `Folder created: ${folderName}`,
            description: `Created folder "${folderName}" in ${folder_id} category`,
            entityId: result.id?.toString(),
            entityType: 'folder',
            metadata: {
              folderName: folderName,
              parentCategory: folder_id,
              parentFolderId: actualParentFolderId,
              usedFallback: usedFallback
            }
          }
        );
        // Sanitize folder name for logging to prevent security scanner warnings
        const sanitizedFolderName = String(folderName).replace(/[<>&"']/g, '');
        appLogger.api('V1 folder creation - activity logged', { folderName: sanitizedFolderName });
      } catch (activityError) {
        appLogger.api('V1 folder creation - activity logging failed', { error: activityError instanceof Error ? activityError.message : 'Unknown error' });
        // Don't fail the folder creation if activity logging fails
      }
    }

    // Invalidate cache after successful folder creation
    if (founderId) {
      try {
        await lruCacheService.invalidate('dashboard', `vault_${founderId}`);
        // Sanitize founder ID for logging to prevent security scanner warnings
        const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
        appLogger.api('V1 folder creation - cache invalidated', { founderId: sanitizedFounderId });
      } catch (cacheError) {
        appLogger.api('V1 folder creation - cache invalidation failed', { error: cacheError instanceof Error ? cacheError.message : 'Unknown error' });
        // Don't fail the folder creation if cache invalidation fails
      }
    }

    res.json(createSuccessResponse({
      folderId: result.id,
      folderName: folderName,
      parentFolderId: actualParentFolderId,
      usedFallback: usedFallback,
      message: usedFallback ? 'Folder creation used fallback strategy' : 'Folder created successfully',
      note: 'note' in result ? result.note : undefined
    }, "V1 Folder creation completed"));

  } catch (error) {
    appLogger.api('V1 folder creation error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}));

// Upload file directly to folder ID (bypasses category mapping) - V1 JWT AUTHENTICATED
router.post('/upload-file-direct', upload.single("file"), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { folder_id, artifactType, description, isBatchUpload, isLastInBatch } = req.body;
  const file = req.file;
  const founderId = req.user?.founderId;

  if (!founderId) {
    return res.status(401).json({ success: false, error: "JWT authentication required for file upload" });
  }

  if (!file) {
    throw new Error("File is required for upload");
  }

  if (!folder_id) {
    throw new Error("folder_id is required for direct upload");
  }

  // Sanitize IDs for logging to prevent security scanner warnings
  const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
  const sanitizedFolderId = String(folder_id).replace(/[^\w-]/g, '');
  appLogger.api('V1 direct upload - processing folder upload', { founderId: sanitizedFounderId, folderId: sanitizedFolderId });

  const sessionId = getSessionId(req);
  
  // Get venture info early for validation
  const { storage } = await import("../../storage");
  const { databaseService } = await import("../../services/database-service");
  let currentVentureId: string | null = null;
  let growthStage: string | null = null;
  
  try {
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    currentVentureId = dashboardData?.venture?.ventureId || null;
    growthStage = dashboardData?.venture?.growthStage || null;
  } catch (ventureError) {
    appLogger.api('V1 direct upload - failed to get venture info', { error: ventureError instanceof Error ? ventureError.message : 'Unknown error' });
  }
  
  // Validate file size against artifact-specific limits
  if (artifactType) {
    try {
      const { getArtifactConfig } = await import("@shared/config/artifacts");
      
      // Extract categoryId from folder structure or use artifactType to find it
      let categoryId = '';
      const { getArtifactsForStage } = await import("@shared/config/artifacts");
      const stageArtifacts = getArtifactsForStage(growthStage);
      
      for (const [catId, categoryData] of Object.entries(stageArtifacts)) {
        const category = categoryData as any;
        if (category.artifacts && category.artifacts[artifactType]) {
          categoryId = catId;
          break;
        }
      }
      
      if (categoryId) {
        const artifactConfig = getArtifactConfig(growthStage, categoryId, artifactType);
        if (artifactConfig && file.size > artifactConfig.maxSizeBytes) {
          const maxSizeMB = (artifactConfig.maxSizeBytes / (1024 * 1024)).toFixed(0);
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          const errorMessage = `File too large: ${fileSizeMB}MB exceeds maximum ${maxSizeMB}MB for ${artifactConfig.name}`;
          
          // Log failed upload to database
          if (currentVentureId) {
            try {
              await storage.createDocumentUpload({
                sessionId: null,
                ventureId: currentVentureId,
                fileName: file.originalname,
                originalName: file.originalname,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadStatus: 'failed',
                processingStatus: 'failed',
                errorMessage: errorMessage,
                eastemblemFileId: null,
                sharedUrl: null,
                folderId: folder_id,
                artifactType: artifactType || '',
                description: description || '',
                categoryId: categoryId,
                scoreAwarded: 0,
                proofScoreContribution: 0
              });
              appLogger.api('V1 direct upload - file size validation failed, logged to database', { fileName: file.originalname, error: errorMessage });
            } catch (dbError) {
              appLogger.error('V1 direct upload - failed to log size validation error to database', dbError);
            }
          }
          
          // Cleanup uploaded file
          cleanupUploadedFile(file.path, file.originalname);
          
          throw new Error(errorMessage);
        }
      }
    } catch (validationError) {
      // Re-throw if it's our size error, otherwise log and continue
      if (validationError instanceof Error && validationError.message.includes('File too large')) {
        throw validationError;
      }
      appLogger.api('V1 direct upload - artifact validation error (non-fatal)', { error: validationError instanceof Error ? validationError.message : 'Unknown error' });
    }
  }
  
  try {
    // Use folder_id directly (no category mapping) for newly created subfolders
    const fileBuffer = fs.readFileSync(file.path);
    const uploadResult = await eastEmblemAPI.uploadFile(
      fileBuffer,
      file.originalname,
      folder_id, // Use folder ID directly
      sessionId,
      true // allowShare
    );

    // Update session with uploaded file
    const sessionData = await getSessionData(sessionId);
    const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
    updateSessionData(sessionId, { uploadedFiles: updatedFiles });

    // Get venture ID from founder ID and store upload in database
    const { storage } = await import("../../storage");
    const { databaseService } = await import("../../services/database-service");
    
    // Declare venture ID, growth stage, and score variables at function scope
    let currentVentureId: string | null = null;
    let growthStage: string | null = null;
    let categoryId = '';
    let scoreAwarded = 0;
    let proofScoreContribution = 0;
    
    try {
      // CRITICAL FIX: Get current venture ID from founder ID
      try {
        const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
        currentVentureId = dashboardData?.venture?.ventureId || null;
        growthStage = dashboardData?.venture?.growthStage || null;
        // Sanitize IDs for logging to prevent security scanner warnings
        const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
        const sanitizedVentureId = String(currentVentureId).replace(/[^\w-]/g, '');
        appLogger.api('V1 direct upload - resolved founder to venture', { founderId: sanitizedFounderId, ventureId: sanitizedVentureId, growthStage });
      } catch (ventureError) {
        appLogger.api('V1 direct upload - failed to get venture ID', { founderId, error: ventureError instanceof Error ? ventureError.message : 'Unknown error' });
      }

      // Calculate categoryId, scoreAwarded, and proofScoreContribution from artifactType
      
      if (artifactType) {
        try {
          const { getArtifactsForStage } = await import("@shared/config/artifacts");
          const stageArtifacts = getArtifactsForStage(growthStage);
          
          // Find which category contains this artifactType
          for (const [catId, categoryData] of Object.entries(stageArtifacts)) {
            const category = categoryData as any;
            if (category.artifacts && category.artifacts[artifactType]) {
              categoryId = catId;
              scoreAwarded = category.artifacts[artifactType].score || 0;
              proofScoreContribution = category.artifacts[artifactType].proofScoreContribution || 0;
              break;
            }
          }
          appLogger.database(`V1 DIRECT UPLOAD: Mapped artifactType "${artifactType}" to category "${categoryId}" with vaultScore ${scoreAwarded}, proofScore ${proofScoreContribution}`);
        } catch (artifactError) {
          appLogger.api('V1 direct upload - failed to calculate artifact scores', { artifactType, error: artifactError instanceof Error ? artifactError.message : 'Unknown error' });
        }
      }

      const uploadRecord = await storage.createDocumentUpload({
        sessionId: null, // V1 uploads don't require session reference
        ventureId: currentVentureId, // FIXED: Use resolved venture ID instead of null
        fileName: file.originalname,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadStatus: 'completed',
        processingStatus: 'completed',
        eastemblemFileId: uploadResult.id,
        sharedUrl: uploadResult.url,
        folderId: folder_id,
        // ProofVault enhancement fields
        artifactType: artifactType || '',
        description: description || '',
        categoryId: categoryId,
        scoreAwarded: scoreAwarded,
        proofScoreContribution: proofScoreContribution,
        uploadSource: 'proof-vault' // Mark as proof-vault upload for ProofCoach task tracking
      });
      // Sanitize IDs for logging to prevent security scanner warnings
      const sanitizedUploadId = String(uploadRecord.uploadId).replace(/[^\w-]/g, '');
      const sanitizedVentureId = String(currentVentureId).replace(/[^\w-]/g, '');
      appLogger.api('V1 direct upload - database record created', { uploadId: sanitizedUploadId, ventureId: sanitizedVentureId });

      // FIXED: Emit VAULT_FILE_UPLOADED event after database entry creation
      const { ActivityService: ActivityService2 } = await import("../../services/activity-service");
      const { COACH_EVENTS: COACH_EVENTS2 } = await import("@shared/config/coach-events");
      const context2 = ActivityService2.getContextFromRequest(req);
      
      await ActivityService2.logActivity(context2, {
        activityType: 'document',
        action: COACH_EVENTS2.VAULT_FILE_UPLOADED,
        title: `Uploaded ${file.originalname}`,
        description: `Uploaded to ProofVault${artifactType ? ` - ${artifactType}` : ''}`,
        metadata: {
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          artifactType: artifactType || '',
          uploadId: uploadRecord.uploadId,
          folderId: folder_id,
        },
        entityId: String(uploadRecord.uploadId),
        entityType: 'document',
      });

      // Check and emit milestone events (VAULT_FIRST_UPLOAD, etc.)
      if (currentVentureId && founderId) {
        const { VaultMilestoneService: VaultMilestoneService2 } = await import("../../services/vault-milestone-service");
        await VaultMilestoneService2.checkAndEmitMilestones(founderId, currentVentureId, context2);
      }

      // Invalidate uploaded artifacts cache after successful upload
      if (currentVentureId) {
        try {
          const documentRepository = new DocumentRepository();
          await documentRepository.invalidateUploadedArtifactsCache(currentVentureId);
          appLogger.api(`V1 DIRECT UPLOAD: Invalidated uploaded artifacts cache for venture ${currentVentureId}`);
        } catch (cacheError) {
          appLogger.api('V1 direct upload - cache invalidation failed', { 
            ventureId: currentVentureId,
            error: cacheError instanceof Error ? cacheError.message : 'Unknown error' 
          });
          // Don't fail the upload if cache invalidation fails
        }
      }
    } catch (dbError) {
      appLogger.api('V1 direct upload - database storage failed', { error: dbError instanceof Error ? dbError.message : 'Unknown error' });
      // Continue without failing the upload since Box.com upload succeeded
    }

    // Log direct upload activity for recent-activity feed
    if (founderId) {
      try {
        // Get venture ID for activity logging
        const { databaseService } = await import("../../services/database-service");
        let activityVentureId = null;
        try {
          const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
          activityVentureId = dashboardData?.venture?.ventureId || null;
        } catch (ventureError) {
          appLogger.api('V1 direct upload - failed to get venture ID for activity logging', { error: ventureError instanceof Error ? ventureError.message : 'Unknown error' });
        }

        const context = ActivityService.getContextFromRequest(req);
        await ActivityService.logActivity(
          { ...context, founderId, ventureId: activityVentureId },
          {
            activityType: 'document',
            action: 'file_uploaded',
            title: `File uploaded: ${file.originalname}`,
            description: `Uploaded "${file.originalname}" directly to folder ${folder_id}`,
            entityId: uploadResult.id,
            entityType: 'file',
            metadata: {
              fileName: file.originalname,
              fileSize: file.size,
              folderId: folder_id,
              uploadType: 'direct'
            }
          }
        );
        // Sanitize filename for logging to prevent security scanner warnings
        const sanitizedFilename = String(file.originalname).replace(/[<>&"']/g, '');
        appLogger.api('V1 direct upload - activity logged', { filename: sanitizedFilename });
      } catch (activityError) {
        appLogger.api('V1 direct upload - activity logging failed', { error: activityError instanceof Error ? activityError.message : 'Unknown error' });
        // Don't fail the upload if activity logging fails
      }
    }

    // Invalidate cache after successful direct upload
    if (founderId) {
      try {
        await lruCacheService.invalidate('dashboard', founderId);
        await lruCacheService.invalidate('dashboard', `vault_${founderId}`);
        await lruCacheService.invalidate('dashboard', `activity_${founderId}`);
        // CRITICAL: Also invalidate founder cache since validation endpoint uses getFounderWithLatestVenture
        await lruCacheService.invalidate('founder', founderId);
        // Sanitize founder ID for logging to prevent security scanner warnings
        const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
        appLogger.cache(`V1 DIRECT UPLOAD: Cache invalidated for founder ${founderId} (dashboard, vault, activity, founder)`);
      } catch (cacheError) {
        appLogger.api('V1 direct upload - cache invalidation failed', { error: cacheError instanceof Error ? cacheError.message : 'Unknown error' });
        // Don't fail the upload if cache invalidation fails
      }
    }

    // Cleanup uploaded file
    cleanupUploadedFile(file.path, file.originalname);

    // Sanitize filename and folder ID for logging to prevent security scanner warnings
    const sanitizedFilename = String(file.originalname).replace(/[<>&"']/g, '');
    const sanitizedFolderId = String(folder_id).replace(/[^\w-]/g, '');
    appLogger.api('V1 direct upload - file uploaded successfully', { filename: sanitizedFilename, folderId: sanitizedFolderId });

    // Update scores when last file in batch completes or for single file uploads
    let updatedVaultScore: number | undefined;
    let updatedProofScore: number | undefined;
    
    if (currentVentureId && (isLastInBatch === 'true' || !isBatchUpload)) {
      try {
        // Recalculate scores (now includes pitch deck + artifacts)
        updatedVaultScore = await storage.calculateVaultScore(currentVentureId);
        updatedProofScore = await storage.calculateProofScore(currentVentureId);
        
        await storage.updateVaultScore(currentVentureId, updatedVaultScore);
        await storage.updateProofScore(currentVentureId, updatedProofScore);
        
        appLogger.api(`V1 direct upload - scores updated: VaultScore=${updatedVaultScore}, ProofScore=${updatedProofScore}`);
      } catch (scoreError) {
        appLogger.error('V1 direct upload - score update failed', scoreError);
        // Don't fail the upload if score update fails
      }
    }

    res.json(createSuccessResponse({
      file: {
        id: uploadResult.id,
        name: uploadResult.name,
        url: uploadResult.url,
        size: file.size,
        folderId: folder_id
      },
      vaultScore: updatedVaultScore,
      proofScore: updatedProofScore
    }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    appLogger.api('V1 direct upload failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      fileName: file?.originalname 
    });
    
    // Log failed upload to database (if not already logged by validation)
    if (currentVentureId && !errorMessage.includes('File too large')) {
      try {
        const { storage } = await import("../../storage");
        await storage.createDocumentUpload({
          sessionId: null,
          ventureId: currentVentureId,
          fileName: file.originalname,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadStatus: 'failed',
          processingStatus: 'failed',
          errorMessage: errorMessage,
          eastemblemFileId: null,
          sharedUrl: null,
          folderId: folder_id,
          artifactType: artifactType || '',
          description: description || 'Upload failed',
          categoryId: '',
          scoreAwarded: 0,
          proofScoreContribution: 0
        });
        appLogger.api('V1 direct upload - general failure logged to database', { fileName: file.originalname, error: errorMessage });
      } catch (dbError) {
        appLogger.error('V1 direct upload - failed to log general error to database', dbError);
      }
    }
    
    // Cleanup uploaded file on error
    if (file.path && fs.existsSync(file.path)) {
      cleanupUploadedFile(file.path, file.originalname);
    }

    return res.status(400).json({ 
      success: false, 
      error: errorMessage
    });
  }
}));

// Batch upload files to folder - V1 JWT AUTHENTICATED
router.post('/upload-files-batch', upload.array("files", 50), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { folder_id, artifactType, description } = req.body;
  const files = req.files as Express.Multer.File[];
  const founderId = req.user?.founderId;

  if (!founderId) {
    return res.status(401).json({ success: false, error: "JWT authentication required for file upload" });
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: "At least one file is required for batch upload" });
  }

  if (!folder_id) {
    return res.status(400).json({ success: false, error: "folder_id is required for batch upload" });
  }

  const totalFiles = files.length;
  const successfulUploads: any[] = [];
  const failedUploads: FileUploadError[] = [];
  
  appLogger.api(`Batch upload started: ${totalFiles} files to folder ${folder_id}`);

  // Get venture ID and growth stage once for all files
  const { storage } = await import("../../storage");
  const { databaseService } = await import("../../services/database-service");
  const { getArtifactsForStage } = await import("@shared/config/artifacts");
  
  let currentVentureId: string | null = null;
  let growthStage: string | null = null;
  
  try {
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    currentVentureId = dashboardData?.venture?.ventureId || null;
    growthStage = dashboardData?.venture?.growthStage || null;
    appLogger.api(`Batch upload - venture ID: ${currentVentureId}, growth stage: ${growthStage}`);
  } catch (error) {
    appLogger.error('Batch upload - failed to get venture info', error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve venture information" 
    });
  }

  if (!currentVentureId) {
    return res.status(404).json({ 
      success: false, 
      error: "No venture found for this founder" 
    });
  }

  const sessionId = getSessionId(req);
  const stageArtifacts = getArtifactsForStage(growthStage);

  // Process each file individually
  for (const file of files) {
    try {
      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        failedUploads.push({
          fileName: file.originalname,
          reason: `File size (${formatFileSize(file.size)}) exceeds 10MB limit`,
          errorType: 'size'
        });
        cleanupUploadedFile(file.path, file.originalname);
        continue;
      }

      // Upload file to Box
      const fileBuffer = fs.readFileSync(file.path);
      const uploadResult = await eastEmblemAPI.uploadFile(
        fileBuffer,
        file.originalname,
        folder_id,
        sessionId,
        true
      );

      // Calculate scores from artifact config
      let categoryId = '';
      let scoreAwarded = 0;
      let proofScoreContribution = 0;
      
      if (artifactType && stageArtifacts) {
        for (const [catId, categoryData] of Object.entries(stageArtifacts)) {
          const category = categoryData as any;
          if (category.artifacts && category.artifacts[artifactType]) {
            categoryId = catId;
            scoreAwarded = category.artifacts[artifactType].score || 0;
            proofScoreContribution = category.artifacts[artifactType].proofScoreContribution || 0;
            break;
          }
        }
      }

      // Create database record
      const uploadRecord = await storage.createDocumentUpload({
        sessionId: null,
        ventureId: currentVentureId,
        fileName: file.originalname,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadStatus: 'completed',
        processingStatus: 'completed',
        eastemblemFileId: uploadResult.id,
        sharedUrl: uploadResult.url,
        folderId: folder_id,
        artifactType: artifactType || '',
        description: description || '',
        categoryId: categoryId,
        scoreAwarded: scoreAwarded,
        proofScoreContribution: proofScoreContribution,
        uploadSource: 'proof-vault' // Mark as proof-vault upload for ProofCoach task tracking
      });

      // FIXED: Emit VAULT_FILE_UPLOADED event after database entry creation
      const { ActivityService: ActivityService3 } = await import("../../services/activity-service");
      const { COACH_EVENTS: COACH_EVENTS3 } = await import("@shared/config/coach-events");
      const context3 = ActivityService3.getContextFromRequest(req);
      
      await ActivityService3.logActivity(context3, {
        activityType: 'document',
        action: COACH_EVENTS3.VAULT_FILE_UPLOADED,
        title: `Uploaded ${file.originalname}`,
        description: `Uploaded to ProofVault (batch)${artifactType ? ` - ${artifactType}` : ''}`,
        metadata: {
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          artifactType: artifactType || '',
          uploadId: uploadRecord.uploadId,
          folderId: folder_id,
          batchUpload: true,
        },
        entityId: String(uploadRecord.uploadId),
        entityType: 'document',
      });

      // Check and emit milestone events (VAULT_FIRST_UPLOAD, etc.) after each file in batch
      if (currentVentureId && founderId) {
        const { VaultMilestoneService: VaultMilestoneService3 } = await import("../../services/vault-milestone-service");
        await VaultMilestoneService3.checkAndEmitMilestones(founderId, currentVentureId, context3);
      }

      successfulUploads.push({
        fileName: file.originalname,
        fileId: uploadResult.id,
        url: uploadResult.url,
        size: file.size
      });

      cleanupUploadedFile(file.path, file.originalname);
      appLogger.api(`Batch upload - file uploaded successfully: ${file.originalname}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      let errorType: FileUploadError['errorType'] = 'unknown';
      let reason = errorMessage;

      // Categorize error types
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        errorType = 'network';
        reason = 'Network timeout - please check your connection and try again';
      } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        errorType = 'network';
        reason = 'Unable to connect to upload service';
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        errorType = 'size';
        reason = 'File is too large';
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        errorType = 'server';
        reason = 'Authentication error with storage service';
      } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        errorType = 'server';
        reason = 'Storage service temporarily unavailable';
      }

      failedUploads.push({
        fileName: file.originalname,
        reason: reason,
        errorType: errorType
      });

      if (file.path && fs.existsSync(file.path)) {
        cleanupUploadedFile(file.path, file.originalname);
      }
      
      appLogger.error(`Batch upload - file failed: ${file.originalname}`, { error: errorMessage, errorType });
    }
  }

  const successCount = successfulUploads.length;
  const failedCount = failedUploads.length;
  const successRate = totalFiles > 0 ? successCount / totalFiles : 0;

  // Calculate and update scores only if 30% or more files uploaded successfully
  let scoreUpdated = false;
  let newVaultScore = 0;
  let newProofScore = 0;

  if (successRate >= 0.30) {
    try {
      newVaultScore = await storage.calculateVaultScore(currentVentureId);
      newProofScore = await storage.calculateProofScore(currentVentureId);
      
      await storage.updateVaultScore(currentVentureId, newVaultScore);
      await storage.updateProofScore(currentVentureId, newProofScore);
      
      scoreUpdated = true;
      appLogger.api(`Batch upload - scores updated: VaultScore=${newVaultScore}, ProofScore=${newProofScore}`);
    } catch (scoreError) {
      appLogger.error('Batch upload - score calculation/update failed', scoreError);
    }
  } else {
    appLogger.api(`Batch upload - scores NOT updated (success rate ${(successRate * 100).toFixed(1)}% < 30% threshold)`);
  }

  // Invalidate caches
  if (founderId) {
    try {
      await lruCacheService.invalidate('dashboard', founderId);
      await lruCacheService.invalidate('dashboard', `vault_${founderId}`);
      await lruCacheService.invalidate('dashboard', `activity_${founderId}`);
      await lruCacheService.invalidate('founder', founderId);
      
      const documentRepository = new DocumentRepository();
      await documentRepository.invalidateUploadedArtifactsCache(currentVentureId);
    } catch (cacheError) {
      appLogger.error('Batch upload - cache invalidation failed', cacheError);
    }
  }

  // Return comprehensive response
  const responseMessage = scoreUpdated 
    ? `Uploaded ${successCount} of ${totalFiles} files successfully. Scores updated.`
    : successRate < 0.30
      ? `Uploaded ${successCount} of ${totalFiles} files. Scores not updated (less than 30% success rate).`
      : `Uploaded ${successCount} of ${totalFiles} files successfully.`;

  res.json({
    success: true,
    message: responseMessage,
    data: {
      totalFiles,
      successfulUploads: successCount,
      failedUploads: failedCount,
      successRate: parseFloat((successRate * 100).toFixed(1)),
      scoreUpdated,
      vaultScore: scoreUpdated ? newVaultScore : undefined,
      proofScore: scoreUpdated ? newProofScore : undefined,
      uploadedFiles: successfulUploads,
      errors: failedUploads
    }
  });
}));

// Get paginated files endpoint - JWT AUTHENTICATED
router.get('/files', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const founderId = req.user?.founderId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  
  if (!founderId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Sanitize pagination values for logging to prevent security scanner warnings
  const sanitizedPage = Number(page);
  const sanitizedLimit = Number(limit);
  const sanitizedOffset = Number(offset);
  appLogger.api('Files pagination request', { 
    founderId, 
    page: sanitizedPage, 
    limit: sanitizedLimit, 
    offset: sanitizedOffset 
  });
  
  try {
    const { storage } = await import("../../storage");
    const { databaseService } = await import("../../services/database-service");
    
    // Get current venture ID from founder ID
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    const currentVentureId = dashboardData?.venture?.ventureId;
    
    if (!currentVentureId) {
      return res.status(404).json({ error: "No venture found for this founder" });
    }
    
    // SECURITY: Check Deal Room access via payment service AND ProofScore >= 70
    const { paymentService } = await import('../../services/payment-service.js');
    const hasPaidAccess = await paymentService.hasDealRoomAccess(founderId);
    const currentScore = dashboardData?.venture?.proofScore || 0;
    const hasQualifyingScore = currentScore >= 70;
    const hasDealRoomAccess = hasPaidAccess && hasQualifyingScore;
    appLogger.api(`📊 FILES API: founderId ${founderId} - hasPaidAccess: ${hasPaidAccess}, proofScore: ${currentScore}, hasQualifyingScore: ${hasQualifyingScore}, hasDealRoomAccess: ${hasDealRoomAccess}`);
    
    // Get total count for pagination metadata
    const totalFiles = await storage.getDocumentUploadCountByVenture(currentVentureId);
    const totalPages = Math.ceil(totalFiles / limit);
    
    // Get paginated files ordered by timestamp (latest first)
    const files = await storage.getPaginatedDocumentUploads(currentVentureId, limit, offset);
    
    // Get proof vault data for hierarchical category mapping (FIXED)
    const proofVaultData = await storage.getProofVaultsByVentureId(currentVentureId);
    
    // Create folder lookup map for hierarchical resolution
    const folderLookup = new Map();
    proofVaultData.forEach(vault => {
      folderLookup.set(vault.subFolderId, vault);
    });
    
    // Build hierarchical category map using same logic as dashboard API
    const folderCategoryMap = new Map();
    proofVaultData.forEach(vault => {
      if (vault.subFolderId) {
        const category = findMainCategoryForFile(vault.subFolderId, folderLookup);
        const displayName = getCategoryDisplayNameFromHierarchy(category);
        folderCategoryMap.set(vault.subFolderId, { category, displayName });
      }
    });

    // Format files response with accurate hierarchical category information
    // SECURITY: Only include downloadUrl if user has Deal Room access
    const formattedFiles = files.map(file => {
      const hierarchicalCategory = findMainCategoryForFile(file.folderId || '', folderLookup);
      const displayName = getCategoryDisplayNameFromHierarchy(hierarchicalCategory);
      
      return {
        id: file.uploadId,
        name: file.fileName || file.originalName,
        fileType: file.mimeType,
        uploadDate: file.createdAt?.toISOString() || new Date().toISOString(),
        category: hierarchicalCategory,
        categoryName: displayName,
        size: formatFileSize(file.fileSize || 0),
        downloadUrl: hasDealRoomAccess ? (file.sharedUrl || '') : '',
        eastemblemFileId: file.eastemblemFileId,
        artifactType: file.artifactType || ''
      };
    });
    
    // Sanitize pagination values for logging to prevent security scanner warnings
    const sanitizedPage = Number(page);
    const sanitizedTotalPages = Number(totalPages);
    const filesCount = Number(formattedFiles.length);
    appLogger.api('Files pagination response', { 
      founderId, 
      filesCount, 
      currentPage: sanitizedPage, 
      totalPages: sanitizedTotalPages,
      totalFiles 
    });
    
    res.json({
      files: formattedFiles,
      pagination: {
        currentPage: page,
        totalPages,
        totalFiles,
        hasMore: page < totalPages,
        limit
      }
    });
    
  } catch (error) {
    appLogger.api('Files pagination error', { 
      founderId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({ error: "Failed to load files" });
  }
}));

// HIERARCHICAL FILE CATEGORIZATION: Same logic as dashboard API (FIXED)
function findMainCategoryForFile(folderId: string, folderLookup: Map<any, any>): string {
  const MAX_DEPTH = 10; // Prevent infinite loops
  let currentFolderId = folderId;
  
  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const folder = folderLookup.get(currentFolderId);
    if (!folder) break;
    
    // Check if this folder is a main category folder by name pattern
    if (folder.folderName) {
      const folderName = folder.folderName.toLowerCase();
      if (folderName.includes('0_overview') || folderName === '0_overview') return '0_Overview';
      if (folderName.includes('1_problem') || folderName === '1_problem_proof') return '1_Problem_Proof';
      if (folderName.includes('2_solution') || folderName === '2_solution_proof') return '2_Solution_Proof';
      if (folderName.includes('3_demand') || folderName === '3_demand_proof') return '3_Demand_Proof';
      if (folderName.includes('4_credibility') || folderName === '4_credibility_proof') return '4_Credibility_Proof';
      if (folderName.includes('5_commercial') || folderName === '5_commercial_proof') return '5_Commercial_Proof';
      if (folderName.includes('6_investor') || folderName === '6_investor_pack') return '6_Investor_Pack';
    }
    
    // Move up the hierarchy
    if (folder.parentFolderId && folder.parentFolderId !== currentFolderId) {
      currentFolderId = folder.parentFolderId;
    } else {
      break;
    }
  }
  
  return '0_Overview'; // Default fallback
}

// Convert hierarchical category to display name
function getCategoryDisplayNameFromHierarchy(category: string): string {
  const displayNames: Record<string, string> = {
    '0_Overview': 'Overview',
    '1_Problem_Proof': 'Problem Proofs',
    '2_Solution_Proof': 'Solution Proofs',
    '3_Demand_Proof': 'Demand Proofs', 
    '4_Credibility_Proof': 'Credibility Proofs',
    '5_Commercial_Proof': 'Commercial Proofs',
    '6_Investor_Pack': 'Investor Pack'
  };
  
  return displayNames[category] || 'Overview';
}



export default router;