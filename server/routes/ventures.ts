import { Router } from "express";
import { storage } from "../storage";
import { asyncHandler, createSuccessResponse } from "../utils/error-handler";
import { validateRequestBody } from "../utils/validation";
import { validateUUID, requireBody } from "../middleware/auth";
import { createInsertSchema } from "drizzle-zod";
import { venture } from "@shared/schema";
import { onboardingNotificationService } from "../services/onboardingNotificationService";
import { z } from "zod";

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

// Update venture status endpoint (for payment success)
const updateStatusSchema = z.object({
  ventureId: z.string().uuid(),
  status: z.enum(['pending', 'reviewing', 'reviewed', 'done']),
  paymentData: z.object({
    amount: z.string(),
    date: z.string(),
    reference: z.string()
  }).optional()
});

router.post("/update-status", requireBody, asyncHandler(async (req, res) => {
  const { ventureId, status, paymentData } = validateRequestBody(updateStatusSchema, req.body);

  // Update venture status
  const updatedVenture = await storage.updateVenture(ventureId, { status });
  
  if (!updatedVenture) {
    throw new Error("Venture not found or update failed");
  }

  // If status is 'reviewing' and payment data is provided, send notification email
  if (status === 'reviewing' && paymentData) {
    try {
      // Get founder details for the venture
      const founder = await storage.getFounder(updatedVenture.founderId);
      
      if (founder) {
        const notificationData = {
          founderName: founder.fullName,
          founderEmail: founder.email,
          founderRole: founder.positionRole,
          ventureName: updatedVenture.name,
          ventureIndustry: updatedVenture.industry,
          ventureStage: updatedVenture.revenueStage,
          ventureDescription: updatedVenture.description,
          ventureWebsite: updatedVenture.website,
          boxUrl: updatedVenture.folderStructure ? 'Available in ProofVault' : undefined,
          paymentAmount: paymentData.amount,
          paymentDate: new Date(paymentData.date).toLocaleDateString(),
          paymentReference: paymentData.reference,
          maskedPaymentDetails: `Transaction completed successfully - Ref: ${paymentData.reference.slice(-8)}`
        };

        await onboardingNotificationService.sendOnboardingSuccessNotification(notificationData);
      }
    } catch (emailError) {
      console.error('Failed to send onboarding notification:', emailError);
      // Don't fail the request if email fails
    }
  }

  res.json(createSuccessResponse(updatedVenture, "Venture status updated successfully"));
}));

export default router;