import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { boxJWTService } from "./box-jwt-service";
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

  // Box JWT Routes (Primary Authentication Method)
  
  // Test Box JWT connection
  app.get("/api/box/jwt/test", async (req, res) => {
    try {
      const connected = await boxJWTService.testConnection();
      res.json({ connected, service: 'box-jwt' });
    } catch (error) {
      console.log(`Box JWT connection test failed: ${error}`);
      res.json({ 
        connected: false, 
        service: 'box-jwt',
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Box JWT file upload endpoint (automatic authentication)
  app.post("/api/box/jwt/upload", upload.single('file'), async (req, res) => {
    try {
      console.log('Processing Box JWT file upload...');
      
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

      // Create session folder for this startup using JWT service
      const sessionFolderId = await boxJWTService.createSessionFolder(startupName);
      console.log(`JWT Session folder created/found: ${sessionFolderId} for startup: ${startupName}`);

      // Upload file using JWT service
      const uploadResult = await boxJWTService.uploadFile(
        req.file.originalname,
        req.file.buffer,
        sessionFolderId
      );

      // Generate shareable link
      const shareableLink = await boxJWTService.createShareableLink(uploadResult.id, 'file');

      return res.json({
        success: true,
        storage: 'box-jwt',
        file: {
          id: uploadResult.id,
          name: uploadResult.name,
          size: uploadResult.size,
          download_url: shareableLink
        },
        sessionFolder: sessionFolderId
      });

    } catch (error) {
      console.log(`Box JWT upload failed: ${error}`);
      return res.status(503).json({ 
        error: "Box JWT integration error",
        message: "File upload failed",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Generate shareable links using Box JWT
  app.post('/api/box/jwt/generate-links', async (req, res) => {
    try {
      const { sessionFolderId, uploadedFiles } = req.body;
      const result: any = {};

      // Generate folder shareable link for data room
      if (sessionFolderId) {
        try {
          result.dataRoomUrl = await boxJWTService.createShareableLink(sessionFolderId, 'folder');
        } catch (error) {
          console.error('Error creating JWT folder shareable link:', error);
        }
      }

      // Generate file shareable links for pitch deck
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          if (file.category === 'pitch-deck' && file.id) {
            try {
              result.pitchDeckUrl = await boxJWTService.createShareableLink(file.id, 'file');
              break;
            } catch (error) {
              console.error('Error creating JWT file shareable link:', error);
            }
          }
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Error generating JWT shareable links:', error);
      res.status(500).json({ error: 'Failed to generate shareable links', details: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}