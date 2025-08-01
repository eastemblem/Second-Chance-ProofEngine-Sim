import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { createSuccessResponse, createErrorResponse } from '../../utils/error-handler';
import { safeValidate } from '../../utils/validation';
import { onboardingService } from '../../services/onboarding-service';
import { founderOnboardingSchema, ventureOnboardingSchema, teamMemberSchema } from '../../onboarding';
import { lruCacheService } from '../../services/lru-cache-service';

const router = Router();

// JWT-authenticated onboarding routes (require valid JWT token)
// These routes expect founderId/userId from JWT token payload

// Get user's onboarding sessions
router.get("/sessions", asyncHandler(async (req: Request, res: Response) => {
  const founderId = req.user?.id || req.user?.founderId;
  
  if (!founderId) {
    return res.status(400).json(createErrorResponse(400, "User ID required"));
  }

  const sessions = await onboardingService.getUserSessions(founderId);

  res.json(createSuccessResponse({
    founderId,
    sessions
  }));
}));

// Get specific session by ID (JWT protected)
router.get("/session/:sessionId", asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const founderId = req.user?.id || req.user?.founderId;
  
  if (!sessionId || sessionId === 'undefined') {
    return res.status(400).json(createErrorResponse(400, "Invalid session ID"));
  }
  
  const session = await onboardingService.getSession(sessionId);
  
  if (!session) {
    return res.status(404).json(createErrorResponse(404, "Session not found"));
  }

  // Verify session belongs to authenticated user
  if (session.founderId !== founderId) {
    return res.status(403).json(createErrorResponse(403, "Access denied"));
  }

  res.json(createSuccessResponse({
    sessionId: session.sessionId,
    founderId: session.founderId,
    currentStep: session.currentStep,
    stepData: session.stepData,
    completedSteps: session.completedSteps,
    isComplete: session.isComplete,
  }));
}));

// Update founder data (JWT protected)
router.put("/founder", asyncHandler(async (req: Request, res: Response) => {
  const founderId = req.user?.id || req.user?.founderId;
  const founderData = req.body;
  
  if (!founderId) {
    return res.status(400).json(createErrorResponse(400, "User ID required"));
  }
  
  const validation = safeValidate(founderOnboardingSchema, founderData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.updateFounderData(founderId, validation.data);

  // Invalidate founder cache
  try {
    await lruCacheService.invalidate('founder', founderId);
    console.log(`🗑️ V1-JWT ONBOARDING: Founder cache invalidated for ${founderId}`);
  } catch (cacheError) {
    console.error(`⚠️ V1-JWT ONBOARDING: Founder cache invalidation failed:`, cacheError);
  }

  res.json(createSuccessResponse({
    founderId,
    founder: result
  }));
}));

// Get user's ventures (JWT protected)
router.get("/ventures", asyncHandler(async (req: Request, res: Response) => {
  const founderId = req.user?.id || req.user?.founderId;
  
  if (!founderId) {
    return res.status(400).json(createErrorResponse(400, "User ID required"));
  }

  const ventures = await onboardingService.getFounderVentures(founderId);

  res.json(createSuccessResponse({
    founderId,
    ventures
  }));
}));

// Submit for scoring (JWT protected)
router.post("/submit-for-scoring", asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  const founderId = req.user?.id || req.user?.founderId;
  
  if (!sessionId) {
    return res.status(400).json(createErrorResponse(400, "sessionId is required"));
  }
  
  // Verify session belongs to authenticated user
  const session = await onboardingService.getSession(sessionId);
  if (!session || session.founderId !== founderId) {
    return res.status(403).json(createErrorResponse(403, "Access denied"));
  }
  
  try {
    const result = await onboardingService.submitForScoring(sessionId);
    
    const response = createSuccessResponse({
      session: {
        sessionId,
        stepData: {
          processing: result.scoringResult
        }
      },
      ...result
    });
    
    res.json(response);
  } catch (error) {
    console.error('JWT Submit for scoring error:', error);
    res.status(500).json(createErrorResponse(500, error.message));
  }
}));

export default router;