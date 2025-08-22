import { Request, Response, NextFunction } from 'express';
import { ServerCrypto } from '../lib/server-crypto';
import { ENCRYPTION_CONFIG } from '@shared/crypto-config';
import { appLogger } from '../utils/logger';

// Extend Request interface to include encryption metadata
declare global {
  namespace Express {
    interface Request {
      encryptionContext?: {
        isEnabled: boolean;
        wasDecrypted: boolean;
        shouldEncryptResponse: boolean;
      };
    }
  }
}

/**
 * Middleware to handle request decryption and response encryption
 */
export function encryptionMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get encryption context
      const context = ServerCrypto.getEncryptionContext();
      
      // Check if request indicates encryption
      const isEncryptedRequest = ServerCrypto.isEncryptedRequest(req.headers);
      
      // Initialize request encryption context
      req.encryptionContext = {
        isEnabled: context.isEnabled,
        wasDecrypted: false,
        shouldEncryptResponse: isEncryptedRequest && context.isEnabled
      };


      // Skip decryption if encryption is disabled
      if (!context.isEnabled) {
        return next();
      }

      // Log encryption attempt for debugging
      if (isEncryptedRequest) {
        appLogger.auth('Processing encrypted request', {
          path: req.path,
          method: req.method,
          hasBody: !!req.body
        });
      }

      // Decrypt request body if encrypted (only for requests with body)
      if (req.body && isEncryptedRequest) {
        try {
          const decryptionResult = await ServerCrypto.decryptRequestPayload(req.body, context);
          
          if (decryptionResult.wasEncrypted) {
            req.body = decryptionResult.data;
            req.encryptionContext.wasDecrypted = true;
            
            appLogger.auth('Request payload decrypted successfully', {
              path: req.path,
              method: req.method
            });
          }
        } catch (error) {
          appLogger.auth('Request decryption failed', {
            path: req.path,
            method: req.method,
            error: error instanceof Error ? error.message : 'Unknown error',
            payloadStructure: Object.keys(req.body),
            hasRequiredFields: !!(req.body?.data && req.body?.iv && req.body?.tag && req.body?.salt),
            timestamp: req.body?.timestamp,
            timestampAge: req.body?.timestamp ? Date.now() - req.body.timestamp : 'N/A'
          });
          
          return res.status(400).json({
            error: 'Invalid encrypted payload',
            message: 'Failed to decrypt request data',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Log encrypted requests without body (like GET requests)
      if (isEncryptedRequest && !req.body) {
        appLogger.auth('Processing encrypted request (no body)', {
          path: req.path,
          method: req.method
        });
      }

      // Override res.json to handle response encryption
      const originalJson = res.json.bind(res);
      res.json = function(body: any) {
        
        // Check if we should encrypt the response
        if (req.encryptionContext?.shouldEncryptResponse && context.isEnabled && context.secret) {
          // Handle response encryption asynchronously but don't make res.json async
          ServerCrypto.encryptResponsePayload(body, context, true)
            .then(({ data, wasEncrypted }) => {
              if (wasEncrypted) {
                // Add encryption headers
                const encryptionHeaders = ServerCrypto.createEncryptionHeaders(true);
                Object.entries(encryptionHeaders).forEach(([key, value]) => {
                  res.setHeader(key, value);
                });
                
                appLogger.auth('Response payload encrypted', {
                  path: req.path,
                  method: req.method
                });
                
                // Send encrypted response
                originalJson(data);
              } else {
                // Send original response if encryption failed
                originalJson(body);
              }
            })
            .catch(error => {
              appLogger.auth('Response encryption failed', {
                path: req.path,
                method: req.method,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              
              // Fall back to unencrypted response
              originalJson(body);
            });
          
          // Return immediately for encrypted responses
          return res;
        } else {
          return originalJson(body);
        }
      };

      next();
    } catch (error) {
      appLogger.auth('Encryption middleware error', {
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Encryption processing failed'
      });
    }
  };
}

// Flag to ensure we only log once
let encryptionStatusLogged = false;

/**
 * Middleware to log encryption status on server startup
 */
export function logEncryptionStatus() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Log encryption status once on first request
    if (!encryptionStatusLogged) {
      ServerCrypto.logEncryptionStatus();
      
      const validation = ServerCrypto.validateConfiguration();
      if (!validation.isValid) {
        appLogger.auth('Encryption configuration errors', {
          errors: validation.errors
        });
      }
      
      encryptionStatusLogged = true;
    }
    
    next();
  };
}