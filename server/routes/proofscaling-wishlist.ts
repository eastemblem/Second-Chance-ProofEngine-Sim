import express from "express";
import { insertProofScalingWishlistSchema } from "@shared/schema";
import { storage } from "../storage";
import { asyncHandler, createSuccessResponse } from "../utils/error-handler";
import { appLogger } from "../utils/logger";

const router = express.Router();

// POST /api/proofscaling-wishlist - Join the wishlist
router.post("/", asyncHandler(async (req, res) => {
  try {
    // Validate the request body
    const validatedData = insertProofScalingWishlistSchema.parse(req.body);
    
    // Check if email already exists
    const emailExists = await storage.checkProofScalingWishlistEmailExists(validatedData.email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        error: "Email already exists in the waitlist"
      });
    }
    
    // Create the wishlist entry
    const wishlistEntry = await storage.createProofScalingWishlistEntry(validatedData);
    
    appLogger.business(`New ProofScaling wishlist entry created: ${validatedData.email}`, {
      fullName: validatedData.fullName,
      companyName: validatedData.companyName,
      organizationStage: validatedData.organizationStage
    });
    
    res.json(createSuccessResponse({
      id: wishlistEntry.id,
      message: "Successfully joined the ProofScaling waitlist"
    }, "Wishlist entry created successfully"));
    
  } catch (error) {
    appLogger.error("Failed to create ProofScaling wishlist entry:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: "Invalid form data",
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to join waitlist"
    });
  }
}));

// GET /api/proofscaling-wishlist - Get all wishlist entries
router.get("/", asyncHandler(async (req, res) => {
  try {
    const wishlistEntries = await storage.getAllProofScalingWishlistEntries();
    
    res.json(createSuccessResponse({
      entries: wishlistEntries,
      total: wishlistEntries.length
    }, "Wishlist entries retrieved successfully"));
    
  } catch (error) {
    appLogger.error("Failed to retrieve ProofScaling wishlist entries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve wishlist entries"
    });
  }
}));

export default router;