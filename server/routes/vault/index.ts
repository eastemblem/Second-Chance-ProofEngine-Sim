import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { asyncHandler, createSuccessResponse } from "../../utils/error-handler";
import { eastEmblemAPI } from "../../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../../utils/session-manager";
import { cleanupUploadedFile } from "../../utils/file-cleanup";
import { activityService } from "../../services/activity-service";

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
      "application/pdf",
      "application/vnd.ms-powerpoint", 
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/svg+xml",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Single file upload endpoint - extracted from main routes.ts
router.post("/upload", vaultUpload.single("file"), asyncHandler(async (req, res) => {
  if (!eastEmblemAPI.isConfigured()) {
    return res.status(500).json({ error: "EastEmblem API not configured" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { category } = req.body;
  const sessionId = getSessionId(req);
  
  console.log(`📤 VAULT UPLOAD: Processing file ${req.file.originalname} for category ${category}`);

  try {
    // Get session data for folder structure
    const sessionData = await getSessionData(sessionId);
    
    if (!sessionData?.folderStructure) {
      throw new Error("Folder structure not found in session");
    }

    // Map category to folder ID using session data
    const folderId = getCategoryFolderId(category, sessionData);
    
    if (!folderId) {
      throw new Error(`Invalid category: ${category}`);
    }

    // Upload file to EastEmblem/Box.com
    const uploadResult = await eastEmblemAPI.uploadFile(
      req.file.path,
      req.file.originalname,
      folderId
    );

    console.log(`✅ VAULT UPLOAD: File uploaded successfully`, uploadResult);

    // Track activity
    await activityService.trackActivity({
      founderId: req.session?.founderId || 'unknown',
      ventureId: sessionData.founderData?.ventureId || 'unknown',
      sessionId,
      activityType: 'document',
      action: 'upload',
      title: req.file.originalname,
      description: `Uploaded to ${category}`,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        folderId: folderId,
        category: category
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Cleanup local file
    await cleanupUploadedFile(req.file.path);

    res.json(createSuccessResponse({
      uploadId: uploadResult.id,
      fileName: req.file.originalname,
      sharedUrl: uploadResult.shared_url,
      folderId: folderId,
      category: category,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    }, "File uploaded successfully"));

  } catch (error) {
    console.error("❌ VAULT UPLOAD: Upload failed:", error);
    
    // Cleanup on error
    if (req.file?.path) {
      await cleanupUploadedFile(req.file.path);
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

  const { category } = req.body;
  const sessionId = getSessionId(req);
  
  console.log(`📤 VAULT MULTIPLE UPLOAD: Processing ${req.files.length} files for category ${category}`);

  try {
    const sessionData = await getSessionData(sessionId);
    
    if (!sessionData?.folderStructure) {
      throw new Error("Folder structure not found in session");
    }

    const folderId = getCategoryFolderId(category, sessionData);
    
    if (!folderId) {
      throw new Error(`Invalid category: ${category}`);
    }

    const results = [];
    const errors = [];

    // Process files sequentially for stability
    for (const file of req.files) {
      try {
        const uploadResult = await eastEmblemAPI.uploadFile(
          file.path,
          file.originalname,
          folderId
        );

        // Track activity for each file
        await activityService.trackActivity({
          founderId: req.session?.founderId || 'unknown',
          ventureId: sessionData.founderData?.ventureId || 'unknown', 
          sessionId,
          activityType: 'document',
          action: 'upload',
          title: file.originalname,
          description: `Uploaded to ${category}`,
          metadata: {
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            folderId: folderId,
            category: category
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });

        results.push({
          uploadId: uploadResult.id,
          fileName: file.originalname,
          sharedUrl: uploadResult.shared_url,
          folderId: folderId,
          category: category,
          fileSize: file.size,
          mimeType: file.mimetype,
          status: 'success'
        });

        // Cleanup successful upload
        await cleanupUploadedFile(file.path);

      } catch (error) {
        console.error(`❌ VAULT UPLOAD: Failed to upload ${file.originalname}:`, error);
        
        errors.push({
          fileName: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        });

        // Cleanup failed upload
        await cleanupUploadedFile(file.path);
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
        await cleanupUploadedFile(file.path);
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
    await activityService.trackActivity({
      founderId: req.session?.founderId || 'unknown',
      ventureId: sessionData.founderData?.ventureId || 'unknown',
      sessionId,
      activityType: 'folder',
      action: 'create',
      title: folderName,
      description: `Created folder in ${parentCategory}`,
      metadata: {
        folderName: folderName,
        parentCategory: parentCategory,
        parentFolderId: parentFolderId,
        folderId: folderResult.id
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
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