import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { asyncHandler, createSuccessResponse } from "../../utils/error-handler";
import { fileUploadRateLimit } from "../../middleware/security";
import { validateRequestComprehensive, validationSchemas } from "../../middleware/comprehensive-validation";
import { businessLogicService } from "../../services/business-logic-service";
import { eastEmblemAPI } from "../../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../../utils/session-manager";
import { cleanupUploadedFile } from "../../utils/file-cleanup";
import { ActivityService } from "../../services/activity-service";
import { COACH_EVENTS } from "../../../shared/config/coach-events";
import { storage } from "../../storage";
import { db } from "../../db";
import { userActivity } from "../../../shared/schema";
import { and, eq } from "drizzle-orm";

const router = express.Router();

// Configure multer for vault file uploads
const vaultUpload = multer({
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

// Single file upload endpoint - extracted from main routes.ts
router.post("/upload", 
  fileUploadRateLimit,
  vaultUpload.single("file"),
  validateRequestComprehensive({ 
    body: validationSchemas.vault.fileUpload,
    files: validationSchemas.file.document 
  }),
  asyncHandler(async (req, res) => {
  if (!eastEmblemAPI.isConfigured()) {
    return res.status(500).json({ error: "EastEmblem API not configured" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { category, folder_id } = req.body;
  const sessionId = getSessionId(req);
  const founderId = req.session?.founderId || 'unknown';

  console.log(`📤 VAULT UPLOAD: Processing file ${req.file.originalname} for category ${category}, folder_id: ${folder_id || 'not provided'}`);

  try {
    // Get session data for folder and context
    const sessionData = await getSessionData(sessionId);
    const ventureId = sessionData?.founderData?.ventureId || 'unknown';

    // Use business logic service for file upload processing
    // Pass folder_id if provided, otherwise service will use category lookup
    const uploadResult = await businessLogicService.processFileUpload(
      req.file,
      category,
      founderId,
      sessionId,
      folder_id
    );

    console.log(`✅ VAULT UPLOAD: File uploaded successfully`, uploadResult);

    // Get activity context
    const context = ActivityService.getContextFromRequest(req);

    // Track coach event: vault file uploaded
    await ActivityService.logActivity(context, {
      activityType: 'document',
      action: COACH_EVENTS.VAULT_FILE_UPLOADED,
      title: `Uploaded ${req.file.originalname}`,
      description: `Uploaded to ProofVault category: ${category}`,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        category: category,
        uploadId: uploadResult.id,
        artifactType: category,
      },
      entityId: uploadResult.id,
      entityType: 'document',
    });

    // Track CSV upload event for validation map milestone
    if (req.file.mimetype === 'text/csv' || req.file.originalname.toLowerCase().endsWith('.csv')) {
      await ActivityService.logActivity(context, {
        activityType: 'document',
        action: COACH_EVENTS.VALIDATION_CSV_UPLOADED,
        title: 'Validation CSV Uploaded',
        description: 'Uploaded validation map CSV to ProofVault',
        metadata: {
          fileName: req.file.originalname,
          category: category,
          uploadId: uploadResult.id,
        },
        entityId: uploadResult.id,
        entityType: 'document',
      });
    }

    // Check upload milestones if we have a valid venture ID
    if (ventureId !== 'unknown' && founderId) {
      const allUploads = await storage.getDocumentUploadsByVentureId(ventureId);
      const uploadCount = allUploads?.length || 0;

      // Helper to check if milestone already logged
      const hasMilestone = async (action: string) => {
        const activities = await db.select()
          .from(userActivity)
          .where(and(
            eq(userActivity.founderId, founderId),
            eq(userActivity.action, action)
          ))
          .limit(1);
        return activities.length > 0;
      };

      // Emit milestone events with duplicate prevention
      if (uploadCount >= 50 && !(await hasMilestone(COACH_EVENTS.VAULT_50_FILES_UPLOADED))) {
        await ActivityService.logActivity(context, {
          activityType: 'document',
          action: COACH_EVENTS.VAULT_50_FILES_UPLOADED,
          title: '50 Files Uploaded',
          description: 'Reached 50 files in ProofVault - Comprehensive proof vault milestone!',
          metadata: { uploadCount },
        });
      } else if (uploadCount >= 30 && !(await hasMilestone(COACH_EVENTS.VAULT_30_FILES_UPLOADED))) {
        await ActivityService.logActivity(context, {
          activityType: 'document',
          action: COACH_EVENTS.VAULT_30_FILES_UPLOADED,
          title: '30 Files Uploaded',
          description: 'Reached 30 files in ProofVault',
          metadata: { uploadCount },
        });
      } else if (uploadCount >= 20 && !(await hasMilestone(COACH_EVENTS.VAULT_20_FILES_UPLOADED))) {
        await ActivityService.logActivity(context, {
          activityType: 'document',
          action: COACH_EVENTS.VAULT_20_FILES_UPLOADED,
          title: '20 Files Uploaded',
          description: 'Reached 20 files in ProofVault',
          metadata: { uploadCount },
        });
      } else if (uploadCount >= 10 && !(await hasMilestone(COACH_EVENTS.VAULT_10_FILES_UPLOADED))) {
        await ActivityService.logActivity(context, {
          activityType: 'document',
          action: COACH_EVENTS.VAULT_10_FILES_UPLOADED,
          title: '10 Files Uploaded',
          description: 'Reached 10 files in ProofVault',
          metadata: { uploadCount },
        });
      } else if (uploadCount >= 1 && !(await hasMilestone(COACH_EVENTS.VAULT_FIRST_UPLOAD))) {
        await ActivityService.logActivity(context, {
          activityType: 'document',
          action: COACH_EVENTS.VAULT_FIRST_UPLOAD,
          title: 'First ProofVault Upload',
          description: 'Completed your first upload to ProofVault',
          metadata: { uploadCount },
        });
      }
    }

    // Cleanup local file
    cleanupUploadedFile(req.file.path, req.file.originalname, "upload complete");

    res.json(createSuccessResponse({
      uploadId: uploadResult.id,
      fileName: req.file.originalname,
      sharedUrl: uploadResult.url || uploadResult.download_url,
      category: category,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    }, "File uploaded successfully"));

  } catch (error) {
    console.error("❌ VAULT UPLOAD: Upload failed:", error);

    // Cleanup on error
    if (req.file?.path) {
      cleanupUploadedFile(req.file.path, req.file.originalname, "upload failed");
    }

    res.status(500).json({ 
      error: "Upload failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Multiple file upload endpoint - extracted from main routes.ts
router.post("/upload-multiple", vaultUpload.array("files", 10), asyncHandler(async (req, res) => {
  if (!eastEmblemAPI.isConfigured()) {
    return res.status(500).json({ error: "EastEmblem API not configured" });
  }

  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const { category, folder_id } = req.body;
  const sessionId = getSessionId(req);
  const founderId = req.session?.founderId || 'unknown';

  console.log(`📤 VAULT MULTIPLE UPLOAD: Processing ${req.files.length} files for category ${category}, folder_id: ${folder_id || 'not provided'}`);

  try {
    const sessionData = await getSessionData(sessionId);
    const ventureId = sessionData?.founderData?.ventureId || 'unknown';

    // Use provided folder_id if available, otherwise fall back to category lookup
    let folderId: string;
    if (folder_id) {
      folderId = folder_id;
      console.log(`📁 Using provided folder_id: ${folderId} for batch upload`);
    } else {
      if (!sessionData?.folderStructure) {
        throw new Error("Folder structure not found in session");
      }
      folderId = getCategoryFolderId(category, sessionData);
      console.log(`📁 Using category-based folder_id: ${folderId} for category: ${category}`);
      
      if (!folderId) {
        throw new Error(`Invalid category: ${category}`);
      }
    }

    const results = [];
    const errors = [];
    const context = ActivityService.getContextFromRequest(req);

    // Process files sequentially for stability
    for (const file of req.files) {
      try {
        // Read file as buffer
        const fileBuffer = fs.readFileSync(file.path);
        
        const uploadResult = await eastEmblemAPI.uploadFile(
          fileBuffer,
          file.originalname,
          folderId
        );

        // Track coach event: vault file uploaded
        await ActivityService.logActivity(context, {
          activityType: 'document',
          action: COACH_EVENTS.VAULT_FILE_UPLOADED,
          title: `Uploaded ${file.originalname}`,
          description: `Uploaded to ProofVault category: ${category}`,
          metadata: {
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            category: category,
            uploadId: uploadResult.id,
            artifactType: category,
          },
          entityId: uploadResult.id,
          entityType: 'document',
        });

        results.push({
          uploadId: uploadResult.id,
          fileName: file.originalname,
          sharedUrl: uploadResult.url || uploadResult.download_url,
          folderId: folderId,
          category: category,
          fileSize: file.size,
          mimeType: file.mimetype,
          status: 'success'
        });

        // Cleanup successful upload
        cleanupUploadedFile(file.path, file.originalname, "upload complete");

      } catch (error) {
        console.error(`❌ VAULT UPLOAD: Failed to upload ${file.originalname}:`, error);

        errors.push({
          fileName: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        });

        // Cleanup failed upload
        cleanupUploadedFile(file.path, file.originalname, "upload failed");
      }
    }

    // Check upload milestones after batch upload
    if (ventureId !== 'unknown' && results.length > 0) {
      const allUploads = await storage.getDocumentUploadsByVentureId(ventureId);
      const uploadCount = allUploads?.length || 0;

      // Emit milestone events only once per batch
      if (uploadCount >= 30 && uploadCount - results.length < 30) {
        await ActivityService.logActivity(context, {
          activityType: 'document',
          action: COACH_EVENTS.VAULT_30_FILES_UPLOADED,
          title: '30 Files Uploaded',
          description: 'Reached 30 files in ProofVault',
          metadata: { uploadCount },
        });
      } else if (uploadCount >= 20 && uploadCount - results.length < 20) {
        await ActivityService.logActivity(context, {
          activityType: 'document',
          action: COACH_EVENTS.VAULT_20_FILES_UPLOADED,
          title: '20 Files Uploaded',
          description: 'Reached 20 files in ProofVault',
          metadata: { uploadCount },
        });
      } else if (uploadCount >= 10 && uploadCount - results.length < 10) {
        await ActivityService.logActivity(context, {
          activityType: 'document',
          action: COACH_EVENTS.VAULT_10_FILES_UPLOADED,
          title: '10 Files Uploaded',
          description: 'Reached 10 files in ProofVault',
          metadata: { uploadCount },
        });
      } else if (uploadCount === 1 && results.length === 1) {
        await ActivityService.logActivity(context, {
          activityType: 'document',
          action: COACH_EVENTS.VAULT_FIRST_UPLOAD,
          title: 'First ProofVault Upload',
          description: 'Completed your first upload to ProofVault',
          metadata: { uploadCount: 1 },
        });
      }
    }

    console.log(`✅ VAULT MULTIPLE UPLOAD: ${results.length} successful, ${errors.length} failed`);

    res.json(createSuccessResponse({
      successful: results,
      failed: errors,
      totalProcessed: req.files.length,
      successCount: results.length,
      failureCount: errors.length
    }, `Processed ${req.files.length} files`));

  } catch (error) {
    console.error("❌ VAULT MULTIPLE UPLOAD: Batch upload failed:", error);

    // Cleanup all files on batch error
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        cleanupUploadedFile(file.path, file.originalname, "batch upload failed");
      }
    }

    res.status(500).json({ 
      error: "Batch upload failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Folder creation endpoint - extracted from main routes.ts
router.post("/create-folder", asyncHandler(async (req, res) => {
  if (!eastEmblemAPI.isConfigured()) {
    return res.status(500).json({ error: "EastEmblem API not configured" });
  }

  const { folderName, parentCategory } = req.body;
  const sessionId = getSessionId(req);

  if (!folderName || !parentCategory) {
    return res.status(400).json({ error: "Folder name and parent category are required" });
  }

  console.log(`📁 VAULT FOLDER: Creating folder ${folderName} in category ${parentCategory}`);

  try {
    const sessionData = await getSessionData(sessionId);

    if (!sessionData?.folderStructure) {
      throw new Error("Folder structure not found in session");
    }

    // Get parent folder ID from category
    const parentFolderId = getCategoryFolderId(parentCategory, sessionData);

    if (!parentFolderId) {
      throw new Error(`Invalid parent category: ${parentCategory}`);
    }

    // Create folder using EastEmblem API
    const folderResult = await eastEmblemAPI.createFolder(folderName, parentFolderId);

    console.log(`✅ VAULT FOLDER: Created successfully`, folderResult);

    // Track folder creation activity
    const context = ActivityService.getContextFromRequest(req);
    await ActivityService.logActivity(context, {
      activityType: 'navigation',
      action: 'create_folder',
      title: folderName,
      description: `Created folder in ${parentCategory}`,
      metadata: {
        folderName: folderName,
        parentCategory: parentCategory,
        parentFolderId: parentFolderId,
        folderId: folderResult.id
      },
      entityId: folderResult.id,
      entityType: 'folder',
    });

    res.json(createSuccessResponse({
      folderId: folderResult.id,
      folderName: folderName,
      parentCategory: parentCategory,
      parentFolderId: parentFolderId,
      folderUrl: folderResult.url || `https://app.box.com/folder/${folderResult.id}`
    }, "Folder created successfully"));

  } catch (error) {
    console.error("❌ VAULT FOLDER: Creation failed:", error);

    res.status(500).json({ 
      error: "Folder creation failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Helper function to map category to folder ID
function getCategoryFolderId(category: string, sessionData: any): string | null {
  const folderStructure = sessionData.folderStructure;

  if (!folderStructure?.subfolders) {
    return null;
  }

  // Map category names to folder structure
  const categoryMapping: Record<string, string> = {
    '0_Overview': 'Overview',
    '1_Problem_Proof': 'Problem Proofs', 
    '2_Solution_Proof': 'Solution Proofs',
    '3_Demand_Proof': 'Demand Proofs',
    '4_Credibility_Proof': 'Credibility Proofs',
    '5_Commercial_Proof': 'Commercial Proofs',
    '6_Investor_Pack': 'Investor Pack'
  };

  const targetFolderName = categoryMapping[category];

  if (!targetFolderName) {
    return null;
  }

  // Find folder ID in structure
  for (const subfolder of folderStructure.subfolders) {
    if (subfolder.name === targetFolderName) {
      return subfolder.id;
    }
  }

  return null;
}

export default router;