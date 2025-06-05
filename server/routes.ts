import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

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
  ownerId: z.number(),
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
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
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
      const ventureId = parseInt(req.params.id);
      if (isNaN(ventureId)) {
        return res.status(400).json({ error: "Invalid venture ID" });
      }
      
      const updateData = req.body;
      const venture = await storage.updateVenture(ventureId, updateData);
      res.json(venture);
    } catch (error) {
      console.log(`Error updating venture: ${error}`);
      res.status(500).json({ error: "Failed to update venture" });
    }
  });

  // Update user completion status
  app.patch("/api/users/:id/complete-second-chance", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.updateUser(userId, { isSecondChanceDone: true });
      res.json(user);
    } catch (error) {
      console.log(`Error updating user completion status: ${error}`);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
