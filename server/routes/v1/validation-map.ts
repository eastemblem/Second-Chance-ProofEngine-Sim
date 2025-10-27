import express, { Request, Response } from "express";
import { storage } from "../../storage";
import { asyncHandler, createSuccessResponse } from "../../utils/error-handler";
import { z } from "zod";
import { eastEmblemAPI } from "../../eastemblem-api";
import { appLogger } from "../../utils/logger";
import { AuthenticatedRequest } from "../../middleware/token-auth";
import { databaseService } from "../../services/database-service";

const router = express.Router();

// GET /api/validation-map/masters - Get all experiment masters
router.get(
  "/masters",
  asyncHandler(async (req: Request, res: Response) => {
    const founderId = (req as AuthenticatedRequest).user?.founderId;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const masters = await storage.getAllExperimentMasters();

    res.json(
      createSuccessResponse(
        masters,
        "Experiment masters retrieved successfully"
      )
    );
  })
);

// GET /api/validation-map - Get all experiments for authenticated user's venture
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const founderId = (req as AuthenticatedRequest).user?.founderId;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Get founder with latest venture
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({
        success: false,
        error: "No venture found. Please complete onboarding first.",
      });
    }

    const venture = dashboardData.venture;
    const ventureId = venture.ventureId;

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
        const output = apiResponse.output || {};
        
        const recommendations = {
          traction: output.traction?.recommendation || "",
          readiness: output.readiness?.recommendation || "",
          viability: output.viability?.recommendation || "",
          feasibility: output.feasibility?.recommendation || "",
          desirability: output.desirability?.recommendation || "",
        };

        appLogger.info("Extracted recommendations from fullApiResponse.output:", recommendations);

        // Call EastEmblem API for smart assignment
        const assignmentResponse = await eastEmblemAPI.getValidationMapAssignments(
          ventureId,
          venture.name,
          venture.proofScore || 0,
          recommendations
        );

        appLogger.info("EastEmblem assignment response:", assignmentResponse);

        // Extract experiment IDs from the mapping structure
        const mapping = assignmentResponse.output?.mapping || {};
        const experimentIds = new Set<string>();
        
        // Collect all unique experiment IDs from all dimensions
        Object.values(mapping).forEach((dimension: any) => {
          if (dimension.experiments && Array.isArray(dimension.experiments)) {
            dimension.experiments.forEach((id: string) => experimentIds.add(id));
          }
        });
        
        const recommendedExperimentIds = Array.from(experimentIds);
        
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
              newInsights: null,
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
          proofScore: venture.proofScore || 0,
          prooftags: venture.prooftags || [],
          status: venture.status || "Building Validation",
        },
        "Experiments retrieved successfully"
      )
    );
  })
);

// PATCH /api/validation-map/:id - Update experiment fields
router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const founderId = (req as AuthenticatedRequest).user?.founderId;
    const { id } = req.params;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Get founder's venture to verify ownership
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({
        success: false,
        error: "No venture found",
      });
    }

    const ventureId = dashboardData.venture.ventureId;
    
    const updateSchema = z.object({
      userHypothesis: z.string().optional(),
      results: z.string().optional(),
      decision: z.enum(["measure", "pivot", "persevere"]).optional(),
      customNotes: z.string().optional(),
      newInsights: z.string().optional(),
      status: z.enum(["not_started", "in_progress", "completed"]).optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    // Get experiment to verify it belongs to this venture
    const experiment = await storage.getVentureExperiment(id);
    if (!experiment || experiment.ventureId !== ventureId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

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

    // If experiment is being marked as completed, add its ProofTag to venture
    if (validatedData.status === "completed" && experiment.status !== "completed") {
      try {
        const experimentMaster = await storage.getExperimentMaster(experiment.experimentId);
        if (experimentMaster?.proofTag) {
          const venture = await storage.getVenture(ventureId);
          if (!venture) {
            throw new Error("Venture not found");
          }
          const currentProofTags = venture.prooftags || [];
          
          // Add ProofTag if not already present (deduplication)
          if (!currentProofTags.includes(experimentMaster.proofTag)) {
            const updatedProofTags = [...currentProofTags, experimentMaster.proofTag];
            await storage.updateVenture(ventureId, {
              prooftags: updatedProofTags,
              updatedAt: new Date()
            });
            appLogger.info(`Added ProofTag "${experimentMaster.proofTag}" to venture ${ventureId}`);
          }
        }
      } catch (error) {
        appLogger.error("Failed to add ProofTag to venture:", error);
        // Don't fail the experiment update if ProofTag update fails
      }
    }

    res.json(
      createSuccessResponse(
        updatedExperiment,
        "Experiment updated successfully"
      )
    );
  })
);

// POST /api/validation-map - Create new experiment
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const founderId = (req as AuthenticatedRequest).user?.founderId;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Get founder's venture
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({
        success: false,
        error: "No venture found",
      });
    }

    const ventureId = dashboardData.venture.ventureId;

    const createSchema = z.object({
      experimentId: z.string().min(1, "Experiment ID is required"),
    });

    const validatedData = createSchema.parse(req.body);

    // Verify experiment master exists
    const master = await storage.getExperimentMaster(validatedData.experimentId);
    if (!master) {
      return res.status(404).json({
        success: false,
        error: "Experiment not found in master list",
      });
    }

    // Check if experiment already exists for this venture
    const existingExperiments = await storage.getVentureExperiments(ventureId);
    const alreadyExists = existingExperiments?.some(
      (exp) => exp.experimentId === validatedData.experimentId
    );

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        error: "This experiment is already added to your validation map",
      });
    }

    const newExperiment = await storage.createVentureExperiment({
      ventureId,
      experimentId: validatedData.experimentId,
      status: "not_started",
      userHypothesis: null,
      results: null,
      decision: null,
      customNotes: null,
      newInsights: null,
    });

    appLogger.info(`Created new experiment ${validatedData.experimentId} for venture ${ventureId}`);

    res.json(
      createSuccessResponse(
        newExperiment,
        "Experiment added successfully"
      )
    );
  })
);

// POST /api/validation-map/custom - Create custom experiment
router.post(
  "/custom",
  asyncHandler(async (req: Request, res: Response) => {
    const founderId = (req as AuthenticatedRequest).user?.founderId;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Get founder's venture
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({
        success: false,
        error: "No venture found",
      });
    }

    const ventureId = dashboardData.venture.ventureId;

    const customExperimentSchema = z.object({
      name: z.string().min(1, "Name is required"),
      definition: z.string().min(1, "Definition is required"),
      hypothesisTested: z.string().min(1, "Hypothesis tested is required"),
      experimentFormat: z.string().min(1, "Experiment format is required"),
      signalTracked: z.string().min(1, "Signal tracked is required"),
      targetMetric: z.string().min(1, "Target metric is required"),
      toolsPlatforms: z.string().optional(),
      typicalDuration: z.string().optional(),
      notes: z.string().optional(),
    });

    const validatedData = customExperimentSchema.parse(req.body);

    // Generate a unique experiment ID for the custom experiment
    const customExperimentId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create custom experiment master
    const customMaster = await storage.createExperimentMaster({
      experimentId: customExperimentId,
      validationSphere: "Custom",
      name: validatedData.name,
      definition: validatedData.definition,
      hypothesisTested: validatedData.hypothesisTested,
      experimentFormat: validatedData.experimentFormat,
      signalTracked: validatedData.signalTracked,
      targetMetric: validatedData.targetMetric,
      toolsPlatforms: validatedData.toolsPlatforms || null,
      typicalDuration: validatedData.typicalDuration || null,
      notes: validatedData.notes || null,
      proofTag: null, // Custom experiments don't have ProofTags
    });

    if (!customMaster) {
      return res.status(500).json({
        success: false,
        error: "Failed to create custom experiment master",
      });
    }

    // Create venture experiment linked to the custom master
    const newExperiment = await storage.createVentureExperiment({
      ventureId,
      experimentId: customExperimentId,
      status: "not_started",
      userHypothesis: null,
      results: null,
      decision: null,
      customNotes: null,
      newInsights: null,
    });

    appLogger.info(`Created custom experiment ${customExperimentId} for venture ${ventureId}`);

    res.json(
      createSuccessResponse(
        newExperiment,
        "Custom experiment created successfully"
      )
    );
  })
);

// DELETE /api/validation-map/:id - Delete experiment
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const founderId = (req as AuthenticatedRequest).user?.founderId;
    const { id } = req.params;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Get founder's venture to verify ownership
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({
        success: false,
        error: "No venture found",
      });
    }

    const ventureId = dashboardData.venture.ventureId;

    // Get experiment to verify it belongs to this venture
    const experiment = await storage.getVentureExperiment(id);
    if (!experiment || experiment.ventureId !== ventureId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    await storage.deleteVentureExperiment(id);

    appLogger.info(`Deleted experiment ${id} for venture ${ventureId}`);

    res.json(
      createSuccessResponse(
        { id },
        "Experiment deleted successfully"
      )
    );
  })
);

// POST /api/validation-map/:id/complete - Mark experiment as complete
router.post(
  "/:id/complete",
  asyncHandler(async (req: Request, res: Response) => {
    const founderId = (req as AuthenticatedRequest).user?.founderId;
    const { id } = req.params;

    if (!founderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Get founder's venture to verify ownership
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({
        success: false,
        error: "No venture found",
      });
    }

    const ventureId = dashboardData.venture.ventureId;

    // Get experiment to verify it belongs to this venture
    const experiment = await storage.getVentureExperiment(id);
    if (!experiment || experiment.ventureId !== ventureId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const completedExperiment = await storage.completeVentureExperiment(id);

    if (!completedExperiment) {
      return res.status(404).json({
        success: false,
        error: "Experiment not found",
      });
    }

    // Add ProofTag to venture when experiment is completed
    let proofTagAdded = null;
    try {
      const experimentMaster = await storage.getExperimentMaster(experiment.experimentId);
      if (experimentMaster?.proofTag) {
        const venture = await storage.getVenture(ventureId);
        if (!venture) {
          throw new Error("Venture not found");
        }
        const currentProofTags = venture.prooftags || [];
        
        appLogger.info(`🔍 COMPLETE FLOW: Before update - Venture ${ventureId} has ${currentProofTags.length} ProofTags`);
        
        // Add ProofTag if not already present (deduplication)
        if (!currentProofTags.includes(experimentMaster.proofTag)) {
          const updatedProofTags = [...currentProofTags, experimentMaster.proofTag];
          
          appLogger.info(`➕ COMPLETE FLOW: Adding ProofTag "${experimentMaster.proofTag}" (total will be ${updatedProofTags.length})`);
          
          await storage.updateVenture(ventureId, {
            prooftags: updatedProofTags,
            updatedAt: new Date()
          });
          
          proofTagAdded = experimentMaster.proofTag;
          appLogger.info(`✅ COMPLETE FLOW: ProofTag "${experimentMaster.proofTag}" added to venture ${ventureId} (NEW TOTAL: ${updatedProofTags.length})`);
          
          // CRITICAL: Invalidate BOTH 'founder' and 'dashboard' caches
          // The validation API uses 'founder' cache, so we MUST clear it!
          const { lruCacheService } = await import("../../services/lru-cache-service");
          await lruCacheService.invalidate('founder', founderId);
          await lruCacheService.invalidate('dashboard', founderId);
          appLogger.info(`🗑️ COMPLETE FLOW: Both 'founder' and 'dashboard' caches invalidated for founder ${founderId}`);
        } else {
          appLogger.info(`⏭️ COMPLETE FLOW: ProofTag "${experimentMaster.proofTag}" already exists, skipping`);
        }
      }
    } catch (error) {
      appLogger.error("❌ COMPLETE FLOW: Failed to add ProofTag to venture:", error);
    }

    res.json(
      createSuccessResponse(
        {
          experiment: completedExperiment,
          proofTag: proofTagAdded,
        },
        "Experiment completed successfully"
      )
    );
  })
);

export default router;
