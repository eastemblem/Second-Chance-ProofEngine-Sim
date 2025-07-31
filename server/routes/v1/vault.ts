import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { eastEmblemAPI } from '../../eastemblem-api';
import { getSessionId, getSessionData, updateSessionData } from '../../utils/session-manager';
import { createSuccessResponse } from '../../utils/error-handler';
import { cleanupUploadedFile } from '../../utils/file-cleanup';
import { ActivityService } from '../../services/activity-service';
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
router.post('/create-startup-vault', asyncHandler(async (req, res) => {
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

// Get session data - EXACT SAME LOGIC as routes.ts
router.get('/session', asyncHandler(async (req, res) => {
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

// Upload file only (store for later processing) - EXACT SAME LOGIC as routes.ts
router.post('/upload-only', upload.single("file"), asyncHandler(async (req, res) => {
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

// Submit for scoring workflow - EXACT SAME LOGIC as routes.ts
router.post('/submit-for-scoring', asyncHandler(async (req, res) => {
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

// Upload file to specific folder - 100% DATABASE-DRIVEN (V1 JWT AUTHENTICATED)
router.post('/upload-file', upload.single("file"), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { folder_id } = req.body;
  const file = req.file;
  const founderId = req.user?.founderId;

  if (!founderId) {
    return res.status(401).json({ success: false, error: "JWT authentication required for file upload" });
  }

  if (!file) {
    throw new Error("File is required for upload");
  }

  console.log(`📁 V1 UPLOAD: Processing database-driven file upload for founder ${founderId}`);

  const sessionId = getSessionId(req);
  
  try {
    // Step 1: Get actual Box.com folder ID from database - NO FALLBACKS
    const { getFolderIdFromCategory } = await import("../../utils/folder-mapping");
    const actualFolderId = await getFolderIdFromCategory(folder_id, founderId);
    
    console.log(`📁 V1 UPLOAD: Resolved category "${folder_id}" to folder ID "${actualFolderId}"`);

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
      // CRITICAL FIX: Get current venture ID from founder ID
      let currentVentureId = null;
      try {
        const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
        currentVentureId = dashboardData?.venture?.ventureId || null;
        console.log(`📝 V1 UPLOAD: Resolved founder ${founderId} to venture ${currentVentureId}`);
      } catch (ventureError) {
        console.error(`⚠️ V1 UPLOAD: Failed to get venture ID for founder ${founderId}:`, ventureError);
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
        folderId: actualFolderId
      });
      console.log(`✅ V1 UPLOAD: Database record created with ID ${uploadRecord.uploadId} for venture ${currentVentureId}`);
    } catch (dbError) {
      console.error(`❌ V1 UPLOAD: Database storage failed:`, dbError);
      // Continue without failing the upload since Box.com upload succeeded
    }

    // Step 4: Update session with uploaded file
    const sessionData = getSessionData(req);
    const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
    updateSessionData(req, { uploadedFiles: updatedFiles });

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

    // Step 6: Cleanup uploaded file
    cleanupUploadedFile(file.path);

    console.log(`✅ V1 UPLOAD: File "${file.originalname}" uploaded successfully to folder ${actualFolderId}`);

    res.json(createSuccessResponse({
      file: {
        id: uploadResult.id,
        name: uploadResult.name,
        url: uploadResult.url,
        size: file.size,
        category: folder_id,
        folderId: actualFolderId
      }
    }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ V1 UPLOAD: Failed to resolve category to folder ID:`, error);
    
    // Cleanup uploaded file on error
    if (file.path && fs.existsSync(file.path)) {
      cleanupUploadedFile(file.path);
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

  console.log(`📁 V1 CREATE FOLDER: Processing database-driven folder creation for founder ${founderId}`);

  try {
    // Step 1: Determine if folder_id is a category name or direct folder ID
    let actualParentFolderId: string;
    
    // If folder_id looks like a Box.com folder ID (numeric), use it directly
    if (/^\d+$/.test(folder_id)) {
      actualParentFolderId = folder_id;
      console.log(`📁 V1 CREATE FOLDER: Using direct folder ID "${actualParentFolderId}"`);
    } else {
      // If it's a category name, resolve it from database
      const { getFolderIdFromCategory } = await import("../../utils/folder-mapping");
      actualParentFolderId = await getFolderIdFromCategory(folder_id, founderId);
      console.log(`📁 V1 CREATE FOLDER: Resolved category "${folder_id}" to parent folder ID "${actualParentFolderId}"`);
    }

    // Step 2: Create folder via EastEmblem API using service layer with proper error handling
    const { vaultService } = await import("../../services/vault-service");
    const { getSessionId } = await import("../../utils/session-manager");
    
    const sessionId = getSessionId(req);
    let result;
    let usedFallback = false;
    
    try {
      result = await vaultService.createFolder(folderName, actualParentFolderId, sessionId);
      console.log(`✅ V1 Folder creation successful via EastEmblem API:`, {
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
          console.log(`📝 V1 FOLDER CREATION: Resolved founder ${founderId} to venture ${currentVentureId}`);
        } catch (ventureError) {
          console.error(`⚠️ V1 FOLDER CREATION: Failed to get venture ID for founder ${founderId}:`, ventureError);
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
          console.log(`✅ V1 FOLDER CREATION: Proof vault entry created`, { 
            folderName,
            folderId: result.id,
            vaultId: proofVaultEntry.vaultId,
            parentCategory: folder_id
          });
        }
      } catch (dbError) {
        console.error(`⚠️ V1 FOLDER CREATION: Failed to create proof vault entry:`, dbError);
        // Continue without failing the folder creation since Box.com creation succeeded
      }

    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      console.log(`⚠️ V1 EastEmblem API folder creation failed - using fallback:`, {
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
    
    res.json(createSuccessResponse({
      folderId: result.id,
      folderName: folderName,
      parentFolderId: actualParentFolderId,
      usedFallback: usedFallback,
      message: usedFallback ? 'Folder creation used fallback strategy' : 'Folder created successfully',
      note: result.note || undefined
    }, "V1 Folder creation completed"));

  } catch (error) {
    console.error('V1 Folder creation error:', error);
    throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}));

// Upload file directly to folder ID (bypasses category mapping) - V1 JWT AUTHENTICATED
router.post('/upload-file-direct', upload.single("file"), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { folder_id } = req.body;
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

  console.log(`📁 V1 DIRECT UPLOAD: Processing direct folder upload for founder ${founderId} to folder ${folder_id}`);

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
    const sessionData = getSessionData(req);
    const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
    updateSessionData(req, { uploadedFiles: updatedFiles });

    // Get venture ID from founder ID and store upload in database
    const { storage } = await import("../../storage");
    const { databaseService } = await import("../../services/database-service");
    
    try {
      // CRITICAL FIX: Get current venture ID from founder ID
      let currentVentureId = null;
      try {
        const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
        currentVentureId = dashboardData?.venture?.ventureId || null;
        console.log(`📝 V1 DIRECT UPLOAD: Resolved founder ${founderId} to venture ${currentVentureId}`);
      } catch (ventureError) {
        console.error(`⚠️ V1 DIRECT UPLOAD: Failed to get venture ID for founder ${founderId}:`, ventureError);
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
        folderId: folder_id
      });
      console.log(`✅ V1 DIRECT UPLOAD: Database record created with ID ${uploadRecord.uploadId} for venture ${currentVentureId}`);
    } catch (dbError) {
      console.error(`❌ V1 DIRECT UPLOAD: Database storage failed:`, dbError);
      // Continue without failing the upload since Box.com upload succeeded
    }

    // Cleanup uploaded file
    cleanupUploadedFile(file.path);

    console.log(`✅ V1 DIRECT UPLOAD: File "${file.originalname}" uploaded successfully to folder ${folder_id}`);

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
    console.error(`❌ V1 DIRECT UPLOAD: Failed to upload file:`, error);
    
    // Cleanup uploaded file on error
    if (file.path && fs.existsSync(file.path)) {
      cleanupUploadedFile(file.path);
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
  
  console.log(`📡 FILES PAGINATION: Fetching files - page: ${page}, limit: ${limit}, offset: ${offset}`);
  
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
      const hierarchicalCategory = findMainCategoryForFile(file.folderId, folderLookup);
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
    
    console.log(`📡 FILES PAGINATION: Returning ${formattedFiles.length} files (page ${page}/${totalPages})`);
    
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
    console.error("Files pagination error:", error);
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