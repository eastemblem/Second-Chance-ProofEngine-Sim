import type { Express } from "express";
import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { eastEmblemAPI, type FolderStructureResponse, type FileUploadResponse, type PitchDeckScoreResponse } from "./eastemblem-api";

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
