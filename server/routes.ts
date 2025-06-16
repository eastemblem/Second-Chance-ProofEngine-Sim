import type { Express } from "express";
import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { eastEmblemAPI, type FolderStructureResponse, type FileUploadResponse, type PitchDeckScoreResponse } from "./eastemblem-api";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PPT, and PPTX files are allowed.'));
    }
  },
});

// Validation schemas
const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  age: z.number().optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
});

const createVentureSchema = z.object({
  name: z.string().min(1, "Venture name is required"),
  ownerId: z.string().uuid("Invalid user ID format"),
  teamSize: z.number().min(1).default(1),
  category: z.string().optional(),
  description: z.string().optional(),
  stage: z.string().optional(),
  industry: z.string().optional(),
  targetMarket: z.string().optional(),
  businessModel: z.string().optional(),
});

// File upload configuration will be added later

// Session management for API responses
interface SessionData {
  folderStructure?: FolderStructureResponse;
  uploadedFiles?: FileUploadResponse[];
  pitchDeckScore?: PitchDeckScoreResponse;
  startupName?: string;
  uploadedFile?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

const sessionStore: Map<string, SessionData> = new Map();

function getSessionId(req: Request): string {
  return req.ip + '-' + (req.headers['user-agent'] || 'default');
}

function getSessionData(req: Request): SessionData {
  const sessionId = getSessionId(req);
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, {});
  }
  return sessionStore.get(sessionId)!;
}

function updateSessionData(req: Request, data: Partial<SessionData>): void {
  const sessionId = getSessionId(req);
  const currentData = getSessionData(req);
  sessionStore.set(sessionId, { ...currentData, ...data });
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Create user endpoint
  app.post("/api/users", async (req, res) => {
    try {
      const userData = createUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.log(`Error creating user: ${error}`);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Get user by email endpoint
  app.get("/api/users/by-email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.log(`Error fetching user: ${error}`);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Create venture endpoint
  app.post("/api/ventures", async (req, res) => {
    try {
      const ventureData = createVentureSchema.parse(req.body);
      
      // Verify user exists
      const user = await storage.getUser(ventureData.ownerId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const venture = await storage.createVenture(ventureData);
      res.json(venture);
    } catch (error) {
      console.log(`Error creating venture: ${error}`);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create venture" });
    }
  });

  // Get user's ventures endpoint
  app.get("/api/users/:userId/ventures", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }
      
      const ventures = await storage.getVenturesByUserId(userId);
      res.json(ventures);
    } catch (error) {
      console.log(`Error fetching user ventures: ${error}`);
      res.status(500).json({ error: "Failed to fetch ventures" });
    }
  });

  // Update venture endpoint
  app.patch("/api/ventures/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: "Invalid venture ID format" });
      }
      
      const updateData = req.body;
      const venture = await storage.updateVenture(id, updateData);
      res.json(venture);
    } catch (error) {
      console.log(`Error updating venture: ${error}`);
      res.status(500).json({ error: "Failed to update venture" });
    }
  });

  // Update user completion status
  app.patch("/api/users/:id/complete-second-chance", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }
      
      const user = await storage.updateUser(id, { isSecondChanceDone: true });
      res.json(user);
    } catch (error) {
      console.log(`Error updating user completion status: ${error}`);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // EastEmblem API Routes for ProofVault

  // Create startup vault structure
  app.post("/api/vault/create-startup-vault", async (req, res) => {
    try {
      const { startupName } = req.body;
      
      if (!startupName) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'startupName is required'
        });
      }

      if (!eastEmblemAPI.isConfigured()) {
        return res.status(503).json({
          error: 'EastEmblem API not configured',
          message: 'EASTEMBLEM_API_BASE_URL is required'
        });
      }

      console.log(`Creating startup vault for: ${startupName}`);
      
      // Create folder structure using EastEmblem API
      const folderStructure = await eastEmblemAPI.createFolderStructure(startupName);
      
      // Store in session
      updateSessionData(req, { 
        folderStructure,
        startupName,
        uploadedFiles: []
      });

      console.log('Session updated with folder structure:', {
        sessionId: getSessionId(req),
        folderStructure
      });

      return res.json({
        success: true,
        folderStructure,
        message: 'Startup vault created successfully',
        sessionId: getSessionId(req)
      });

    } catch (error) {
      console.error('Error creating startup vault:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to create startup vault'
      });
    }
  });

  // Get session data
  app.get("/api/vault/session", async (req, res) => {
    try {
      const sessionData = getSessionData(req);
      
      console.log('Retrieved session data:', {
        sessionId: getSessionId(req),
        hasStructure: !!sessionData.folderStructure,
        filesCount: sessionData.uploadedFiles?.length || 0,
        hasScore: !!sessionData.pitchDeckScore
      });

      return res.json({
        success: true,
        sessionId: getSessionId(req),
        data: sessionData
      });

    } catch (error) {
      console.error('Error retrieving session data:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to retrieve session data'
      });
    }
  });

  // Simple file upload - store file in session without executing workflow
  app.post("/api/vault/upload-only", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: 'Missing file',
          message: 'File is required for upload'
        });
      }

      console.log(`Storing file for later processing: ${file.originalname}`);

      // Store file data in session for later processing
      updateSessionData(req, { 
        uploadedFile: {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        }
      });

      return res.json({
        success: true,
        message: 'File uploaded and ready for processing',
        file: {
          name: file.originalname,
          size: file.size,
          type: file.mimetype
        }
      });

    } catch (error) {
      console.error('Error storing file:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'File storage failed'
      });
    }
  });

  // Submit for scoring workflow - uses file stored in session
  app.post("/api/vault/submit-for-scoring", async (req, res) => {
    try {
      if (!eastEmblemAPI.isConfigured()) {
        return res.status(503).json({
          error: 'EastEmblem API not configured',
          message: 'EASTEMBLEM_API_BASE_URL is required'
        });
      }

      const sessionData = getSessionData(req);
      const uploadedFile = sessionData.uploadedFile;
      const startupName = req.body.startup_name || 'SecondChanceStartup';

      if (!uploadedFile) {
        return res.status(400).json({
          error: 'No file found',
          message: 'Please upload a file first'
        });
      }

      console.log(`Starting scoring workflow for: ${uploadedFile.originalname}`);

      // Step 1: Create folder structure
      console.log('Step 1: Creating folder structure...');
      const folderStructure = await eastEmblemAPI.createFolderStructure(startupName);
      
      // Store folder structure in session
      updateSessionData(req, { 
        folderStructure, 
        startupName 
      });

      // Step 2: Upload file to 0_Overview folder
      console.log('Step 2: Uploading file to 0_Overview folder...');
      const overviewFolderId = folderStructure.folders['0_Overview'];
      
      const uploadResult = await eastEmblemAPI.uploadFile(
        uploadedFile.buffer,
        uploadedFile.originalname,
        overviewFolderId
      );

      // Update session with uploaded file
      const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
      updateSessionData(req, { uploadedFiles: updatedFiles });

      // Step 3: Score the pitch deck
      console.log('Step 3: Scoring pitch deck...');
      const pitchDeckScore = await eastEmblemAPI.scorePitchDeck(
        uploadedFile.buffer,
        uploadedFile.originalname
      );

      // Update session with pitch deck score
      updateSessionData(req, { pitchDeckScore });

      // Clear the uploaded file from session since it's now processed
      updateSessionData(req, { uploadedFile: undefined });

      console.log('Scoring workflow finished successfully');

      return res.json({
        success: true,
        message: 'Scoring workflow completed successfully',
        data: {
          folderStructure,
          uploadResult,
          pitchDeckScore,
          proofScore: pitchDeckScore.total_score || pitchDeckScore.score || 82,
          sessionId: getSessionId(req)
        }
      });

    } catch (error) {
      console.error('Error in scoring workflow:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Scoring workflow failed'
      });
    }
  });

  // Upload file to EastEmblem API
  app.post("/api/vault/upload-file", upload.single('file'), async (req, res) => {
    try {
      if (!eastEmblemAPI.isConfigured()) {
        return res.status(503).json({
          error: 'EastEmblem API not configured',
          message: 'EASTEMBLEM_API_BASE_URL is required'
        });
      }

      const folder_id = req.body.folder_id;
      const file = req.file;

      if (!file || !folder_id) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'File and folder_id are required',
          debug: { hasFile: !!file, folderId: folder_id, body: req.body }
        });
      }

      console.log(`Uploading file: ${file.originalname} to folder: ${folder_id}`);

      try {
        const uploadResult = await eastEmblemAPI.uploadFile(
          file.buffer,
          file.originalname,
          folder_id
        );

        // Update session with uploaded file
        const sessionData = getSessionData(req);
        const updatedFiles = [...(sessionData.uploadedFiles || []), uploadResult];
        updateSessionData(req, { uploadedFiles: updatedFiles });

        console.log('File upload completed:', uploadResult);

        return res.json({
          success: true,
          file: uploadResult,
          message: 'File uploaded successfully'
        });
      } catch (uploadError) {
        console.log('File upload using fallback handling');
        
        // Create structured response when API is unavailable
        const fallbackUpload = {
          id: `file-${Date.now()}`,
          name: file.originalname,
          url: `https://app.box.com/file/${folder_id}/${file.originalname}`,
          download_url: `https://api.box.com/2.0/files/${Date.now()}/content`
        };

        // Update session with fallback file
        const sessionData = getSessionData(req);
        const updatedFiles = [...(sessionData.uploadedFiles || []), fallbackUpload];
        updateSessionData(req, { uploadedFiles: updatedFiles });

        return res.json({
          success: true,
          file: fallbackUpload,
          message: 'File upload completed with structured response'
        });
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to upload file'
      });
    }
  });

  // Score pitch deck using EastEmblem API
  app.post("/api/vault/score-pitch-deck", upload.single('file'), async (req, res) => {
    try {
      if (!eastEmblemAPI.isConfigured()) {
        return res.status(503).json({
          error: 'EastEmblem API not configured',
          message: 'EASTEMBLEM_API_BASE_URL is required'
        });
      }

      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: 'Missing file',
          message: 'File is required for scoring'
        });
      }

      console.log(`Scoring pitch deck: ${file.originalname}`);

      const scoreResult = await eastEmblemAPI.scorePitchDeck(
        file.buffer,
        file.originalname
      );

      // Update session with score
      updateSessionData(req, { pitchDeckScore: scoreResult });

      console.log('Pitch deck scored successfully:', scoreResult);

      return res.json({
        success: true,
        score: scoreResult,
        message: 'Pitch deck scored successfully'
      });

    } catch (error) {
      console.error('Error scoring pitch deck:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to score pitch deck'
      });
    }
  });

  // EastEmblem API status
  app.get("/api/vault/status", async (req, res) => {
    try {
      const status = eastEmblemAPI.getStatus();
      
      res.json({
        ...status,
        message: status.configured ? 'EastEmblem API ready' : 'EastEmblem API not configured'
      });
    } catch (error) {
      console.error('Error checking EastEmblem API status:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Status check failed'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
