import { Request, Response, NextFunction } from "express";
import { appLogger } from "../utils/logger";

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
  
  // Create error response
  const errorResponse = {
    error: error.message || 'Internal server error',
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add details in development
  if (process.env.NODE_ENV === 'development' && error.details) {
    (errorResponse as any).details = error.details;
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
  const error = createApiError(`Route ${req.method} ${req.path} not found`, 404);
  res.status(404).json({
    error: error.message,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
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