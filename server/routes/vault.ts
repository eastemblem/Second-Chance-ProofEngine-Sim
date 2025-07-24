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
  
  const uploadResult = await vaultService.uploadFileToVault(
    fileBuffer,
    file.originalname,
    folder_id,
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
        // Get the correct folder ID for the selected folder
        const proofVaultRecords = await storage.getProofVaultsByVentureId(latestVenture.ventureId);
        const targetFolder = proofVaultRecords.find(pv => pv.folderName === folder_id);
        const folderId = targetFolder?.subFolderId || null;
        
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
          folderId: folderId, // Map to correct folder
        });
        console.log(`✅ File tracked in database: ${file.originalname} → ${folder_id} folder (${folderId})`);
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