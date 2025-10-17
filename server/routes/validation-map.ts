import express from "express";
import { storage } from "../storage";
import { asyncHandler, createSuccessResponse } from "../utils/error-handler";
import { z } from "zod";
import { eastEmblemAPI } from "../eastemblem-api";
import { appLogger } from "../utils/logger";

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

    // Smart experiment assignment on first visit
    if (!experiments || experiments.length === 0) {
      appLogger.info(`First visit to validation map for venture ${ventureId}, initiating smart assignment`);
      
      try {
        // Get latest evaluation with recommendations
        const evaluation = await storage.getLatestEvaluationByVentureId(ventureId);
        
        if (!evaluation || !evaluation.fullApiResponse) {
          appLogger.warn(`No evaluation found for venture ${ventureId}, cannot assign experiments`);
          return res.status(400).json({
            success: false,
            error: "Please complete pitch deck scoring first to get personalized experiments.",
          });
        }

        // Extract recommendations from fullApiResponse
        const apiResponse = evaluation.fullApiResponse as any;
        const recommendations = {
          traction: apiResponse.traction?.recommendation || "",
          readiness: apiResponse.readiness?.recommendation || "",
          viability: apiResponse.viability?.recommendation || "",
          feasibility: apiResponse.feasibility?.recommendation || "",
          desirability: apiResponse.desirability?.recommendation || "",
        };

        appLogger.info("Extracted recommendations:", recommendations);

        // Call EastEmblem API for smart assignment
        const assignmentResponse = await eastEmblemAPI.getValidationMapAssignments(
          ventureId,
          venture.name,
          venture.proofScore || 0,
          recommendations
        );

        appLogger.info("EastEmblem assignment response:", assignmentResponse);

        // Parse recommended experiment IDs from response
        const recommendedExperimentIds = assignmentResponse.recommended_experiments || [];
        
        if (!recommendedExperimentIds || recommendedExperimentIds.length === 0) {
          appLogger.warn("No experiments recommended by EastEmblem API");
          return res.status(400).json({
            success: false,
            error: "No experiments recommended. Please contact support.",
          });
        }

        appLogger.info(`Creating ${recommendedExperimentIds.length} recommended experiments:`, recommendedExperimentIds);

        // Get experiment masters for validation
        const allMasters = await storage.getAllExperimentMasters();
        const masterMap = new Map(allMasters.map(m => [m.experimentId, m]));

        // Create venture experiments only for recommended IDs
        const createdExperiments = await Promise.all(
          recommendedExperimentIds.map(async (experimentId: string) => {
            const master = masterMap.get(experimentId);
            if (!master) {
              appLogger.warn(`Experiment master not found for ID: ${experimentId}`);
              return null;
            }

            return await storage.createVentureExperiment({
              ventureId,
              experimentId,
              status: "not_started",
              userHypothesis: null,
              results: null,
              decision: null,
              customNotes: null,
            });
          })
        );

        // Filter out null values
        experiments = createdExperiments.filter(exp => exp !== null);
        
        appLogger.info(`Successfully created ${experiments.length} personalized experiments for venture ${ventureId}`);
      } catch (error) {
        appLogger.error("Error during smart experiment assignment:", error);
        
        // Fallback: return empty array with helpful message
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Failed to assign experiments. Please try again.",
        });
      }
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
