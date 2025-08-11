import { Router } from "express";
import { vaultService } from "../services/vault-service";
import { eastEmblemAPI } from "../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../utils/session-manager";
import { asyncHandler, createSuccessResponse } from "../utils/error-handler";
import { cleanupUploadedFile } from "../utils/file-cleanup";
import { requireFields } from "../middleware/auth";
import { ActivityService } from "../services/activity-service";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Helper function to get folder display name
const getFolderDisplayName = (folderName: string) => {
  const folderMap: Record<string, string> = {
    '0_Overview': 'Overview',
    '1_Problem_Proof': 'Problem Proofs',
    '2_Solution_Proof': 'Solution Proofs', 
    '3_Demand_Proof': 'Demand Proofs',
    '4_Credibility_Proof': 'Credibility Proofs',
    '5_Commercial_Proof': 'Commercial Proofs',
    '6_Investor_Pack': 'Investor Pack'
  };
  return folderMap[folderName] || folderName;
};

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
      
      while (fs.existsSync(path.join(uploadDir, filename))) {
        counter++;
        filename = `${baseName}-${counter}${ext}`;
      }
      
      cb(null, filename);
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
      console.log(`Rejected file type: ${file.mimetype} for file: ${file.originalname}`);
      cb(new Error(`File type ${file.mimetype} is not supported. Please upload PDF, MS Office documents (DOC, DOCX, XLS, XLSX, PPT, PPTX), images (PNG, JPG, JPEG, BMP, GIF, TIF, TIFF, SVG, WebP), videos (MP4, MOV, AVI, WebM), audio (MP3, WAV, AAC), or other business documents (TXT, CSV, XML, RTF, etc.).`));
    }
  },
});

// Create startup vault - ONBOARDING ONLY: Creates initial folder structure during onboarding
router.post("/create-startup-vault", requireFields(['startupName']), asyncHandler(async (req, res) => {
  const { startupName } = req.body;
  const sessionId = getSessionId(req);
  
  console.log(`📁 ONBOARDING: Creating startup vault structure for "${startupName}"`);
  console.log(`🔄 NOTE: This endpoint is for onboarding only - folder uploads use individual creation`);
  
  const folderStructure = await vaultService.createStartupVault(startupName, sessionId);
  
  updateSessionData(req, {
    folderStructure,
    startupName,
    uploadedFiles: [],
  });

  res.json(createSuccessResponse({
    folderStructure,
    sessionId,
  }, "Startup vault created successfully"));
}));

// Get session data
router.get("/session", asyncHandler(async (req, res) => {
  const sessionData = getSessionData(req);
  const sessionId = getSessionId(req);

  res.json(createSuccessResponse({
    sessionId,
    data: sessionData,
  }));
}));

// Upload file only (store for later processing)
router.post("/upload-only", upload.single("file"), asyncHandler(async (req, res) => {
  const file = req.file;
  
  if (!file) {
    throw new Error("File is required for upload");
  }

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
router.post("/submit-for-scoring", asyncHandler(async (req, res) => {
  if (!eastEmblemAPI.isConfigured()) {
    throw new Error("EastEmblem API not configured");
  }

  const result = await vaultService.completeScoring(req);
  const sessionId = getSessionId(req);

  res.json(createSuccessResponse({
    ...result,
    sessionId,
  }, "Scoring workflow completed successfully"));
}));

// Upload file to specific folder - 100% DATABASE-DRIVEN
router.post("/upload-file", upload.single("file"), requireFields(['folder_id']), asyncHandler(async (req, res) => {
  const { folder_id } = req.body;
  const file = req.file;
  const founderId = req.session?.founderId;

  if (!founderId) {
    return res.status(401).json({ success: false, error: "Authentication required for file upload" });
  }

  if (!file) {
    throw new Error("File is required for upload");
  }

  appLogger.business('Processing 100% database-driven file upload', { 
    fileName: file.originalname, 
    categoryName: folder_id,
    founderId
  });

  const sessionId = getSessionId(req);
  
  try {
    // Step 1: Get actual Box.com folder ID from database - NO FALLBACKS
    const { getFolderIdFromCategory } = await import("../utils/folder-mapping");
    const actualFolderId = await getFolderIdFromCategory(folder_id, founderId);
    
    appLogger.business('Resolved category to folder ID from database', { 
      categoryName: folder_id, 
      actualFolderId,
      founderId
    });

    // Step 2: Upload to Box.com using resolved folder ID
    const fileBuffer = fs.readFileSync(file.path);
    const uploadResult = await vaultService.uploadFileToVault(
      fileBuffer,
      file.originalname,
      actualFolderId,
      sessionId
    );

    // Step 3: Update session with uploaded file
    const sessionData = getSessionData(req);
    const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
    updateSessionData(req, { uploadedFiles: updatedFiles });

    // Step 4: Track file upload in database
    const { storage } = await import("../storage");
    const ventures = await storage.getVenturesByFounderId(founderId);
    const latestVenture = ventures[0];
    
    if (latestVenture) {
      await storage.createDocumentUpload({
        ventureId: latestVenture.ventureId,
        fileName: uploadResult.name || file.originalname,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadStatus: "completed",
        processingStatus: "pending",
        eastemblemFileId: uploadResult.id,
        sharedUrl: uploadResult.url,
        folderId: actualFolderId
      });

      appLogger.business('File upload completed successfully', { 
        fileName: file.originalname,
        uploadId: uploadResult.id,
        category: folder_id,
        folderId: actualFolderId
      });
    }

    // Step 5: Cleanup uploaded file
    cleanupUploadedFile(file.path);

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
    appLogger.business('Failed to resolve category to folder ID', { 
      categoryName: folder_id, 
      founderId,
      error: errorMessage
    });
    
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

// Create folders - 100% DATABASE-DRIVEN folder creation endpoint
router.post("/create-folder", requireFields(['folderName', 'folder_id']), asyncHandler(async (req, res) => {
  const { folderName, folder_id, ventureId } = req.body;
  const founderId = req.session?.founderId;

  if (!founderId) {
    return res.status(401).json({ success: false, error: "Authentication required for folder creation" });
  }

  appLogger.business('Processing 100% database-driven folder creation', { 
    folderName, 
    categoryName: folder_id,
    founderId
  });

  // Validate folder name
  if (!folderName || typeof folderName !== 'string' || folderName.trim().length === 0) {
    throw new Error("Valid folder name is required");
  }
  
  if (folderName.length > 50) {
    throw new Error("Folder name must be 50 characters or less");
  }

  const sessionId = getSessionId(req);
  
  try {
    // Step 1: Get actual Box.com parent folder ID from database - NO FALLBACKS
    const { getFolderIdFromCategory } = await import("../utils/folder-mapping");
    const actualParentFolderId = await getFolderIdFromCategory(folder_id, founderId);
    
    appLogger.business('Resolved category to parent folder ID from database', { 
      categoryName: folder_id, 
      actualParentFolderId,
      founderId
    });

    // Step 2: Create folder via EastEmblem API
    let result;
    let usedFallback = false;
    
    try {
      result = await vaultService.createFolder(folderName, actualParentFolderId, sessionId);
      appLogger.business('Folder creation successful via EastEmblem API', { 
        folderName,
        folderId: result.id
      });
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      appLogger.business('EastEmblem API folder creation failed - using fallback', { 
        folderName,
        error: errorMessage
      });
      
      // Fallback: Use parent folder for uploads
      result = {
        id: actualParentFolderId,
        name: folderName,
        url: `https://app.box.com/folder/${actualParentFolderId}`,
        note: `Files will be uploaded to the ${getFolderDisplayName(folder_id)} category folder`
      };
      usedFallback = true;
    }

    // Step 3: Store folder mapping in proof_vault table
    const { storage } = await import("../storage");
    let targetVenture = null;
    
    // Use ventureId from request or get from founder
    if (ventureId) {
      targetVenture = await storage.getVenture(ventureId);
    } else {
      const ventures = await storage.getVenturesByFounderId(founderId);
      targetVenture = ventures.length > 0 ? ventures[0] : null;
    }
    
    if (targetVenture && result.id) {
      const proofVaultData = {
        ventureId: targetVenture.ventureId,
        artefactType: 'Technical Documentation' as const,
        parentFolderId: actualParentFolderId,
        subFolderId: result.id.toString(),
        sharedUrl: result.url || '',
        folderName: folderName,
        description: `Subfolder created in ${getFolderDisplayName(folder_id)}`
      };
      
      const proofVaultEntry = await storage.createProofVault(proofVaultData);
      appLogger.business('Folder mapping stored in database', { 
        folderName,
        folderId: result.id,
        vaultId: proofVaultEntry.vaultId
      });

      // Track folder creation activity
      await ActivityService.logActivity(
        {
          founderId,
          ventureId: targetVenture.ventureId,
          sessionId: req.sessionID,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        },
        {
          activityType: 'document',
          action: 'folder_created',
          title: `Created folder "${folderName}"`,
          description: `Created folder "${folderName}" in ${getFolderDisplayName(folder_id)}`
        }
      );
    }

    res.json(createSuccessResponse({
      folder: {
        id: result.id,
        name: result.name,
        url: result.url,
        note: result.note,
        usedFallback,
        category: folder_id,
        parentFolderId: actualParentFolderId
      }
    }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    appLogger.business('Failed to create folder', { 
      folderName,
      categoryName: folder_id,
      founderId,
      error: errorMessage
    });
    
    return res.status(400).json({ 
      success: false, 
      error: errorMessage
    });
  }
}));

// Multiple file upload endpoint
router.post("/upload-multiple", upload.array('files', 20), asyncHandler(async (req, res) => {
  const founderId = req.session?.founderId;
  const files = req.files as Express.Multer.File[];

  if (!founderId) {
    return res.status(401).json({ success: false, error: "Authentication required for file upload" });
  }

  if (!files || files.length === 0) {
    throw new Error("At least one file is required for upload");
  }

  appLogger.business('Processing 100% database-driven multiple file upload', { 
    fileCount: files.length,
    founderId
  });

  const uploadResults = [];
  const errors = [];

  for (const file of files) {
    try {
      // Extract folder_id from file metadata or use default
      const folder_id = req.body.folder_id || '0_Overview';
      
      // Use the same database-driven approach as single file upload
      const { getFolderIdFromCategory } = await import("../utils/folder-mapping");
      const actualFolderId = await getFolderIdFromCategory(folder_id, founderId);
      
      const sessionId = getSessionId(req);
      const fileBuffer = fs.readFileSync(file.path);
      
      const uploadResult = await vaultService.uploadFileToVault(
        fileBuffer,
        file.originalname,
        actualFolderId,
        sessionId
      );

      uploadResults.push({
        ...uploadResult,
        category: folder_id,
        folderId: actualFolderId
      });

      // Cleanup uploaded file
      cleanupUploadedFile(file.path);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        fileName: file.originalname,
        error: errorMessage
      });
      
      // Cleanup failed upload file
      if (file.path && fs.existsSync(file.path)) {
        cleanupUploadedFile(file.path);
      }
    }
  }

  res.json(createSuccessResponse({
    uploaded: uploadResults,
    failed: errors,
    summary: {
      total: files.length,
      successful: uploadResults.length,
      failed: errors.length
    }
  }));
}));

// Add file remove endpoint  
router.delete("/remove-file/:fileId", asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  
  if (!req.session?.founderId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { storage } = await import("../storage");
    
    // Verify file belongs to user's venture
    const ventures = await storage.getFounderVentures(req.session.founderId);
    const latestVenture = ventures.length > 0 ? ventures[ventures.length - 1] : null;
    
    if (!latestVenture) {
      return res.status(404).json({ error: "No venture found" });
    }

    const document = await storage.getDocumentUpload(fileId);
    if (!document || document.ventureId !== latestVenture.ventureId) {
      return res.status(404).json({ error: "File not found or access denied" });
    }

    await storage.deleteDocumentUpload(fileId);
    
    res.json(createSuccessResponse({}, "File removed successfully"));
  } catch (error) {
    appLogger.business('Failed to remove file', { fileId, error });
    res.status(500).json({ error: "Failed to remove file" });
  }
}));

export default router;