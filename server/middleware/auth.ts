import { Request, Response, NextFunction } from "express";
import { isValidUUID } from "../utils/validation";
import { createErrorResponse } from "../utils/error-handler";

/**
 * Validate UUID parameter middleware
 */
export function validateUUID(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuid = req.params[paramName];
    
    if (!uuid) {
      return res.status(400).json(
        createErrorResponse(400, `${paramName} parameter is required`)
      );
    }
    
    if (!isValidUUID(uuid)) {
      return res.status(400).json(
        createErrorResponse(400, `Invalid ${paramName} format`)
      );
    }
    
    next();
  };
}

/**
 * Validate session exists middleware
 */
export function requireSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session) {
    return res.status(500).json(
      createErrorResponse(500, "Session middleware not configured")
    );
  }
  
  next();
}

/**
 * Validate request body exists middleware
 */
export function requireBody(req: Request, res: Response, next: NextFunction) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json(
      createErrorResponse(400, "Request body is required")
    );
  }
  
  next();
}

/**
 * Validate specific fields in request body
 */
export function requireFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json(
        createErrorResponse(
          400, 
          `Missing required fields: ${missingFields.join(', ')}`
        )
      );
    }
    
    next();
  };
}

/**
 * Rate limiting middleware (simple implementation)
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const clientData = requests.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json(
        createErrorResponse(429, "Too many requests")
      );
    }
    
    clientData.count++;
    next();
  };
}