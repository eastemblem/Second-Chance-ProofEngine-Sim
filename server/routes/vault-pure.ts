import { Router } from "express";
import { vaultService } from "../services/vault-service";
import { eastEmblemAPI } from "../eastemblem-api";
import { getSessionId, getSessionData, updateSessionData } from "../utils/session-manager";
import { asyncHandler, createSuccessResponse } from "../utils/error-handler";
import { cleanupUploadedFile } from "../utils/file-cleanup";
import { requireFields } from "../middleware/auth";
import { ActivityService } from "../services/activity-service";
import { getFolderIdFromCategory, getCategoryFromFolderId, validateProofVaultStructure } from "../utils/folder-mapping-pure";
import { appLogger } from "../utils/logger";
import { storage } from "../storage";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Helper function to get folder display name - PURE VERSION (no fallbacks)
const getFolderDisplayName = (categoryName: string) => {
  const displayMap: Record<string, string> = {
    '0_Overview': 'Overview',
    '1_Problem_Proof': 'Problem Proofs',
    '2_Solution_Proof': 'Solution Proofs', 
    '3_Demand_Proof': 'Demand Proofs',
    '4_Credibility_Proof': 'Credibility Proofs',
    '5_Commercial_Proof': 'Commercial Proofs',
    '6_Investor_Pack': 'Investor Pack'
  };
  return displayMap[categoryName] || categoryName;
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
      "image/png",
      "image/gif",
      "image/webp",
      
      // Videos
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/quicktime"
    ];
    
    cb(null, allowedTypes.includes(file.mimetype));
  },
});

/**
 * 100% DATABASE-DRIVEN FILE UPLOAD - NO FALLBACKS
 */
router.post('/upload', requireFields(['founderId']), upload.single('file'), asyncHandler(async (req, res) => {
  const { folder_id } = req.body;
  const file = req.file;
  const sessionId = getSessionId(req);
  const founderId = req.session?.founderId;

  if (!founderId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!file) {
    return res.status(400).json({ success: false, error: "No file provided" });
  }

  if (!folder_id) {
    return res.status(400).json({ success: false, error: "folder_id is required" });
  }

  appLogger.business('Processing 100% database-driven file upload', { 
    fileName: file.originalname, 
    categoryName: folder_id,
    founderId,
    sessionId
  });

  try {
    // Step 1: Validate proof vault structure exists
    const validation = await validateProofVaultStructure(founderId);
    if (!validation.valid) {
      appLogger.business('Proof vault structure validation failed', {
        founderId,
        missingCategories: validation.missingCategories,
        availableCategories: validation.availableCategories
      });
      
      return res.status(400).json({ 
        success: false, 
        error: `Proof vault not properly configured. Missing categories: ${validation.missingCategories.join(', ')}. Please complete onboarding to create folder structure.`
      });
    }

    // Step 2: Get actual Box.com folder ID from database - NO FALLBACKS
    let actualFolderId: string;
    try {
      actualFolderId = await getFolderIdFromCategory(folder_id, founderId);
      appLogger.business('Resolved category to folder ID', { 
        categoryName: folder_id, 
        actualFolderId,
        founderId
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      appLogger.business('Failed to resolve category to folder ID', { 
        categoryName: folder_id, 
        founderId,
        error: errorMessage
      });
      
      return res.status(400).json({ 
        success: false, 
        error: `Category '${folder_id}' not found in proof vault. Available categories: ${validation.availableCategories.join(', ')}`
      });
    }

    // Step 3: Read file buffer
    const filePath = file.path;
    const fileBuffer = fs.readFileSync(filePath);

    appLogger.business('Uploading file to Box.com with database folder ID', { 
      fileName: file.originalname,
      actualFolderId,
      categoryName: folder_id,
      founderId
    });

    // Step 4: Upload to Box.com using resolved folder ID
    const uploadResult = await vaultService.uploadFileToVault(
      fileBuffer,
      file.originalname,
      actualFolderId,
      sessionId
    );

    // Step 5: Update session with uploaded file
    const sessionData = getSessionData(req);
    const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
    updateSessionData(req, { uploadedFiles: updatedFiles });

    // Step 6: Track file upload in database
    const ventures = await storage.getVenturesByFounderId(founderId);
    const latestVenture = ventures[0];
    
    if (latestVenture) {
      await storage.createDocumentUpload({
        ventureId: latestVenture.ventureId,
        fileName: uploadResult.name || file.originalname,
        originalName: file.originalname,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadStatus: "completed",
        processingStatus: "pending",
        eastemblemFileId: uploadResult.id,
        sharedUrl: uploadResult.url,
        folderId: actualFolderId
      });

      // Track activity
      await ActivityService.trackActivity({
        founderId: founderId,
        ventureId: latestVenture.ventureId,
        activityType: 'vault',
        action: 'upload',
        entityType: 'file',
        entityId: uploadResult.id,
        metadata: {
          fileName: file.originalname,
          fileSize: file.size,
          category: folder_id,
          categoryDisplay: getFolderDisplayName(folder_id),
          folderId: actualFolderId
        }
      });

      appLogger.business('File upload completed successfully', { 
        fileName: file.originalname,
        uploadId: uploadResult.id,
        category: folder_id,
        folderId: actualFolderId
      });
    }

    // Step 7: Cleanup uploaded file
    cleanupUploadedFile(filePath);

    res.json(createSuccessResponse({
      file: {
        id: uploadResult.id,
        name: uploadResult.name,
        url: uploadResult.url,
        size: file.size,
        category: folder_id,
        categoryDisplay: getFolderDisplayName(folder_id),
        folderId: actualFolderId
      }
    }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    appLogger.business('File upload failed', { 
      fileName: file.originalname,
      categoryName: folder_id,
      founderId,
      error: errorMessage
    });

    // Cleanup uploaded file on error
    if (file.path && fs.existsSync(file.path)) {
      cleanupUploadedFile(file.path);
    }

    res.status(500).json({ 
      success: false, 
      error: `File upload failed: ${errorMessage}`
    });
  }
}));

/**
 * 100% DATABASE-DRIVEN FOLDER CREATION - NO FALLBACKS
 */
router.post('/create-folder', requireFields(['founderId']), asyncHandler(async (req, res) => {
  const { folder_name, folder_id } = req.body;
  const founderId = req.session!.founderId;

  if (!folder_name || !folder_id) {
    return res.status(400).json({ 
      success: false, 
      error: "folder_name and folder_id are required" 
    });
  }

  appLogger.business('Processing 100% database-driven folder creation', { 
    folderName: folder_name, 
    parentCategory: folder_id,
    founderId
  });

  try {
    // Step 1: Validate proof vault structure exists
    const validation = await validateProofVaultStructure(founderId);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        error: `Proof vault not properly configured. Missing categories: ${validation.missingCategories.join(', ')}`
      });
    }

    // Step 2: Get actual Box.com folder ID from database - NO FALLBACKS
    let parentFolderId: string;
    try {
      parentFolderId = await getFolderIdFromCategory(folder_id, founderId);
      appLogger.business('Resolved parent category to folder ID', { 
        parentCategory: folder_id, 
        parentFolderId,
        founderId
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      appLogger.business('Failed to resolve parent category to folder ID', { 
        parentCategory: folder_id, 
        founderId,
        error: errorMessage
      });
      
      return res.status(400).json({ 
        success: false, 
        error: `Parent category '${folder_id}' not found in proof vault. Available categories: ${validation.availableCategories.join(', ')}`
      });
    }

    // Step 3: Create folder in Box.com
    const result = await eastEmblemAPI.createFolder(folder_name, parentFolderId);
    
    if (!result.success) {
      throw new Error(`Folder creation failed: ${result.error || 'Unknown error'}`);
    }

    const createdFolderId = result.folder_id;
    appLogger.business('Folder created successfully in Box.com', { 
      folderName: folder_name,
      createdFolderId,
      parentFolderId,
      parentCategory: folder_id
    });

    // Step 4: Store folder mapping in database
    const ventures = await storage.getVenturesByFounderId(founderId);
    const latestVenture = ventures[0];
    
    if (latestVenture) {
      const proofVaultData = {
        ventureId: latestVenture.ventureId,
        artefactType: 'Technical Documentation' as const,
        parentFolderId: parentFolderId,
        subFolderId: createdFolderId.toString(),
        sharedUrl: result.url || '',
        folderName: folder_name,
        description: `Subfolder created in ${getFolderDisplayName(folder_id)}`
      };
      
      const proofVaultEntry = await storage.createProofVault(proofVaultData);
      
      // Track activity
      await ActivityService.trackActivity({
        founderId: founderId,
        ventureId: latestVenture.ventureId,
        activityType: 'vault',
        action: 'create',
        entityType: 'folder',
        entityId: createdFolderId.toString(),
        metadata: {
          folderName: folder_name,
          parentCategory: folder_id,
          parentCategoryDisplay: getFolderDisplayName(folder_id),
          parentFolderId: parentFolderId,
          vaultId: proofVaultEntry.vaultId
        }
      });

      appLogger.business('Folder mapping stored in database successfully', { 
        folderName: folder_name,
        createdFolderId,
        vaultId: proofVaultEntry.vaultId
      });
    }

    res.json(createSuccessResponse({
      folder_id: createdFolderId,
      folder_name: folder_name,
      parent_folder_id: parentFolderId,
      url: result.url,
      parent_category: folder_id,
      parent_category_display: getFolderDisplayName(folder_id)
    }));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    appLogger.business('Folder creation failed', { 
      folderName: folder_name,
      parentCategory: folder_id,
      founderId,
      error: errorMessage
    });

    res.status(500).json({ 
      success: false, 
      error: `Folder creation failed: ${errorMessage}`
    });
  }
}));

export default router;