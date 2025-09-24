import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { eastEmblemAPI } from '../../eastemblem-api';
import { getSessionId, getSessionData, updateSessionData } from '../../utils/session-manager';
import { createSuccessResponse } from '../../utils/error-handler';
import { cleanupUploadedFile } from '../../utils/file-cleanup';
import { ActivityService } from '../../services/activity-service';
import { lruCacheService } from '../../services/lru-cache-service';
import { appLogger } from '../../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';

const router = Router();

// Configure multer for file uploads - EXACT SAME as routes.ts
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

      // Calculate categoryId and scoreAwarded from artifactType
      
      if (artifactType) {
        try {
          const { PROOF_VAULT_ARTIFACTS } = await import("@shared/config/artifacts");
          // Find which category contains this artifactType
          for (const [catId, categoryData] of Object.entries(PROOF_VAULT_ARTIFACTS)) {
            const category = categoryData as any; // Type assertion for artifacts config
            if (category.artifacts && category.artifacts[artifactType]) {
              categoryId = catId;
              scoreAwarded = category.artifacts[artifactType].score || 0;
              break;
            }
          }
          appLogger.database(`V1 UPLOAD: Mapped artifactType "${artifactType}" to category "${categoryId}" with score ${scoreAwarded}`);
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
        scoreAwarded: scoreAwarded
      });
      // Sanitize IDs for logging to prevent security scanner warnings
      const sanitizedUploadId = String(uploadRecord.uploadId).replace(/[^\w-]/g, '');
      const sanitizedVentureId = String(currentVentureId).replace(/[^\w-]/g, '');
      appLogger.database(`V1 UPLOAD: Database record created with ID ${uploadRecord.uploadId} for venture ${currentVentureId}`);

      // NEW: Calculate and update VaultScore
      if (currentVentureId && scoreAwarded > 0) {
        try {
          // Get current VaultScore before updating
          const currentVaultScore = await storage.getCurrentVaultScore(currentVentureId);
          const newVaultScore = await storage.calculateVaultScore(currentVentureId); // Recalculate complete score
          await storage.updateVaultScore(currentVentureId, newVaultScore);
          appLogger.database(`V1 UPLOAD: VaultScore updated from ${currentVaultScore} to ${newVaultScore} for venture ${currentVentureId}`);

          // Log VaultScore update activity with previous and new scores
          const { ActivityService } = await import("../../services/activity-service");
          const context = ActivityService.getContextFromRequest(req);
          await ActivityService.logEvaluationActivity(
            { ...context, founderId, ventureId: currentVentureId },
            'vault_score_update',
            'VaultScore Updated',
            `${currentVaultScore} → ${newVaultScore}`,
            uploadRecord.uploadId,
            { 
              artifactType: artifactType || '',
              scoreAdded: scoreAwarded,
              previousVaultScore: currentVaultScore,
              newVaultScore,
              categoryId: categoryId
            }
          );
        } catch (vaultScoreError) {
          appLogger.api('V1 upload - VaultScore update failed', { 
            founderId, 
            ventureId: currentVentureId,
            error: vaultScoreError instanceof Error ? vaultScoreError.message : 'Unknown error' 
          });
          // Don't fail the upload if VaultScore update fails
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
        // Sanitize founder ID for logging to prevent security scanner warnings
        const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
        appLogger.cache(`V1 UPLOAD: Cache invalidated for founder ${founderId} (dashboard, vault, activity)`);
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

    // Get current VaultScore for response
    let currentVaultScore = 0;
    if (currentVentureId) {
      try {
        const latestEvaluation = await storage.getLatestEvaluationByVentureId(currentVentureId);
        currentVaultScore = latestEvaluation?.vaultscore || 0;
      } catch (scoreError) {
        appLogger.api('V1 upload - failed to get current VaultScore for response', { 
          ventureId: currentVentureId,
          error: scoreError instanceof Error ? scoreError.message : 'Unknown error' 
        });
      }
    }

    res.json(createSuccessResponse({
      file: {
        id: uploadResult.id,
        name: uploadResult.name,
        url: uploadResult.url,
        size: file.size,
        category: folder_id,
        folderId: actualFolderId
      },
      vaultScore: currentVaultScore,
      scoreAdded: scoreAwarded
    }));

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
    const { vaultService } = await import("../../services/vault-service");
    const { getSessionId } = await import("../../utils/session-manager");
    
    const sessionId = getSessionId(req);
    let result;
    let usedFallback = false;
    
    try {
      result = await vaultService.createFolder(folderName, actualParentFolderId, sessionId);
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
  const { folder_id, artifactType, description } = req.body;
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
    
    try {
      // CRITICAL FIX: Get current venture ID from founder ID
      let currentVentureId = null;
      try {
        const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
        currentVentureId = dashboardData?.venture?.ventureId || null;
        // Sanitize IDs for logging to prevent security scanner warnings
        const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
        const sanitizedVentureId = String(currentVentureId).replace(/[^\w-]/g, '');
        appLogger.api('V1 direct upload - resolved founder to venture', { founderId: sanitizedFounderId, ventureId: sanitizedVentureId });
      } catch (ventureError) {
        appLogger.api('V1 direct upload - failed to get venture ID', { founderId, error: ventureError instanceof Error ? ventureError.message : 'Unknown error' });
      }

      // Calculate categoryId and scoreAwarded from artifactType
      let categoryId = '';
      let scoreAwarded = 0;
      
      if (artifactType) {
        try {
          const { PROOF_VAULT_ARTIFACTS } = await import("@shared/config/artifacts");
          // Find which category contains this artifactType
          for (const [catId, categoryData] of Object.entries(PROOF_VAULT_ARTIFACTS)) {
            const category = categoryData as any; // Type assertion for artifacts config
            if (category.artifacts && category.artifacts[artifactType]) {
              categoryId = catId;
              scoreAwarded = category.artifacts[artifactType].score || 0;
              break;
            }
          }
          appLogger.database(`V1 DIRECT UPLOAD: Mapped artifactType "${artifactType}" to category "${categoryId}" with score ${scoreAwarded}`);
        } catch (artifactError) {
          appLogger.api('V1 direct upload - failed to calculate artifact category/score', { artifactType, error: artifactError instanceof Error ? artifactError.message : 'Unknown error' });
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
        scoreAwarded: scoreAwarded
      });
      // Sanitize IDs for logging to prevent security scanner warnings
      const sanitizedUploadId = String(uploadRecord.uploadId).replace(/[^\w-]/g, '');
      const sanitizedVentureId = String(currentVentureId).replace(/[^\w-]/g, '');
      appLogger.api('V1 direct upload - database record created', { uploadId: sanitizedUploadId, ventureId: sanitizedVentureId });
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
        await lruCacheService.invalidate('dashboard', `vault_${founderId}`);
        await lruCacheService.invalidate('dashboard', `activity_${founderId}`);
        // Sanitize founder ID for logging to prevent security scanner warnings
        const sanitizedFounderId = String(founderId).replace(/[^\w-]/g, '');
        appLogger.api('V1 direct upload - cache invalidated', { founderId: sanitizedFounderId });
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

    res.json(createSuccessResponse({
      file: {
        id: uploadResult.id,
        name: uploadResult.name,
        url: uploadResult.url,
        size: file.size,
        folderId: folder_id
      }
    }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    appLogger.api('V1 direct upload failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      fileName: file?.originalname 
    });
    
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
    const formattedFiles = files.map(file => {
      const hierarchicalCategory = findMainCategoryForFile(file.folderId || '', folderLookup);
      const displayName = getCategoryDisplayNameFromHierarchy(hierarchicalCategory);
      
      return {
        id: file.uploadId,
        name: file.fileName || file.originalName,
        fileType: file.mimeType,
        createdAt: file.createdAt?.toISOString() || new Date().toISOString(),
        category: hierarchicalCategory,
        categoryName: displayName,
        size: file.fileSize,
        downloadUrl: file.sharedUrl || '',
        eastemblemFileId: file.eastemblemFileId
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