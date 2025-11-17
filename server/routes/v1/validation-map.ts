import express, { Request, Response } from "express";
import { storage } from "../../storage";
import { asyncHandler, createSuccessResponse } from "../../utils/error-handler";
import { z } from "zod";
import { eastEmblemAPI } from "../../eastemblem-api";
import { appLogger } from "../../utils/logger";
import { AuthenticatedRequest } from "../../middleware/token-auth";
import { databaseService } from "../../services/database-service";
import { ActivityService } from "../../services/activity-service";
import { COACH_EVENTS } from "../../../shared/config/coach-events";

const router = express.Router();

// Helper function to log experiment activities
async function logExperimentActivity(
  founderId: string,
  ventureId: string,
  action: string,
  title: string,
  experimentName: string,
  experimentId?: string,
  metadata?: Record<string, any>
) {
  try {
    await storage.createUserActivity({
      founderId,
      ventureId,
      activityType: "validation",
      action,
      title,
      description: `Experiment: ${experimentName}`,
      metadata: {
        experimentName,
        experimentId,
        ...metadata,
      },
      entityId: experimentId || null,
      entityType: "experiment",
    });
  } catch (error) {
    appLogger.error("Failed to log experiment activity:", error);
    // Don't fail the request if activity logging fails
  }
}

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
      userHypothesis: z.string().nullable().optional(),
      results: z.string().nullable().optional(),
      decision: z.enum(["go", "start", "pivot", "learn"]).nullable().optional(),
      customNotes: z.string().nullable().optional(),
      newInsights: z.string().nullable().optional(),
      status: z.enum(["not_started", "in_progress", "completed"]).nullable().optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    // Validate Decision is not empty if it's being updated (it's a core required field)
    // Allow updates that don't include decision field, but prevent setting it to null
    if ('decision' in validatedData && validatedData.decision === null) {
      return res.status(400).json({
        success: false,
        error: "Decision is a required field and cannot be empty. Please select Go, Start, Pivot, or Learn / Measure.",
      });
    }

    // Clean up null values - convert to undefined for storage
    const cleanedData: any = {};
    for (const [key, value] of Object.entries(validatedData)) {
      if (value !== null) {
        cleanedData[key] = value;
      }
    }

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
      cleanedData
    );

    if (!updatedExperiment) {
      return res.status(404).json({
        success: false,
        error: "Experiment not found",
      });
    }

    // Get experiment master for activity logging (with error handling)
    let experimentMaster = null;
    try {
      experimentMaster = await storage.getExperimentMaster(experiment.experimentId);
    } catch (error) {
      appLogger.warn(`Failed to get experiment master for ${experiment.experimentId}:`, error);
      // Continue without experiment master - we'll use fallback values
    }

    // If experiment is being marked as completed, add its ProofTag to venture
    if (validatedData.status === "completed" && experiment.status !== "completed") {
      try {
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

    // Log the activity
    const updatedFields = Object.keys(validatedData);
    await logExperimentActivity(
      founderId,
      ventureId,
      "experiment_updated",
      "Edited Experiment",
      experimentMaster?.name || "Unknown Experiment",
      id,
      {
        updatedFields,
        status: validatedData.status,
        decision: validatedData.decision,
      }
    );

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

    // Log the activity
    await logExperimentActivity(
      founderId,
      ventureId,
      "experiment_added",
      "Added New Experiment",
      master.name,
      newExperiment.id,
      {
        validationSphere: master.validationSphere,
        proofTag: master.proofTag,
      }
    );

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
      experimentFormat: z.string().min(1, "Experiment format is required"),
      targetBehaviour: z.string().min(1, "Target Behaviour is required"),
      targetMetric: z.string().min(1, "Target metric is required"),
      hypothesisTested: z.string().optional(),
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
      hypothesisTested: validatedData.hypothesisTested || "",
      experimentFormat: validatedData.experimentFormat,
      targetBehaviour: validatedData.targetBehaviour,
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

    // Log the activity
    await logExperimentActivity(
      founderId,
      ventureId,
      "custom_experiment_created",
      "Created Custom Experiment",
      validatedData.name,
      newExperiment.id,
      {
        validationSphere: "Custom",
        experimentFormat: validatedData.experimentFormat,
        targetMetric: validatedData.targetMetric,
      }
    );

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

    appLogger.info(`🗑️ DELETE FLOW: Starting deletion of experiment ${id} for venture ${ventureId}`);

    // Get experiment master for activity logging and ProofTag removal
    const experimentMaster = await storage.getExperimentMaster(experiment.experimentId);

    // Remove ProofTag from venture when experiment is deleted
    let proofTagRemoved = null;
    try {
      if (experimentMaster?.proofTag && experiment.status === "completed") {
        const venture = await storage.getVenture(ventureId);
        if (!venture) {
          throw new Error("Venture not found");
        }
        const currentProofTags = venture.prooftags || [];
        
        appLogger.info(`🔍 DELETE FLOW: Before deletion - Venture ${ventureId} has ${currentProofTags.length} ProofTags`);
        
        // Remove ProofTag if present
        if (currentProofTags.includes(experimentMaster.proofTag)) {
          const updatedProofTags = currentProofTags.filter(tag => tag !== experimentMaster.proofTag);
          
          appLogger.info(`➖ DELETE FLOW: Removing ProofTag "${experimentMaster.proofTag}" (total will be ${updatedProofTags.length})`);
          
          await storage.updateVenture(ventureId, {
            prooftags: updatedProofTags,
            updatedAt: new Date()
          });
          
          proofTagRemoved = experimentMaster.proofTag;
          appLogger.info(`✅ DELETE FLOW: ProofTag "${experimentMaster.proofTag}" removed from venture ${ventureId} (NEW TOTAL: ${updatedProofTags.length})`);
          
          // CRITICAL: Invalidate BOTH 'founder' and 'dashboard' caches
          // The validation API uses 'founder' cache, so we MUST clear it!
          const { lruCacheService } = await import("../../services/lru-cache-service");
          await lruCacheService.invalidate('founder', founderId);
          await lruCacheService.invalidate('dashboard', founderId);
          appLogger.info(`🗑️ DELETE FLOW: Both 'founder' and 'dashboard' caches invalidated for founder ${founderId}`);
        } else {
          appLogger.info(`⏭️ DELETE FLOW: ProofTag "${experimentMaster.proofTag}" not in venture.prooftags, skipping removal`);
        }
      } else {
        if (!experimentMaster?.proofTag) {
          appLogger.info(`⏭️ DELETE FLOW: Experiment has no associated ProofTag, skipping ProofTag removal`);
        } else if (experiment.status !== "completed") {
          appLogger.info(`⏭️ DELETE FLOW: Experiment not completed (status: ${experiment.status}), skipping ProofTag removal`);
        }
      }
    } catch (error) {
      appLogger.error("❌ DELETE FLOW: Failed to remove ProofTag from venture:", error);
    }

    // Log the activity before deletion
    await logExperimentActivity(
      founderId,
      ventureId,
      "experiment_deleted",
      "Deleted Experiment",
      experimentMaster?.name || "Unknown Experiment",
      id,
      {
        status: experiment.status,
        proofTagRemoved,
      }
    );

    await storage.deleteVentureExperiment(id);

    appLogger.info(`✅ DELETE FLOW: Deleted experiment ${id} for venture ${ventureId}`);

    res.json(
      createSuccessResponse(
        { id, proofTagRemoved },
        "Experiment deleted successfully"
      )
    );
  })
);

// Helper function to check if HTML content is empty
function isHtmlEmpty(html: string | null): boolean {
  if (!html) return true;
  
  // Strip HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&shy;/g, '')
    .replace(/&zwj;/g, '')
    .replace(/&zwnj;/g, '');
  
  // Trim and check if empty
  return text.trim().length === 0;
}

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

    // Validate all required fields are filled before completing
    const missingFields: string[] = [];
    
    if (!experiment.decision) {
      missingFields.push("Decision");
    }
    if (isHtmlEmpty(experiment.userHypothesis)) {
      missingFields.push("Hypothesis");
    }
    if (isHtmlEmpty(experiment.results)) {
      missingFields.push("Actual Results");
    }
    if (isHtmlEmpty(experiment.customNotes)) {
      missingFields.push("Why?");
    }
    if (isHtmlEmpty(experiment.newInsights)) {
      missingFields.push("New Insights");
    }

    if (missingFields.length > 0) {
      appLogger.warn(`❌ COMPLETE VALIDATION: Cannot complete experiment ${id} - missing fields: ${missingFields.join(", ")}`);
      return res.status(400).json({
        success: false,
        error: `Please fill in all required fields before completing: ${missingFields.join(", ")}`,
        missingFields,
      });
    }

    appLogger.info(`✅ COMPLETE VALIDATION: All required fields present for experiment ${id}`);

    const completedExperiment = await storage.completeVentureExperiment(id);

    if (!completedExperiment) {
      return res.status(404).json({
        success: false,
        error: "Experiment not found",
      });
    }

    // Add ProofTag to venture when experiment is completed
    let proofTagAdded = null;
    let experimentMaster = null;
    
    try {
      experimentMaster = await storage.getExperimentMaster(experiment.experimentId);
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

    // Log the activity with ProofTag information
    await logExperimentActivity(
      founderId,
      ventureId,
      "experiment_completed",
      "Completed Experiment",
      experimentMaster?.name || "Unknown Experiment",
      id,
      {
        decision: experiment.decision,
        proofTagUnlocked: proofTagAdded,
      }
    );

    // Track coach event: experiment completed
    const context = {
      founderId,
      ventureId,
      sessionId: 'api-session',
      ipAddress: (req as any).ip || null,
      userAgent: (req as any).get?.('User-Agent') || null,
    };

    await ActivityService.logActivity(context, {
      activityType: 'evaluation',
      action: COACH_EVENTS.EXPERIMENT_COMPLETED,
      title: `Completed: ${experimentMaster?.name || 'Experiment'}`,
      description: `Completed validation experiment with decision: ${experiment.decision}`,
      metadata: {
        experimentId: id,
        experimentName: experimentMaster?.name,
        decision: experiment.decision,
        proofTagUnlocked: proofTagAdded,
        validationSphere: experimentMaster?.validationSphere,
      },
      entityId: id,
      entityType: 'experiment',
    });

    // Check experiment completion milestones
    const allExperiments = await storage.getVentureExperiments(ventureId);
    const completedCount = allExperiments.filter(exp => exp.status === 'completed').length;

    if (completedCount === 1) {
      await ActivityService.logActivity(context, {
        activityType: 'evaluation',
        action: COACH_EVENTS.FIRST_EXPERIMENT_COMPLETED,
        title: 'First Experiment Completed',
        description: 'Completed your first validation experiment',
        metadata: { completedCount: 1 },
      });
    } else if (completedCount === 3) {
      await ActivityService.logActivity(context, {
        activityType: 'evaluation',
        action: COACH_EVENTS.THREE_EXPERIMENTS_COMPLETED,
        title: '3 Experiments Completed',
        description: 'Completed 3 validation experiments',
        metadata: { completedCount: 3 },
      });
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

// POST /api/validation-map/export - Track CSV export event
router.post(
  "/export",
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

    // Track coach event: validation map exported
    const context = {
      founderId,
      ventureId,
      sessionId: 'api-session',
      ipAddress: (req as any).ip || null,
      userAgent: (req as any).get?.('User-Agent') || null,
    };

    await ActivityService.logActivity(context, {
      activityType: 'navigation',
      action: COACH_EVENTS.VALIDATION_MAP_EXPORTED,
      title: 'Exported Validation Map',
      description: 'Exported validation experiments to CSV',
      metadata: {
        format: 'csv',
        exportedAt: new Date().toISOString(),
      },
    });

    appLogger.info(`✅ CSV EXPORT: Tracked export event for venture ${ventureId}`);

    res.json(createSuccessResponse({}, "Export tracked successfully"));
  })
);

export default router;
