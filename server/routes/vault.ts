import { Router } from "express";
import { vaultService } from "../services/vault-service";
import { eastEmblemAPI } from "../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../utils/session-manager";
import { asyncHandler, createSuccessResponse } from "../utils/error-handler";
import { cleanupUploadedFile } from "../utils/file-cleanup";
import { requireFields } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

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
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      
      // Presentations
      "application/vnd.ms-powerpoint", 
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      
      // Images
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      
      // Videos
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
      
      // Audio
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log(`Rejected file type: ${file.mimetype} for file: ${file.originalname}`);
      cb(new Error(`File type ${file.mimetype} is not supported. Please upload documents, images, videos, or archives.`));
    }
  },
});

// Create startup vault
router.post("/create-startup-vault", requireFields(['startupName']), asyncHandler(async (req, res) => {
  const { startupName } = req.body;
  const sessionId = getSessionId(req);
  
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

// Upload file to specific folder
router.post("/upload-file", upload.single("file"), requireFields(['folder_id']), asyncHandler(async (req, res) => {
  const { folder_id } = req.body;
  const file = req.file;

  if (!file) {
    throw new Error("File is required for upload");
  }

  console.log(`📁 Starting file upload: ${file.originalname} to folder ${folder_id}`);
  const fileBuffer = fs.readFileSync(file.path);
  const sessionId = getSessionId(req);
  
  // Get the actual Box.com folder ID from database
  let actualFolderId = folder_id;
  console.log(`🔍 Attempting to map folder name '${folder_id}' to Box.com folder ID...`);
  console.log(`🔐 Session founderId: ${req.session?.founderId || 'NOT SET'}`);
  
  // Try to get folder mapping
  try {
    const { storage } = await import("../storage");
    
    // First try with authenticated user
    if (req.session?.founderId) {
      const ventures = await storage.getVenturesByFounderId(req.session.founderId);
      const latestVenture = ventures.length > 0 ? ventures[0] : null;
      
      if (latestVenture) {
        const proofVaultRecords = await storage.getProofVaultsByVentureId(latestVenture.ventureId);
        const targetFolder = proofVaultRecords.find(pv => pv.folderName === folder_id);
        if (targetFolder?.subFolderId) {
          actualFolderId = targetFolder.subFolderId.toString();
          console.log(`✅ Mapped folder name '${folder_id}' to Box.com folder ID '${actualFolderId}' (authenticated)`);
        }
      }
    } else {
      // Fallback: try to find the most recent venture for testing
      console.log(`⚠️ No authenticated session, trying to find folder mapping for testing...`);
      const latestVenture = await storage.getVenture('7ca13a11-b56f-4158-a8fa-58a34b985613');
      
      if (latestVenture) {
        const proofVaultRecords = await storage.getProofVaultsByVentureId(latestVenture.ventureId);
        console.log(`📋 Found ${proofVaultRecords.length} ProofVault records for venture`);
        
        const targetFolder = proofVaultRecords.find(pv => pv.folderName === folder_id);
        if (targetFolder?.subFolderId) {
          actualFolderId = targetFolder.subFolderId.toString();
          console.log(`✅ Mapped folder name '${folder_id}' to Box.com folder ID '${actualFolderId}' (fallback)`);
        } else {
          console.log(`❌ No mapping found for folder '${folder_id}' in ProofVault records`);
          console.log(`Available folders:`, proofVaultRecords.map(pv => `${pv.folderName} -> ${pv.subFolderId}`));
        }
      } else {
        console.log(`❌ No venture found for testing fallback`);
      }
    }
  } catch (error) {
    console.error("Failed to map folder ID:", error);
    // Continue with original folder_id as fallback
  }
  
  console.log(`📤 Uploading to Box.com folder ID: '${actualFolderId}' (original: '${folder_id}')`);
  
  if (actualFolderId === folder_id) {
    console.log(`⚠️ WARNING: Using folder name '${folder_id}' instead of numeric Box.com folder ID - this may cause upload issues`);
  }
  
  const uploadResult = await vaultService.uploadFileToVault(
    fileBuffer,
    file.originalname,
    actualFolderId,
    sessionId
  );

  // Update session with uploaded file
  const sessionData = getSessionData(req);
  const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
  updateSessionData(req, { uploadedFiles: updatedFiles });

  // Track file upload in database if we have venture context
  if (req.session?.founderId) {
    try {
      const { storage } = await import("../storage");
      const ventures = await storage.getVenturesByFounderId(req.session.founderId);
      const latestVenture = ventures.length > 0 ? ventures[0] : null;
      
      if (latestVenture) {
        await storage.createDocumentUpload({
          ventureId: latestVenture.ventureId,
          fileName: uploadResult.name || file.originalname,
          originalName: file.originalname,
          filePath: `/uploads/${folder_id}/${file.originalname}`,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadStatus: "completed",
          processingStatus: "completed",
          eastemblemFileId: uploadResult.id,
          sharedUrl: uploadResult.url || uploadResult.download_url,
          folderId: actualFolderId, // Use the mapped folder ID
        });
        console.log(`✅ File tracked in database: ${file.originalname} → ${folder_id} folder (${actualFolderId})`);
      }
    } catch (error) {
      console.error("Failed to track file upload in database:", error);
      // Don't fail the upload if database tracking fails
    }
  }

  // Clean up uploaded file after processing
  cleanupUploadedFile(file.path, file.originalname, "Upload complete");

  console.log(`✅ File upload complete: ${file.originalname}`);
  
  res.json(createSuccessResponse({
    upload: uploadResult,
    filesCount: updatedFiles.length,
  }, "File uploaded successfully"));
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
    console.error("Failed to remove file:", error);
    res.status(500).json({ error: "Failed to remove file" });
  }
}));

export default router;