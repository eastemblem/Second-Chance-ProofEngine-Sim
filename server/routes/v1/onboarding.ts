import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { getSessionId, updateSessionData } from '../../utils/session-manager';
import { createSuccessResponse } from '../../utils/error-handler';
import { safeValidate } from '../../utils/validation';
import { onboardingService } from '../../services/onboarding-service';
import { founderOnboardingSchema, ventureOnboardingSchema } from '../../onboarding';

const router = Router();

// Founder onboarding step - UPDATED LOGIC to accept sessionId from request body
router.post("/founder", asyncHandler(async (req: Request, res: Response) => {
  // Use sessionId from request body if provided, otherwise get from middleware
  const { sessionId: requestSessionId, ...founderData } = req.body;
  const sessionId = requestSessionId || getSessionId(req);
  console.log(`V1 Founder API received sessionId: ${sessionId} (from request: ${requestSessionId})`);
  
  const validation = safeValidate(founderOnboardingSchema, founderData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.completeFounderStep(sessionId, validation.data);

  res.json(createSuccessResponse({
    sessionId: result.sessionId,
    founderId: result.founderId,
    nextStep: "venture",
  }));
}));

// Venture onboarding step - EXACT SAME LOGIC as routes/onboarding.ts
router.post("/venture", asyncHandler(async (req: Request, res: Response) => {
  // Use sessionId from request body if provided, otherwise get from middleware
  const { sessionId: requestSessionId, ...ventureData } = req.body;
  const sessionId = requestSessionId || getSessionId(req);
  console.log(`V1 Venture API received sessionId: ${sessionId} (from request: ${requestSessionId})`);
  console.log(`V1 Venture data received:`, JSON.stringify(ventureData, null, 2));
  
  const validation = safeValidate(ventureOnboardingSchema, ventureData);
  if (!validation.success) {
    throw validation.errors;
  }

  const result = await onboardingService.completeVentureStep(sessionId, validation.data);

  res.json(createSuccessResponse({
    venture: result.venture,
    folderStructure: result.folderStructure,
    nextStep: "team",
  }));
}));

// Submit for scoring endpoint - EXACT SAME LOGIC as routes.ts
router.post('/submit-for-scoring', asyncHandler(async (req: Request, res: Response) => {
  console.log('V1 submit-for-scoring endpoint called with body:', JSON.stringify(req.body, null, 2));
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
    console.log('Calling onboardingService.submitForScoring with sessionId:', sessionId);
    const result = await onboardingService.submitForScoring(sessionId);
    console.log('Scoring result received:', result ? 'SUCCESS' : 'NULL');
    
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
    console.error('Submit for scoring error:', error);
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

// Legacy onboarding data storage - EXACT SAME LOGIC as routes.ts
router.post('/store', asyncHandler(async (req: Request, res: Response) => {
  const founderData = req.body;
  console.log("Storing onboarding data in session:", founderData);

  updateSessionData(req, {
    founderData,
    startupName: founderData.startupName,
  });

  res.json(createSuccessResponse({
    sessionId: getSessionId(req),
  }, "Onboarding data stored successfully"));
}));

export default router;