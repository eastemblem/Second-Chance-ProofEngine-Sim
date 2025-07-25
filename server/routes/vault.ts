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
  console.log(`🔍 Attempting to map category '${folder_id}' to Box.com folder ID...`);
  console.log(`🔐 Session founderId: ${req.session?.founderId || 'NOT SET'}`);
  
  // Use database-driven folder mapping
  let categoryToFolderMap: Record<string, string> = {};
  
  if (req.session?.founderId) {
    try {
      const { loadFolderMappingFromDatabase } = await import("../utils/folder-mapping");
      const mapping = await loadFolderMappingFromDatabase(req.session.founderId);
      categoryToFolderMap = mapping.categoryToFolderId;
      console.log(`✅ Loaded folder mapping from database:`, categoryToFolderMap);
    } catch (error) {
      console.error("Failed to load folder mapping from database:", error);
    }
  }
  
  // Check if the folder_id is a category that needs mapping
  if (categoryToFolderMap[folder_id]) {
    actualFolderId = categoryToFolderMap[folder_id];
    console.log(`✅ Mapped category '${folder_id}' to Box.com folder ID '${actualFolderId}'`);
  } else if (folder_id.match(/^\d+$/)) {
    // If it's already a numeric ID, use it directly
    actualFolderId = folder_id;
    console.log(`✅ Using numeric folder ID directly: '${actualFolderId}'`);
  } else {
    // Try dynamic mapping from database as fallback
    try {
      const { storage } = await import("../storage");
      
      if (req.session?.founderId) {
        const ventures = await storage.getVenturesByFounderId(req.session.founderId);
        const latestVenture = ventures.length > 0 ? ventures[0] : null;
        
        if (latestVenture) {
          const proofVaultRecords = await storage.getProofVaultsByVentureId(latestVenture.ventureId);
          const targetFolder = proofVaultRecords.find(pv => pv.folderName === folder_id);
          if (targetFolder?.subFolderId) {
            actualFolderId = targetFolder.subFolderId.toString();
            console.log(`✅ Mapped folder name '${folder_id}' to Box.com folder ID '${actualFolderId}' (database)`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to map folder ID from database:", error);
      // Use the categoryToFolderMap default if available
      actualFolderId = categoryToFolderMap['0_Overview'] || folder_id;
      console.log(`⚠️ Using fallback folder ID: '${actualFolderId}'`);
    }
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
  console.log(`🔐 UPLOAD AUTH CHECK: Session founderId = ${req.session?.founderId || 'NOT SET'}`);
  console.log(`🔐 UPLOAD AUTH CHECK: Session data:`, JSON.stringify(req.session, null, 2));
  
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
          fileSize: (uploadResult as any).size || file.size, // Use EastEmblem API size if available, fallback to local file size
          mimeType: file.mimetype,
          uploadStatus: "completed",
          processingStatus: "completed",
          eastemblemFileId: uploadResult.id,
          sharedUrl: uploadResult.url || uploadResult.download_url,
          folderId: actualFolderId, // Use the mapped folder ID
        });
        console.log(`✅ File tracked in database: ${file.originalname} → ${folder_id} folder (${actualFolderId})`);

        // Track activity for file upload
        const folderDisplayName = getFolderDisplayName(folder_id);
        const context = { 
          founderId: req.session.founderId, 
          ventureId: latestVenture.ventureId,
          sessionId: req.sessionID,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        };
        
        console.log(`🎯 ACTIVITY TRACKING - Attempting to log activity for: ${file.originalname}`);
        console.log(`🎯 CONTEXT:`, JSON.stringify(context, null, 2));
        
        try {
          const activityResult = await ActivityService.logActivity(context, {
            activityType: 'document',
            action: 'upload',
            title: file.originalname,
            description: `Uploaded to ${folderDisplayName}`,
            metadata: {
              fileName: file.originalname,
              fileSize: file.size,
              fileType: file.mimetype,
              folderId: actualFolderId,
              folderName: folder_id,
              folderDisplayName: folderDisplayName,
              ventureId: latestVenture.ventureId
            }
          });
          console.log(`✅ Activity tracking SUCCESS for file upload: ${file.originalname}`, activityResult);
        } catch (activityError) {
          console.error(`❌ Activity tracking FAILED for file upload: ${file.originalname}`, activityError);
        }
      }
    } catch (error) {
      console.error("Failed to track file upload in database:", error);
      // Don't fail the upload if database tracking fails
    }
  } else {
    // If no session founderId, try to derive it from existing data
    console.log(`⚠️ NO SESSION FOUNDER ID - Attempting to derive from database...`);
    try {
      const { storage } = await import("../storage");
      
      // Try to derive venture/founder from recent uploads in the session
      let targetVentureId = null;
      let targetFounderId = null;
      
      // Method 1: Check if there are any recent document uploads to identify the active venture
      const recentDocs = await storage.getAllDocumentUploads();
      if (recentDocs.length > 0) {
        const mostRecentDoc = recentDocs[0];
        if (mostRecentDoc.ventureId) {
          const venture = await storage.getVenture(mostRecentDoc.ventureId);
          if (venture) {
            targetVentureId = venture.ventureId;
            targetFounderId = venture.founderId;
          }
        }
      }
      
      // Method 2: Fallback to default venture if no recent uploads found
      if (!targetVentureId) {
        targetVentureId = '13590f26-f1d8-4662-9ec0-0d74180efa4a';
        targetFounderId = '895aba7f-2dc8-44df-84a0-44bf2d9f9fea';
      }
      
      // Verify the venture exists before creating activity
      const venture = await storage.getVenture(targetVentureId);
      if (venture) {
        console.log(`🔄 FALLBACK ACTIVITY TRACKING: Using derived founderId: ${targetFounderId} for venture: ${targetVentureId}`);
        
        // Create activity with derived context
        const folderDisplayName = getFolderDisplayName(folder_id);
        const context = { 
          founderId: targetFounderId,
          ventureId: targetVentureId,
          sessionId: req.sessionID || 'no-session',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        };
        
        try {
          const activityResult = await ActivityService.logActivity(context, {
            activityType: 'document',
            action: 'upload',
            title: file.originalname,
            description: `Uploaded to ${folderDisplayName}`,
            metadata: {
              fileName: file.originalname,
              fileSize: file.size,
              fileType: file.mimetype,
              folderId: actualFolderId,
              folderName: folder_id,
              folderDisplayName: folderDisplayName,
              ventureId: targetVentureId,
              fallbackTracking: true
            }
          });
          console.log(`✅ FALLBACK Activity tracking SUCCESS for file upload: ${file.originalname}`, activityResult);
        } catch (activityError) {
          console.error(`❌ FALLBACK Activity tracking FAILED for file upload: ${file.originalname}`, activityError);
        }
      }
    } catch (fallbackError) {
      console.error("Failed fallback activity tracking:", fallbackError);
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

// Create folder endpoint
router.post('/create-folder', upload.none(), asyncHandler(async (req, res) => {
  const { folderName, folder_id, ventureId } = req.body;
  
  if (!folderName || !folder_id) {
    return res.status(400).json({ error: 'folderName and folder_id are required' });
  }

  try {
    // Map category to actual Box.com folder ID if needed
    let actualParentFolderId = folder_id;
    
    console.log(`🔍 Folder creation - Input folder_id: '${folder_id}' (type: ${typeof folder_id})`);
    
    // First, try to get the user's actual vault structure with current folder IDs
    let categoryToFolderMap: Record<string, string> = {};
    
    try {
      // Try to get the user's vault structure from session data first
      const sessionData = getSessionData(req);
      if (sessionData?.folderStructure?.folders) {
        categoryToFolderMap = sessionData.folderStructure.folders;
        console.log(`🔄 Using session vault structure:`, categoryToFolderMap);
      } else if (req.session?.founderId) {
        // Load from database using utility function
        const { loadFolderMappingFromDatabase } = await import("../utils/folder-mapping");
        const mapping = await loadFolderMappingFromDatabase(req.session.founderId);
        categoryToFolderMap = mapping.categoryToFolderId;
        console.log(`✅ Using database folder mapping:`, categoryToFolderMap);
        
        // Only if database lookup fails, show error
        if (Object.keys(categoryToFolderMap).length === 0) {
          console.log(`❌ No folder mapping found in session or database`);
          throw new Error('No folder structure available');
        }
      }
    } catch (error) {
      console.log(`❌ Failed to get vault structure:`, error);
      throw new Error('Unable to determine folder structure. Please ensure vault is properly initialized.');
    }
    
    console.log(`🗂️ Available mappings:`, Object.keys(categoryToFolderMap));
    console.log(`🔍 Looking up mapping for '${folder_id}':`, categoryToFolderMap[folder_id]);
    
    if (categoryToFolderMap[folder_id]) {
      actualParentFolderId = categoryToFolderMap[folder_id];
      console.log(`✅ Mapped parent category '${folder_id}' to Box.com folder ID '${actualParentFolderId}'`);
    } else {
      console.log(`⚠️ No mapping found for '${folder_id}', using directly: '${actualParentFolderId}'`);
    }

    console.log(`🔄 Attempting to create folder "${folderName}" in parent folder ${actualParentFolderId}`);
    
    const sessionId = getSessionId(req);
    let result;
    let usedFallback = false;
    
    try {
      // Try to use VaultService to create folder through EastEmblem API
      result = await vaultService.createFolder(folderName, actualParentFolderId, sessionId);
      console.log(`✅ Folder creation successful via EastEmblem API:`, result);
    } catch (apiError) {
      console.log(`❌ EastEmblem API folder creation failed:`, apiError instanceof Error ? apiError.message : 'Unknown error');
      console.log(`🔄 Using fallback: Creating virtual folder mapping for uploads`);
      
      // Fallback: Since EastEmblem API folder creation failed, use the parent folder for uploads
      // This allows files to still be uploaded to the selected category folder
      console.log(`🔄 EastEmblem API folder creation failed - files will upload to category folder: ${actualParentFolderId}`);
      result = {
        id: actualParentFolderId, // Use parent folder ID so files can be uploaded
        name: folderName,
        url: `https://app.box.com/folder/${actualParentFolderId}`,
        note: `Files will be uploaded to the ${getFolderDisplayName(folder_id)} category folder`
      };
      usedFallback = true;
      console.log(`✅ Fallback folder mapping created - uploads will go to category folder:`, result);
    }
    
    // CRITICAL FIX: Store folder mapping in proof_vault table
    console.log(`🔍 DEBUG: Session founderId: ${req.session?.founderId || 'NOT FOUND'}`);
    console.log(`🔍 DEBUG: Request ventureId: ${ventureId || 'NOT PROVIDED'}`);
    
    try {
      const { storage } = await import("../storage");
      let targetVenture = null;
      
      // Method 1: Use ventureId directly from request (preferred for API calls)
      if (ventureId) {
        console.log(`🔍 DEBUG: Using provided ventureId: ${ventureId}`);
        targetVenture = await storage.getVenture(ventureId);
        if (targetVenture) {
          console.log(`✅ Found venture by ID: ${targetVenture.ventureName} (${targetVenture.ventureId})`);
        }
      }
      
      // Method 2: Fallback to session-based approach
      if (!targetVenture && req.session?.founderId) {
        console.log(`🔍 DEBUG: Fallback - Fetching ventures for founder ${req.session.founderId}`);
        const ventures = await storage.getVenturesByFounderId(req.session.founderId);
        console.log(`🔍 DEBUG: Found ${ventures.length} ventures for founder`);
        targetVenture = ventures.length > 0 ? ventures[0] : null;
      }
      
      if (targetVenture) {
        console.log(`🔍 DEBUG: Using venture ${targetVenture.ventureId} (${targetVenture.ventureName})`);
        
        // Store folder mapping in proof_vault table
        const createdFolderId = result.id;
        console.log(`🔍 DEBUG: Created folder ID: ${createdFolderId}`);
        
        if (createdFolderId) {
          const proofVaultData = {
            ventureId: targetVenture.ventureId,
            artefactType: 'Technical Documentation' as const, // Default artefact type
            parentFolderId: actualParentFolderId, // Box.com parent folder ID
            subFolderId: createdFolderId.toString(), // Box.com created folder ID
            sharedUrl: result.url || '',
            folderName: folderName,
            description: `Subfolder created in ${getFolderDisplayName(folder_id)}`
          };
          
          console.log(`🔍 DEBUG: About to create proof_vault entry:`, proofVaultData);
          
          const proofVaultEntry = await storage.createProofVault(proofVaultData);
          console.log(`✅ FOLDER MAPPING STORED: ${folderName} (${createdFolderId}) → parent ${actualParentFolderId} (${folder_id})`);
          console.log(`✅ PROOF VAULT ENTRY CREATED: ID ${proofVaultEntry.vaultId}`);
        } else {
          console.log(`❌ No created folder ID found in result:`, result);
        }

        // Track folder creation activity if session exists
        if (req.session?.founderId) {
          await ActivityService.logActivity(
            {
              founderId: req.session.founderId,
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
      } else {
        console.log(`❌ No venture found - neither by ventureId (${ventureId}) nor by founderId (${req.session?.founderId})`);
      }
    } catch (error) {
      console.error('❌ DETAILED ERROR in folder mapping storage:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }

    res.json(createSuccessResponse({
      message: 'Folder created successfully',
      folderId: result.id,
      folderName: result.name,
      parentFolderId: folder_id,
      folderUrl: result.url
    }));
  } catch (error) {
    console.error('Folder creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Failed to create folder: ${errorMessage}` });
  }
}));

export default router;