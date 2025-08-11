import { Router } from "express";
import { storage } from "../storage";
import { asyncHandler, createSuccessResponse } from "../utils/error-handler";
import { validateRequestBody, commonSchemas } from "../utils/validation";
import { validateUUID, requireBody } from "../middleware/auth";
import { createInsertSchema } from "drizzle-zod";
import { founder } from "@shared/schema";

const router = Router();

// Create founder schema
const createFounderSchema = createInsertSchema(founder).omit({
  createdAt: true,
  updatedAt: true,
});

// Create founder endpoint
router.post("/", requireBody, asyncHandler(async (req, res) => {
  const founderData = validateRequestBody(createFounderSchema, req.body);

  // Check if founder already exists
  const existingFounder = await storage.getFounderByEmail(founderData.email);
  if (existingFounder) {
    throw new Error("Founder with this email already exists");
  }

  const newFounder = await storage.createFounder(founderData);
  res.json(createSuccessResponse(newFounder, "Founder created successfully"));
}));

// Get founder by email endpoint
router.get("/by-email/:email", asyncHandler(async (req, res) => {
  const email = validateRequestBody(commonSchemas.email, req.params.email);
  const founder = await storage.getFounderByEmail(email);

  if (!founder) {
    throw new Error("Founder not found");
  }

  res.json(createSuccessResponse(founder));
}));

// Update founder endpoint
router.patch("/:id", validateUUID('id'), requireBody, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const founder = await storage.updateFounder(id, updateData);
  res.json(createSuccessResponse(founder, "Founder updated successfully"));
}));

export default router;