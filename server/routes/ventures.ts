import { Router } from "express";
import { storage } from "../storage";
import { asyncHandler, createSuccessResponse } from "../utils/error-handler";
import { validateRequestBody } from "../utils/validation";
import { validateUUID, requireBody } from "../middleware/auth";
import { createInsertSchema } from "drizzle-zod";
import { venture } from "@shared/schema";

const router = Router();

// Create venture schema
const createVentureSchema = createInsertSchema(venture).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Create venture endpoint
router.post("/", requireBody, asyncHandler(async (req, res) => {
  const ventureData = validateRequestBody(createVentureSchema, req.body);

  // Verify founder exists
  const founder = await storage.getFounder(ventureData.founderId);
  if (!founder) {
    throw new Error("Founder not found");
  }

  const newVenture = await storage.createVenture(ventureData);
  res.json(createSuccessResponse(newVenture, "Venture created successfully"));
}));

// Get founder's ventures endpoint
router.get("/founder/:founderId", validateUUID('founderId'), asyncHandler(async (req, res) => {
  const { founderId } = req.params;
  const ventures = await storage.getVenturesByFounderId(founderId);
  
  res.json(createSuccessResponse({
    ventures,
    count: ventures.length
  }));
}));

// Update venture endpoint
router.patch("/:id", validateUUID('id'), requireBody, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  const venture = await storage.updateVenture(id, updateData);
  res.json(createSuccessResponse(venture, "Venture updated successfully"));
}));

export default router;