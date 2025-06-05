import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { boxService, upload } from "./box-service";
import { Readable } from "stream";

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

  // Box.com Integration Routes
  
  // Test Box connection
  app.get("/api/box/test", async (req, res) => {
    try {
      const isConnected = await boxService.testConnection();
      res.json({ connected: isConnected });
    } catch (error) {
      console.log(`Box connection test failed: ${error}`);
      res.status(500).json({ error: "Box connection failed" });
    }
  });

  // Upload document to Box
  app.post("/api/box/upload/:userId", upload.single('document'), async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Validate user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create user folder if it doesn't exist (we'll store folder ID in user record later)
      const folderName = `${user.firstName}_${user.lastName}_${userId}`;
      const folderId = await boxService.createUserFolder(userId, folderName);

      // Convert buffer to stream for Box upload
      const fileStream = Readable.from(req.file.buffer);
      
      // Upload file to Box
      const uploadResult = await boxService.uploadFile(
        folderId,
        req.file.originalname,
        fileStream
      );

      // Store document info in database
      const documentData = {
        userId: userId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        boxFileId: uploadResult.id,
        boxFolderId: folderId,
        uploadedAt: new Date()
      };

      // Here we would normally save to proofVaultDocuments table
      // For now, return the upload result
      res.json({
        success: true,
        file: {
          id: uploadResult.id,
          name: req.file.originalname,
          downloadUrl: uploadResult.downloadUrl
        }
      });

    } catch (error) {
      console.log(`Error uploading file to Box: ${error}`);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Get user's documents from Box
  app.get("/api/box/documents/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Validate user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // For now, we'll try to get documents from a standard folder
      // In production, we'd store the folder ID in the user record
      try {
        const folderName = `${user.firstName}_${user.lastName}_${userId}`;
        // This is simplified - in production we'd store folder IDs
        const documents = [];
        res.json({ documents });
      } catch (error) {
        res.json({ documents: [] });
      }

    } catch (error) {
      console.log(`Error getting user documents: ${error}`);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Delete document from Box
  app.delete("/api/box/document/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      
      const deleted = await boxService.deleteFile(fileId);
      
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "File not found or could not be deleted" });
      }
    } catch (error) {
      console.log(`Error deleting file: ${error}`);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
