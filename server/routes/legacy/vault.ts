import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { asyncHandler, createSuccessResponse } from "../../utils/error-handler";
import { eastEmblemAPI } from "../../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../../utils/session-manager";
import { cleanupUploadedFile } from "../../utils/file-cleanup";
import { requireSession } from "../../middleware/auth";
import { appLogger } from "../../utils/logger";

const router = express.Router();

// Configure multer for vault file uploads
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
      const timestamp = Date.now();
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${timestamp}_${cleanName}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for vault files
});

// Get vault data
router.get("/data", requireSession, asyncHandler(async (req, res) => {
  const sessionId = getSessionId(req);
  const sessionData = await getSessionData(sessionId);
  
  if (!sessionData?.vaultData) {
    return res.json(createSuccessResponse({
      folders: [],
      files: [],
      totalFiles: 0,
      categories: {},
    }));
  }

  appLogger.business("Legacy vault data retrieved for session:", sessionId);

  res.json(createSuccessResponse(sessionData.vaultData));
}));

// Create folder
router.post("/create-folder", requireSession, asyncHandler(async (req, res) => {
  const { folderName, parentFolderId, category } = req.body;
  const sessionId = getSessionId(req);
  
  if (!folderName) {
    throw new Error("Folder name is required");
  }

  appLogger.business("Legacy folder creation:", { folderName, category, sessionId });

  try {
    // Use EastEmblem API to create folder
    const response = await eastEmblemAPI.createFolder({
      folder_name: folderName,
      parent_folder_id: parentFolderId,
    });

    if (response.success) {
      // Update session data with new folder
      const sessionData = await getSessionData(sessionId);
      const vaultData = sessionData?.vaultData || { folders: [], files: [], totalFiles: 0, categories: {} };
      
      vaultData.folders.push({
        id: response.folder_id,
        name: folderName,
        parent_id: parentFolderId,
        category: category || 'Other',
        created_at: new Date().toISOString(),
      });

      await updateSessionData(sessionId, { vaultData });

      res.json(createSuccessResponse({
        folderId: response.folder_id,
        folderName,
        category: category || 'Other',
      }));
    } else {
      throw new Error("Failed to create folder");
    }
  } catch (error) {
    appLogger.business("Legacy folder creation failed:", error.message);
    throw error;
  }
}));

// File upload
router.post("/upload", upload.single("file"), requireSession, asyncHandler(async (req, res) => {
  const { folderId, category } = req.body;
  const sessionId = getSessionId(req);
  
  if (!req.file) {
    throw new Error("No file uploaded");
  }

  appLogger.business("Legacy file upload:", { filename: req.file.originalname, category, sessionId });

  try {
    // Use EastEmblem API to upload file
    const response = await eastEmblemAPI.uploadFile({
      file_path: req.file.path,
      folder_id: folderId,
      file_name: req.file.originalname,
    });

    if (response.success) {
      // Update session data with new file
      const sessionData = await getSessionData(sessionId);
      const vaultData = sessionData?.vaultData || { folders: [], files: [], totalFiles: 0, categories: {} };
      
      vaultData.files.push({
        id: response.file_id,
        name: req.file.originalname,
        folder_id: folderId,
        category: category || 'Other',
        size: req.file.size,
        uploaded_at: new Date().toISOString(),
        download_url: response.download_url,
      });

      vaultData.totalFiles = vaultData.files.length;
      
      // Update category counts
      const categoryKey = category || 'Other';
      vaultData.categories[categoryKey] = (vaultData.categories[categoryKey] || 0) + 1;

      await updateSessionData(sessionId, { vaultData });

      // Clean up local file
      await cleanupUploadedFile(req.file.path);

      res.json(createSuccessResponse({
        fileId: response.file_id,
        fileName: req.file.originalname,
        category: categoryKey,
        downloadUrl: response.download_url,
      }));
    } else {
      await cleanupUploadedFile(req.file.path);
      throw new Error("Failed to upload file");
    }
  } catch (error) {
    await cleanupUploadedFile(req.file.path);
    appLogger.business("Legacy file upload failed:", error.message);
    throw error;
  }
}));

// Multiple file upload
router.post("/upload-multiple", upload.array("files", 20), requireSession, asyncHandler(async (req, res) => {
  const { folderId, category } = req.body;
  const sessionId = getSessionId(req);
  
  if (!req.files || req.files.length === 0) {
    throw new Error("No files uploaded");
  }

  appLogger.business("Legacy multiple file upload:", { fileCount: req.files.length, category, sessionId });

  const uploadResults = [];
  const failedUploads = [];

  for (const file of req.files) {
    try {
      const response = await eastEmblemAPI.uploadFile({
        file_path: file.path,
        folder_id: folderId,
        file_name: file.originalname,
      });

      if (response.success) {
        uploadResults.push({
          fileId: response.file_id,
          fileName: file.originalname,
          downloadUrl: response.download_url,
        });
      } else {
        failedUploads.push(file.originalname);
      }

      await cleanupUploadedFile(file.path);
    } catch (error) {
      failedUploads.push(file.originalname);
      await cleanupUploadedFile(file.path);
    }
  }

  // Update session data with successful uploads
  if (uploadResults.length > 0) {
    const sessionData = await getSessionData(sessionId);
    const vaultData = sessionData?.vaultData || { folders: [], files: [], totalFiles: 0, categories: {} };
    
    for (const result of uploadResults) {
      vaultData.files.push({
        id: result.fileId,
        name: result.fileName,
        folder_id: folderId,
        category: category || 'Other',
        uploaded_at: new Date().toISOString(),
        download_url: result.downloadUrl,
      });
    }

    vaultData.totalFiles = vaultData.files.length;
    
    // Update category counts
    const categoryKey = category || 'Other';
    vaultData.categories[categoryKey] = (vaultData.categories[categoryKey] || 0) + uploadResults.length;

    await updateSessionData(sessionId, { vaultData });
  }

  res.json(createSuccessResponse({
    successfulUploads: uploadResults,
    failedUploads,
    totalProcessed: req.files.length,
    successCount: uploadResults.length,
    failureCount: failedUploads.length,
  }));
}));

export default router;