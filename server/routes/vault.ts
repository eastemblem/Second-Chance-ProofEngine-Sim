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

  // Clean up uploaded file after processing
  cleanupUploadedFile(file.path, file.originalname, "Upload complete");

  res.json(createSuccessResponse({
    upload: uploadResult,
    filesCount: updatedFiles.length,
  }, "File uploaded successfully"));
}));

export default router;