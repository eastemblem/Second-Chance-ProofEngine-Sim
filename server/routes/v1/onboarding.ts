import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { getSessionId, updateSessionData } from '../../utils/session-manager';
import { createSuccessResponse, createErrorResponse } from '../../utils/error-handler';
import { safeValidate } from '../../utils/validation';
import { onboardingService } from '../../services/onboarding-service';
import { requireSession } from '../../middleware/auth';
import { founderOnboardingSchema, ventureOnboardingSchema, teamMemberSchema } from '../../onboarding';
import { lruCacheService } from '../../services/lru-cache-service';
import { appLogger } from '../../utils/logger';

const router = Router();

// Initialize onboarding session - V1 VERSION (No authentication required)
router.post("/session/init", asyncHandler(async (req: Request, res: Response) => {
  const sessionId = await onboardingService.initializeSession(req);
  const session = await onboardingService.getSession(sessionId);

  res.json(createSuccessResponse({
    sessionId,
    currentStep: session?.currentStep || "founder",
    stepData: session?.stepData || {},
    completedSteps: session?.completedSteps || [],
    isComplete: session?.isComplete || false,
  }));
}));

// Get session status - V1 VERSION (No authentication required)
router.get("/session/:sessionId", asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = await onboardingService.getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  res.json(createSuccessResponse({
    sessionId: session.sessionId,
    currentStep: session.currentStep,
    stepData: session.stepData,
    completedSteps: session.completedSteps,
    isComplete: session.isComplete,
  }));
}));

// Founder onboarding step - UPDATED LOGIC to accept sessionId from request body
router.post("/founder", asyncHandler(async (req: Request, res: Response) => {
  // Use sessionId from request body if provided, otherwise get from middleware
  const { sessionId: requestSessionId, ...founderData } = req.body;
  const sessionId = requestSessionId || getSessionId(req);
  appLogger.api('V1 Founder onboarding step', { 
    sessionId, 
    requestSessionId, 
    hasFounderData: !!founderData 
  });
  
  const validation = safeValidate(founderOnboardingSchema, founderData);
  if (!validation.success) {
    throw validation.errors;
  }

  let result;
  try {
    result = await onboardingService.completeFounderStep(sessionId, validation.data);
  } catch (error: any) {
    // Handle email duplicate error as validation error, not server error
    if (error.message === "Email already taken") {
      return res.status(400).json(createErrorResponse(400, "Email already taken"));
    }
    // Re-throw other errors to be handled by asyncHandler
    throw error;
  }

  // Invalidate founder cache when new founder is created
  if (result.founderId) {
    try {
      await lruCacheService.invalidate('founder', result.founderId);
      appLogger.api('V1 onboarding - founder cache invalidated', { founderId: result.founderId });
    } catch (cacheError) {
      appLogger.api('V1 onboarding - founder cache invalidation failed', { 
        founderId: result.founderId, 
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error' 
      });
      // Don't fail the onboarding if cache invalidation fails
    }
  }

  res.json(createSuccessResponse({
    sessionId: result.sessionId,
    founderId: result.founderId,
    founder: result.founder,
    nextStep: "venture",
  }));
}));

// Venture onboarding step - EXACT SAME LOGIC as routes/onboarding.ts
router.post("/venture", asyncHandler(async (req: Request, res: Response) => {
  // Use sessionId from request body if provided, otherwise get from middleware
  const { sessionId: requestSessionId, ...ventureData } = req.body;
  const sessionId = requestSessionId || getSessionId(req);
  appLogger.api('V1 Venture onboarding step', { 
    sessionId, 
    requestSessionId, 
    hasVentureData: !!ventureData 
  });
  
  const validation = safeValidate(ventureOnboardingSchema, ventureData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.completeVentureStep(sessionId, validation.data);

  // Invalidate venture and founder cache when new venture is created
  if (result.venture?.founderId) {
    try {
      await lruCacheService.invalidate('founder', result.venture.founderId);
      await lruCacheService.invalidate('venture', result.venture.ventureId);
      await lruCacheService.invalidate('dashboard', `vault_${result.venture.founderId}`);
      appLogger.api('V1 onboarding - cache invalidated', { 
        founderId: result.venture.founderId, 
        ventureId: result.venture.ventureId 
      });
    } catch (cacheError) {
      appLogger.api('V1 onboarding - cache invalidation failed', { 
        founderId: result.venture.founderId, 
        ventureId: result.venture.ventureId,
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error' 
      });
      // Don't fail the onboarding if cache invalidation fails
    }
  }

  res.json(createSuccessResponse({
    venture: result.venture,
    folderStructure: result.folderStructure,
    nextStep: "team",
  }));
}));

// Submit for scoring endpoint - EXACT SAME LOGIC as routes.ts
router.post('/submit-for-scoring', asyncHandler(async (req: Request, res: Response) => {
  appLogger.api('V1 submit-for-scoring endpoint called', { 
    hasBody: !!req.body, 
    sessionId: req.body?.sessionId 
  });
  const { sessionId } = req.body;
  
  if (!sessionId) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({
      success: false,
      error: {
        message: "sessionId is required",
        status: 400
      }
    });
  }

  try {
    appLogger.api('Calling onboardingService.submitForScoring', { sessionId });
    const result = await onboardingService.submitForScoring(sessionId);
    appLogger.api('Scoring result received', { 
      sessionId, 
      success: !!result,
      hasResult: result !== null && result !== undefined 
    });
    
    // Check if the scoring result contains an error (like user action required)
    if (result.scoringResult?.hasError) {
      appLogger.api('Scoring result contains user action required error', { sessionId });
      const response = {
        success: true,
        data: {
          session: {
            sessionId,
            stepData: {
              processing: result.scoringResult
            }
          },
          ...result
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.json(response);
      return;
    }
    
    const response = {
      success: true,
      data: {
        session: {
          sessionId,
          stepData: {
            processing: result.scoringResult
          }
        },
        ...result
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (error) {
    appLogger.api('Submit for scoring error', { 
      sessionId: req.body?.sessionId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      success: false,
      error: {
        message: errorMessage,
        status: 500
      }
    });
  }
}));

// Team member endpoints - V1 VERSION
router.post("/team/add", asyncHandler(async (req: Request, res: Response) => {
  // Try to get sessionId from body first, then from session middleware
  const { sessionId: bodySessionId, ...memberData } = req.body;
  let sessionId = bodySessionId;
  
  // Fallback to session middleware if no sessionId in body
  if (!sessionId) {
    try {
      sessionId = getSessionId(req);
    } catch (error) {
      // If session middleware fails, still require sessionId in body
      throw new Error("Session ID required in request body");
    }
  }
  
  if (!sessionId || sessionId === 'undefined') {
    throw new Error("Valid session ID required");
  }
  
  const validation = safeValidate(teamMemberSchema, memberData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.addTeamMember(sessionId, validation.data);

  res.json(createSuccessResponse({
    teamMember: result,
    nextStep: "team",
  }));
}));

router.get("/team/:sessionId", asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  // Validate sessionId is not undefined or invalid
  if (!sessionId || sessionId === 'undefined') {
    return res.status(400).json({ error: "Invalid session ID" });
  }
  
  const teamMembers = await onboardingService.getTeamMembers(sessionId);

  res.json(createSuccessResponse({
    teamMembers,
  }));
}));

router.put("/team/update/:memberId", asyncHandler(async (req: Request, res: Response) => {
  const { memberId } = req.params;
  const { memberId: _, ...memberData } = req.body;
  
  const validation = safeValidate(teamMemberSchema, memberData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.updateTeamMember(memberId, validation.data);

  res.json(createSuccessResponse({
    teamMember: result,
  }));
}));

router.delete("/team/delete/:memberId", asyncHandler(async (req: Request, res: Response) => {
  const { memberId } = req.params;
  
  await onboardingService.deleteTeamMember(memberId);

  res.json(createSuccessResponse({
    message: "Team member deleted successfully",
  }));
}));

router.post("/team/complete", asyncHandler(async (req: Request, res: Response) => {
  // Try to get sessionId from body first, then from session middleware
  const { sessionId: bodySessionId } = req.body;
  const sessionId = bodySessionId || getSessionId(req);
  
  if (!sessionId) {
    throw new Error("Session ID required");
  }

  const result = await onboardingService.completeTeamStep(sessionId);

  res.json(createSuccessResponse({
    teamComplete: true,
    nextStep: "upload",
  }));
}));

// Legacy onboarding data storage - EXACT SAME LOGIC as routes.ts
router.post('/store', asyncHandler(async (req: Request, res: Response) => {
  const founderData = req.body;
  const sessionId = getSessionId(req);
  appLogger.api('Storing onboarding data in session', { 
    hasFounderData: !!founderData, 
    sessionId 
  });

  updateSessionData(sessionId, {
    founderData,
    startupName: founderData.startupName,
  });

  res.json(createSuccessResponse({
    sessionId: getSessionId(req),
  }, "Onboarding data stored successfully"));
}));

export default router;