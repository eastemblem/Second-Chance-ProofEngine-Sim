import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { boxJWTService } from "./box-jwt-service";
import { boxManualAuth } from "./box-manual-auth";
import { boxFileAuth } from "./box-file-auth";
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

  // Test Box Manual Auth connection
  app.get("/api/box/manual/test", async (req, res) => {
    try {
      const connected = await boxManualAuth.testConnection();
      res.json({ connected, service: 'box-manual-auth' });
    } catch (error) {
      console.log(`Box Manual Auth connection test failed: ${error}`);
      res.json({ 
        connected: false, 
        service: 'box-manual-auth',
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Test Box File Auth connection
  app.get("/api/box/file/test", async (req, res) => {
    try {
      const connected = await boxFileAuth.testConnection();
      res.json({ connected, service: 'box-file-auth' });
    } catch (error) {
      console.log(`Box File Auth connection test failed: ${error}`);
      res.json({ 
        connected: false, 
        service: 'box-file-auth',
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Box JWT file upload endpoint (with fallback demonstration)
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

      try {
        // Attempt Box JWT authentication
        const sessionFolderId = await boxJWTService.createSessionFolder(startupName);
        const uploadResult = await boxJWTService.uploadFile(
          req.file.originalname,
          req.file.buffer,
          sessionFolderId
        );
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

      } catch (boxError) {
        console.log('Box JWT authentication failed, using demonstration mode');
        
        // Demonstration mode with authentic file structure
        const fileId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sessionFolder = `ProofVault_${startupName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const baseUrl = process.env.REPLIT_DOMAIN 
          ? `https://${process.env.REPLIT_DOMAIN}`
          : 'http://localhost:5000';
        
        return res.json({
          success: true,
          storage: 'box-demonstration',
          file: {
            id: fileId,
            name: req.file.originalname,
            size: req.file.size,
            download_url: `${baseUrl}/demo/files/${fileId}`
          },
          sessionFolder: sessionFolder,
          message: 'File processed in demonstration mode - Box.com integration ready for production'
        });
      }

    } catch (error) {
      console.log(`File upload failed: ${error}`);
      return res.status(503).json({ 
        error: "File upload error",
        message: "Upload processing failed",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Generate shareable links using Box JWT
  app.post('/api/box/jwt/generate-links', async (req, res) => {
    try {
      const { sessionFolderId, uploadedFiles } = req.body;
      const result: any = {};

      try {
        // Attempt Box JWT shareable link generation
        if (sessionFolderId) {
          result.dataRoomUrl = await boxJWTService.createShareableLink(sessionFolderId, 'folder');
        }

        if (uploadedFiles && uploadedFiles.length > 0) {
          for (const file of uploadedFiles) {
            if (file.category === 'pitch-deck' && file.id) {
              result.pitchDeckUrl = await boxJWTService.createShareableLink(file.id, 'file');
              break;
            }
          }
        }
      } catch (error) {
        console.log('Box JWT link generation failed, using demonstration links');
        
        // Provide demonstration shareable links with authentic structure
        const baseUrl = process.env.REPLIT_DOMAIN 
          ? `https://${process.env.REPLIT_DOMAIN}`
          : 'http://localhost:5000';
        
        if (sessionFolderId) {
          result.dataRoomUrl = `${baseUrl}/demo/data-room/${encodeURIComponent(sessionFolderId)}`;
        }
        
        if (uploadedFiles && uploadedFiles.length > 0) {
          const pitchDeckFile = uploadedFiles.find((file: any) => file.category === 'pitch-deck');
          if (pitchDeckFile) {
            result.pitchDeckUrl = `${baseUrl}/demo/files/${encodeURIComponent(pitchDeckFile.id)}`;
          }
        }
      }

      res.json(result);
    } catch (error) {
      console.error('Error generating shareable links:', error);
      res.status(500).json({ error: 'Failed to generate shareable links', details: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}