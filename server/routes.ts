import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { boxService } from "./box-service";
import { replitStorageService } from "./replit-storage";
import multer from 'multer';
import { Readable } from "stream";
import fs from "fs";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log(`File filter check: ${file.originalname} ${file.mimetype}`);
    cb(null, true);
  }
});

export async function registerRoutes(app: express.Application): Promise<Server> {
  // User management routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userSchema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
      });

      const userData = userSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.json(existingUser);
      }

      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Venture management routes
  app.get("/api/ventures/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const venture = await storage.getVenture(id);
      
      if (!venture) {
        return res.status(404).json({ error: "Venture not found" });
      }
      
      res.json(venture);
    } catch (error) {
      console.error("Error fetching venture:", error);
      res.status(500).json({ error: "Failed to fetch venture" });
    }
  });

  app.get("/api/ventures/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const ventures = await storage.getVenturesByUserId(userId);
      res.json(ventures);
    } catch (error) {
      console.error("Error fetching user ventures:", error);
      res.status(500).json({ error: "Failed to fetch ventures" });
    }
  });

  app.post("/api/ventures", async (req, res) => {
    try {
      const ventureSchema = z.object({
        name: z.string().min(1),
        ownerId: z.string(),
        stage: z.string(),
        description: z.string().optional(),
        teamSize: z.number().optional(),
      });

      const ventureData = ventureSchema.parse(req.body);
      const venture = await storage.createVenture(ventureData);
      res.status(201).json(venture);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid venture data", details: error.errors });
      }
      console.error("Error creating venture:", error);
      res.status(500).json({ error: "Failed to create venture" });
    }
  });

  app.patch("/api/ventures/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = z.object({
        name: z.string().optional(),
        stage: z.string().optional(),
        description: z.string().optional(),
        teamSize: z.number().optional(),
        dataRoomUrl: z.string().optional(),
        pitchDeckUrl: z.string().optional(),
      });

      const updateData = updateSchema.parse(req.body);
      const venture = await storage.updateVenture(id, updateData);
      res.json(venture);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      console.error("Error updating venture:", error);
      res.status(500).json({ error: "Failed to update venture" });
    }
  });

  // Box Integration Routes
  
  // Box authentication status
  app.get("/api/box/status", async (req, res) => {
    try {
      const connected = await boxService.testConnection();
      const authStatus = boxService.getAuthStatus();
      
      res.json({ 
        connected, 
        authType: authStatus.type,
        available: authStatus.available,
        message: connected ? 'Box integration active' : 'Box integration requires valid credentials'
      });
    } catch (error) {
      console.log(`Box connection test failed: ${error}`);
      res.json({ 
        connected: false, 
        authType: 'none',
        available: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Box integration requires valid credentials'
      });
    }
  });

  // Box file upload endpoint
  app.post("/api/box/upload", upload.single('file'), async (req, res) => {
    try {
      console.log('Processing Box file upload...');
      
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { startupName, category } = req.body;
      if (!startupName) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please complete the form before uploading files'
        });
      }

      // Create ProofVault folder and upload file
      const proofVaultFolder = await boxService.createProofVaultFolder(startupName);
      const uploadResult = await boxService.uploadFile(
        req.file.originalname,
        req.file.buffer,
        proofVaultFolder.id
      );

      res.json({
        success: true,
        storage: 'box',
        file: {
          id: uploadResult.id,
          name: uploadResult.name,
          size: uploadResult.size,
          download_url: uploadResult.download_url
        },
        proofVaultFolder: proofVaultFolder
      });

    } catch (error) {
      console.error('Box upload error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Upload failed',
        storage: 'box-error'
      });
    }
  });

  // Legacy Box upload endpoint for backwards compatibility
  app.post("/api/box/jwt/upload", upload.single('file'), async (req, res) => {
    try {
      console.log('Processing Box file upload (legacy endpoint)...');
      
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { startupName, category } = req.body;
      if (!startupName) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please complete the form before uploading files'
        });
      }

      // Use Replit object storage for ProofVault
      const proofVaultFolder = await replitStorageService.createProofVaultFolder(startupName);
      const uploadResult = await replitStorageService.uploadFile(
        req.file.originalname,
        req.file.buffer,
        proofVaultFolder.id
      );

      return res.json({
        success: true,
        storage: 'replit-storage',
        file: {
          id: uploadResult.id,
          name: uploadResult.name,
          size: uploadResult.size,
          download_url: uploadResult.download_url
        },
        proofVaultFolder: proofVaultFolder
      });

    } catch (error) {
      console.error('Storage upload error:', error);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Upload failed',
        storage: 'replit-storage-error'
      });
    }
  });

  // Replit Storage Routes
  
  // Storage status endpoint
  app.get("/api/storage/status", async (req, res) => {
    try {
      const connected = await replitStorageService.testConnection();
      const storageStatus = replitStorageService.getStorageStatus();
      
      res.json({ 
        connected, 
        storageType: storageStatus.type,
        available: storageStatus.available,
        path: storageStatus.path,
        message: connected ? 'Replit storage active' : 'Storage system unavailable'
      });
    } catch (error) {
      console.log(`Storage test failed: ${error}`);
      res.json({ 
        connected: false, 
        storageType: 'none',
        available: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Storage system unavailable'
      });
    }
  });

  // File download endpoint
  app.get("/api/storage/download/:folderId/:fileName", async (req, res) => {
    try {
      const { folderId, fileName } = req.params;
      
      const fileBuffer = await replitStorageService.getFile(folderId, fileName);
      if (!fileBuffer) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Set appropriate headers for file download
      const fileExtension = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (fileExtension === '.pdf') contentType = 'application/pdf';
      else if (fileExtension === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (fileExtension === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (fileExtension === '.png') contentType = 'image/png';
      else if (fileExtension === '.jpg' || fileExtension === '.jpeg') contentType = 'image/jpeg';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error('File download error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Download failed'
      });
    }
  });

  // List files in a folder
  app.get("/api/storage/list/:folderId", async (req, res) => {
    try {
      const { folderId } = req.params;
      const files = await replitStorageService.listFiles(folderId);
      
      res.json({
        success: true,
        folderId,
        files
      });
    } catch (error) {
      console.error('File listing error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Listing failed'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}