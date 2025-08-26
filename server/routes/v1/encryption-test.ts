import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import winston from 'winston';

const router = Router();

// Test endpoint for encryption functionality
router.post('/echo', asyncHandler(async (req: Request, res: Response) => {
  winston.info('Encryption test endpoint called', {
    service: 'second-chance-api',
    category: 'encryption-test',
    encryptionEnabled: req.encryptionEnabled,
    hasDecryptedBody: !!req.decryptedBody,
    originalBodyKeys: Object.keys(req.body || {})
  });

  // Echo back the received data with encryption metadata
  const responseData = {
    message: 'Encryption test successful',
    receivedData: req.body,
    encryptionMetadata: {
      wasEncrypted: req.encryptionEnabled || false,
      hasSessionSecret: !!req.sessionSecret,
      timestamp: new Date().toISOString()
    }
  };

  res.json(responseData);
}));

// Test endpoint to check encryption status
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const responseData = {
    encryptionEnabled: process.env.ENABLE_ENCRYPTION === 'true',
    serverTimestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasEncryptionSecret: !!process.env.ENCRYPTION_SECRET
  };

  winston.info('Encryption status check', {
    service: 'second-chance-api',
    category: 'encryption-test',
    responseData
  });

  res.json(responseData);
}));

export default router;