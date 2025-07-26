import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/error-handler';
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
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, PPT, and PPTX files are allowed."));
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

// Create folder endpoint - Missing from v1 vault route
router.post('/create-folder', upload.none(), asyncHandler(async (req, res) => {
  const { folderName, folder_id, ventureId } = req.body;
  
  if (!folderName || !folder_id) {
    return res.status(400).json({ error: 'folderName and folder_id are required' });
  }

  try {
    // Map category to actual Box.com folder ID if needed
    let actualParentFolderId = folder_id;
    
    console.log(`🔍 V1 Folder creation - Input folder_id: '${folder_id}' (type: ${typeof folder_id})`);
    
    const categoryToFolderMap: Record<string, string> = {
      '0_Overview': '332844784735',
      '1_Problem_Proof': '332844933261', 
      '2_Solution_Proof': '332842993678',
      '3_Demand_Proof': '332843828465',
      '4_Credibility_Proof': '332843291772',
      '5_Commercial_Proof': '332845124499',
      '6_Investor_Pack': '332842251627'
    };
    
    console.log(`🗂️ V1 Available mappings:`, Object.keys(categoryToFolderMap));
    console.log(`🔍 V1 Looking up mapping for '${folder_id}':`, categoryToFolderMap[folder_id]);
    
    if (categoryToFolderMap[folder_id]) {
      actualParentFolderId = categoryToFolderMap[folder_id];
      console.log(`✅ V1 Mapped parent category '${folder_id}' to Box.com folder ID '${actualParentFolderId}'`);
    } else {
      console.log(`⚠️ V1 No mapping found for '${folder_id}', using directly: '${actualParentFolderId}'`);
    }

    // Create FormData for EastEmblem API
    const formData = new FormData();
    formData.append('folderName', folderName);
    formData.append('folder_id', actualParentFolderId);

    // Call EastEmblem folder creation API using environment variable
    const apiBaseUrl = process.env.EASTEMBLEM_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error('EASTEMBLEM_API_BASE_URL environment variable is not configured');
    }
    
    const folderCreateUrl = `${apiBaseUrl}/webhook/vault/folder/create`;
    console.log(`🔄 V1 Creating folder "${folderName}" in parent folder ${actualParentFolderId} via ${folderCreateUrl}`);
    
    const response = await fetch(folderCreateUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ V1 Folder creation failed: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`EastEmblem API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ V1 Folder creation successful:`, result);
    
    res.json(createSuccessResponse({
      folderId: result.folderId || result.id,
      folderName: folderName,
      parentFolderId: actualParentFolderId,
      message: 'Folder created successfully'
    }, "V1 Folder creation completed"));

  } catch (error) {
    console.error('V1 Folder creation error:', error);
    throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}));

export default router;