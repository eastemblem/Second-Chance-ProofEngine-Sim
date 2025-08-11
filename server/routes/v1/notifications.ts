import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { eastEmblemAPI } from '../../eastemblem-api';
import { getSessionId } from '../../utils/session-manager';
import { createSuccessResponse } from '../../utils/error-handler';
import { onboardingService } from '../../services/onboarding-service';

const router = Router();

// Slack notification endpoint - EXACT SAME LOGIC as routes.ts
router.post('/send', asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  
  if (!message) {
    throw new Error("Message is required");
  }

  if (!eastEmblemAPI.isConfigured()) {
    throw new Error("EastEmblem API not configured");
  }

  const sessionId = getSessionId(req);
  const result = await eastEmblemAPI.sendSlackNotification(message, sessionId);

  res.json(createSuccessResponse(result, "Notification sent successfully"));
}));

// Manual email trigger route - EXACT SAME LOGIC as routes.ts
router.post('/email/send-manual', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    // Get session data
    const session = await onboardingService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Call the private email notification method without explicit URLs - let it generate them
    const stepData = session.stepData || {};
    await (onboardingService as any).sendEmailNotification(sessionId, stepData);
    
    res.json({
      success: true,
      message: 'Email sent successfully'
    });
    
  } catch (error) {
    console.error('Manual email send error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;