import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

/**
 * Standard error response format
 */
export function createErrorResponse(
  status: number,
  message: string,
  code?: string,
  details?: any
) {
  return {
    success: false,
    error: {
      status,
      message,
      code,
      details
    }
  };
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: z.ZodError) {
  return createErrorResponse(
    400,
    "Validation error",
    "VALIDATION_ERROR",
    error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
  );
}

/**
 * Handle different types of errors uniformly
 */
export function handleError(error: unknown) {
  if (error instanceof z.ZodError) {
    return handleValidationError(error);
  }
  
  if (error instanceof Error) {
    // Check for known error types
    if (error.message.includes("not found")) {
      return createErrorResponse(404, error.message, "NOT_FOUND");
    }
    
    if (error.message.includes("already exists")) {
      return createErrorResponse(409, error.message, "CONFLICT");
    }
    
    if (error.message.includes("required")) {
      return createErrorResponse(400, error.message, "BAD_REQUEST");
    }
    
    return createErrorResponse(500, error.message, "INTERNAL_ERROR");
  }
  
  return createErrorResponse(500, "Unknown error occurred", "UNKNOWN_ERROR");
}

/**
 * Express error handler middleware
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`Error in ${req.method} ${req.path}:`, error);
  
  const errorResponse = handleError(error);
  res.status(errorResponse.error.status).json(errorResponse);
}

/**
 * Async route wrapper to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Standard success response format
 */
export function createSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    data,
    message
  };
}