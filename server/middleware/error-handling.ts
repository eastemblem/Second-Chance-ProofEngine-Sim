import { Request, Response, NextFunction } from "express";
import { appLogger } from "../utils/logger";
import { createErrorResponse } from "../utils/error-handler";

// Standard error response interface
export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

// Global error handling middleware
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error details
  appLogger.api(`API Error [${req.method} ${req.path}]:`, {
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    details: error.details,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Determine status code
  const statusCode = error.statusCode || 500;
  
  // Create standard error response format
  const message = error.message || 'Internal server error';
  const code = (error as any).code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR');
  
  const errorResponse = createErrorResponse(statusCode, message, code, error.details);

  // Add debug metadata in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };
  }

  res.status(statusCode).json(errorResponse);
}

// Create standard API error
export function createApiError(
  message: string, 
  statusCode = 500, 
  details?: any
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

// Not found middleware
export function notFoundHandler(req: Request, res: Response) {
  const errorResponse = createErrorResponse(404, `Route ${req.method} ${req.path} not found`, 'NOT_FOUND');
  res.status(404).json(errorResponse);
}

// Request timeout middleware
export function timeoutHandler(timeoutMs = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const error = createApiError('Request timeout', 408);
        res.status(408).json({
          error: error.message,
          statusCode: 408,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
}

// Rate limiting error handler
export function rateLimitErrorHandler(req: Request, res: Response) {
  res.status(429).json({
    error: 'Too many requests',
    statusCode: 429,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    retryAfter: '60 seconds'
  });
}