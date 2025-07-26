import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../utils/error-handler';

const router = Router();

// Simple test endpoint to verify v1 API is working
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'V1 API is working correctly',
    version: 'v1',
    timestamp: new Date().toISOString()
  });
}));

export default router;