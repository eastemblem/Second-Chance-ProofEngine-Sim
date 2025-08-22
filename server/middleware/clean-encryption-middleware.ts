import { Request, Response, NextFunction } from 'express';
import { isEncryptionEnabled } from '@shared/crypto-utils';
import { encryptData, decryptData, generateSessionSecret, isValidEncryptedPayload } from '../lib/clean-encryption';
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

// Get session secret based on authenticated user or public session
function getSessionSecret(req: Request): string {
  const user = (req as any).user;
  
  if (user?.founderId) {
    return generateSessionSecret(user.founderId);
  }
  
  // Public session for login and other unauthenticated routes
  return generateSessionSecret();
}

// Clean decryption middleware - single path, no fallbacks
export function cleanDecryptionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if encryption is globally enabled
    if (!isEncryptionEnabled()) {
      req.encryptionEnabled = false;
      return next();
    }

    // Check if request has encrypted payload
    const isEncryptedRequest = req.headers['x-encrypted'] === 'true';
    
    if (!isEncryptedRequest || !req.body) {
      // Not an encrypted request, proceed normally
      req.encryptionEnabled = false;
      return next();
    }

    // Validate encrypted payload structure
    if (!isValidEncryptedPayload(req.body)) {
      winston.warn('Invalid encrypted payload format', {
        service: 'second-chance-api',
        category: 'clean-encryption',
        endpoint: req.path,
        payload: req.body
      });
      return res.status(400).json({ 
        error: 'Invalid encrypted payload format',
        expected: 'Payload must have data, iv (12 bytes), and tag (16 bytes) as base64 strings'
      });
    }

    // Get session secret
    const sessionSecret = getSessionSecret(req);
    req.sessionSecret = sessionSecret;
    req.encryptionEnabled = true;

    // Decrypt the request body using clean unified standard
    const decryptedDataString = decryptData(req.body, sessionSecret);
    const decryptedData = JSON.parse(decryptedDataString);
    
    req.decryptedBody = decryptedData;
    req.body = decryptedData; // Replace encrypted body with decrypted data

    winston.info('Request decrypted successfully with clean encryption', {
      service: 'second-chance-api',
      category: 'clean-encryption',
      endpoint: req.path,
      method: req.method,
      payloadSize: decryptedDataString.length
    });

    next();

  } catch (error) {
    winston.error('Clean encryption decryption failed', {
      service: 'second-chance-api',
      category: 'clean-encryption',
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

// Clean encryption middleware for responses - single path, no fallbacks
export function cleanEncryptionMiddleware(req: Request, res: Response, next: NextFunction) {
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

      // Encrypt the response using clean unified standard
      const encryptedResponse = encryptData(JSON.stringify(body), req.sessionSecret);
      
      // Set encryption header
      res.setHeader('x-encrypted', 'true');
      res.setHeader('content-type', 'application/json');

      winston.info('Response encrypted successfully with clean encryption', {
        service: 'second-chance-api',
        category: 'clean-encryption',
        endpoint: req.path,
        method: req.method
      });

      return originalJson.call(this, encryptedResponse);

    } catch (error) {
      winston.error('Clean encryption response encryption failed', {
        service: 'second-chance-api',
        category: 'clean-encryption',
        endpoint: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback to unencrypted response
      return originalJson.call(this, body);
    }
  };

  next();
}