import { Request, Response, NextFunction } from 'express';
import { encryptedPayloadSchema, EncryptedPayload, isEncryptionEnabled } from '@shared/crypto-utils';
import { simpleEncryptData, simpleDecryptData, encryptApiResponse, decryptApiRequest } from '../lib/server-crypto-utils';
import winston from 'winston';

// Extend Request interface to include encryption context
declare global {
  namespace Express {
    interface Request {
      encryptionEnabled?: boolean;
      sessionSecret?: string;
      decryptedBody?: any;
    }
  }
}

// Get session secret from JWT token or generate one
function getSessionSecret(req: Request): string {
  // Extract from JWT token or use a session-based secret
  const user = (req as any).user;
  if (user?.founderId) {
    // Use founderId as basis for session secret (in production, use proper session management)
    return `session-${user.founderId}-${process.env.ENCRYPTION_SECRET || 'fallback-secret'}`;
  }
  
  // Fallback for public endpoints
  return `public-session-${process.env.ENCRYPTION_SECRET || 'fallback-secret'}`;
}

// Encryption middleware for incoming requests
export function decryptionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if encryption is globally enabled
    if (!isEncryptionEnabled()) {
      req.encryptionEnabled = false;
      return next();
    }

    // Check if request body contains encrypted payload
    const contentType = req.headers['content-type'];
    const isEncryptedRequest = req.headers['x-encrypted'] === 'true';
    
    if (!isEncryptedRequest || !req.body) {
      // Not an encrypted request, proceed normally
      req.encryptionEnabled = false;
      return next();
    }

    // Validate encrypted payload structure
    const validationResult = encryptedPayloadSchema.safeParse(req.body);
    if (!validationResult.success) {
      winston.warn('Invalid encrypted payload structure', {
        service: 'second-chance-api',
        category: 'encryption',
        errors: validationResult.error.errors
      });
      return res.status(400).json({ error: 'Invalid encrypted payload format' });
    }

    // Get session secret
    const sessionSecret = getSessionSecret(req);
    req.sessionSecret = sessionSecret;
    req.encryptionEnabled = true;

    // Decrypt the request body
    const encryptedPayload: EncryptedPayload = validationResult.data;
    const decryptedData = decryptApiRequest(encryptedPayload, sessionSecret);
    
    req.decryptedBody = decryptedData;
    req.body = decryptedData; // Replace encrypted body with decrypted data

    winston.info('Request payload decrypted successfully', {
      service: 'second-chance-api',
      category: 'encryption',
      endpoint: req.path,
      method: req.method
    });

    next();

  } catch (error) {
    winston.error('Failed to decrypt request payload', {
      service: 'second-chance-api',
      category: 'encryption',
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(400).json({ 
      error: 'Failed to decrypt request payload',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
}

// Encryption middleware for outgoing responses
export function encryptionMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;

  res.json = function(body: any) {
    try {
      // Check if encryption is globally enabled
      if (!isEncryptionEnabled()) {
        return originalJson.call(this, body);
      }

      // Check if client expects encrypted response
      const expectsEncryption = req.headers['x-expect-encrypted'] === 'true';
      
      if (!expectsEncryption || !req.sessionSecret) {
        // Client doesn't expect encryption or no session secret, send normally
        return originalJson.call(this, body);
      }

      // Encrypt the response
      const encryptedResponse = encryptApiResponse(body, req.sessionSecret);
      
      // Set encryption header
      res.setHeader('x-encrypted', 'true');
      res.setHeader('content-type', 'application/json');

      winston.info('Response payload encrypted successfully', {
        service: 'second-chance-api',
        category: 'encryption',
        endpoint: req.path,
        method: req.method
      });

      return originalJson.call(this, encryptedResponse);

    } catch (error) {
      winston.error('Failed to encrypt response payload', {
        service: 'second-chance-api',
        category: 'encryption',
        endpoint: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback to unencrypted response
      return originalJson.call(this, {
        error: 'Failed to encrypt response',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      });
    }
  };

  next();
}

// Combined middleware for both encryption and decryption
export function encryptionSuite(req: Request, res: Response, next: NextFunction) {
  // Apply decryption middleware first
  decryptionMiddleware(req, res, (err) => {
    if (err) return next(err);
    
    // Then apply encryption middleware
    encryptionMiddleware(req, res, next);
  });
}