import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { getSessionId, updateSessionData } from '../../utils/session-manager';
import { createSuccessResponse } from '../../utils/error-handler';
import { safeValidate } from '../../utils/validation';
import { onboardingService } from '../../services/onboarding-service';
import { founderOnboardingSchema } from '../../onboarding';

const router = Router();

// Founder onboarding step - EXACT SAME LOGIC as routes/onboarding.ts
router.post("/founder", asyncHandler(async (req: Request, res: Response) => {
  // Use session from middleware, ignore any provided sessionId
  const sessionId = getSessionId(req);
  const { sessionId: _, ...founderData } = req.body; // Remove sessionId from body
  
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

// Submit for scoring endpoint - EXACT SAME LOGIC as routes.ts
router.post('/submit-for-scoring', asyncHandler(async (req, res) => {
  console.log('V1 submit-for-scoring endpoint called');
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
    const result = await onboardingService.submitForScoring(sessionId);
    
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
router.post('/store', asyncHandler(async (req, res) => {
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