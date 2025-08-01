import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { getSessionId, updateSessionData } from '../../utils/session-manager';
import { createSuccessResponse, createErrorResponse } from '../../utils/error-handler';
import { requireSession } from '../../middleware/auth';
import { appLogger } from '../../utils/logger';

const router = Router();

// Payment routes with session management (no JWT required)
// These routes use session management for payment flow

// Initialize payment session
router.post("/init", requireSession, asyncHandler(async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const { amount, packageType, founderData } = req.body;
  
  appLogger.business('Payment initialization:', { sessionId, amount, packageType });
  
  // Store payment data in session
  updateSessionData(req, {
    payment: {
      amount,
      packageType,
      founderData,
      status: 'initialized',
      timestamp: new Date().toISOString()
    }
  });

  res.json(createSuccessResponse({
    sessionId,
    paymentInitialized: true,
    amount,
    packageType
  }));
}));

// Get payment session data
router.get("/session", requireSession, asyncHandler(async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const sessionData = req.session.data || {};
  
  res.json(createSuccessResponse({
    sessionId,
    paymentData: sessionData.payment || null,
    sessionData: sessionData
  }));
}));

// Update payment status
router.post("/status", requireSession, asyncHandler(async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const { status, transactionId, gatewayResponse } = req.body;
  
  appLogger.business('Payment status update:', { sessionId, status, transactionId });
  
  // Update payment status in session
  const currentSession = req.session.data || {};
  updateSessionData(req, {
    ...currentSession,
    payment: {
      ...currentSession.payment,
      status,
      transactionId,
      gatewayResponse,
      updatedAt: new Date().toISOString()
    }
  });

  res.json(createSuccessResponse({
    sessionId,
    paymentStatus: status,
    transactionId
  }));
}));

// Process payment completion
router.post("/complete", requireSession, asyncHandler(async (req: Request, res: Response) => {
  const sessionId = getSessionId(req);
  const { success, transactionId, paymentData } = req.body;
  
  appLogger.business('Payment completion:', { sessionId, success, transactionId });
  
  if (success) {
    // Mark payment as completed in session
    updateSessionData(req, {
      payment: {
        ...req.session.data?.payment,
        status: 'completed',
        transactionId,
        completedAt: new Date().toISOString(),
        paymentData
      }
    });
    
    res.json(createSuccessResponse({
      sessionId,
      paymentCompleted: true,
      transactionId,
      nextStep: 'analysis'
    }));
  } else {
    // Mark payment as failed
    updateSessionData(req, {
      payment: {
        ...req.session.data?.payment,
        status: 'failed',
        failedAt: new Date().toISOString(),
        error: paymentData?.error
      }
    });
    
    res.status(400).json(createErrorResponse(400, 'Payment failed'));
  }
}));

export default router;