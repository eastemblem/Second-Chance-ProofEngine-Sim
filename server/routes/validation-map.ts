import express from "express";
import { storage } from "../storage";
import { asyncHandler, createSuccessResponse } from "../utils/error-handler";
import { z } from "zod";

const router = express.Router();

// GET /api/validation-map/:ventureId - Get all experiments for a venture
router.get(
  "/:ventureId",
  asyncHandler(async (req, res) => {
    const { ventureId } = req.params;

    if (!ventureId) {
      return res.status(400).json({
        success: false,
        error: "Venture ID is required",
      });
    }

    // Check if venture exists
    const venture = await storage.getVenture(ventureId);
    if (!venture) {
      return res.status(404).json({
        success: false,
        error: "No venture found. Please complete onboarding first.",
      });
    }

    let experiments = await storage.getVentureExperiments(ventureId);

    // Auto-create experiments if visiting for the first time
    if (!experiments || experiments.length === 0) {
      const allExperimentMasters = await storage.getAllExperimentMasters();
      
      // Create venture experiments for all master experiments
      const createdExperiments = await Promise.all(
        allExperimentMasters.map(async (master) => {
          return await storage.createVentureExperiment({
            ventureId,
            experimentId: master.experimentId,
            status: "not_started",
            userHypothesis: null,
            results: null,
            decision: null,
            customNotes: null,
          });
        })
      );

      experiments = createdExperiments;
    }

    res.json(
      createSuccessResponse(
        {
          experiments,
          ventureId,
        },
        "Experiments retrieved successfully"
      )
    );
  })
);

// PATCH /api/validation-map/:id - Update experiment fields
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const updateSchema = z.object({
      userHypothesis: z.string().optional(),
      results: z.string().optional(),
      decision: z.enum(["measure", "build", "pivot", "stop"]).optional(),
      customNotes: z.string().optional(),
      status: z.enum(["not_started", "in_progress", "completed"]).optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    const updatedExperiment = await storage.updateVentureExperiment(
      id,
      validatedData
    );

    if (!updatedExperiment) {
      return res.status(404).json({
        success: false,
        error: "Experiment not found",
      });
    }

    res.json(
      createSuccessResponse(
        updatedExperiment,
        "Experiment updated successfully"
      )
    );
  })
);

// POST /api/validation-map/:id/complete - Mark experiment as complete
router.post(
  "/:id/complete",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const completedExperiment = await storage.completeVentureExperiment(id);

    if (!completedExperiment) {
      return res.status(404).json({
        success: false,
        error: "Experiment not found",
      });
    }

    // Calculate ProofScore increase (+5 per completion)
    const proofScoreIncrease = 5;
    
    // Get venture to update ProofScore
    const ventureId = completedExperiment.ventureId;
    const venture = await storage.getVenture(ventureId);
    
    if (venture) {
      const currentProofScore = venture.proofScore || 0;
      const newProofScore = Math.min(currentProofScore + proofScoreIncrease, 100);
      
      await storage.updateVenture(ventureId, {
        proofScore: newProofScore,
        updatedAt: new Date(),
      });
    }

    res.json(
      createSuccessResponse(
        {
          experiment: completedExperiment,
          proofScoreIncrease,
          proofTag: completedExperiment.masterData?.proofTag,
        },
        "Experiment completed successfully"
      )
    );
  })
);

export default router;
