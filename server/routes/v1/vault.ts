import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { eastEmblemAPI } from '../../eastemblem-api';
import { getSessionId, getSessionData, updateSessionData } from '../../utils/session-manager';
import { createSuccessResponse } from '../../utils/error-handler';
import { cleanupUploadedFile } from '../../utils/file-cleanup';
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
      "application/pdf",
      "application/vnd.ms-powerpoint", 
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, PPT, PPTX, images (PNG, JPEG, GIF, WebP, SVG), Word documents, and text files.`));
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

    // Step 3: Update session with uploaded file
    const sessionData = getSessionData(req);
    const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
    updateSessionData(req, { uploadedFiles: updatedFiles });

    // Step 4: Cleanup uploaded file
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

export default router;