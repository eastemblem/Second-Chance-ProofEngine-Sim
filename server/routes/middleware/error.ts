import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    version: 'v1'
  }
});

export const createErrorResponse = (code: string, message: string, details?: any): ApiResponse => ({
  success: false,
  error: {
    code,
    message,
    details
  },
  meta: {
    timestamp: new Date().toISOString(),
    version: 'v1'
  }
});

export const errorHandler = (error: ApiError, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json(createErrorResponse(
      'VALIDATION_ERROR',
      'Invalid request data',
      error.errors
    ));
  }

  // Custom API errors
  if (error.statusCode) {
    return res.status(error.statusCode).json(createErrorResponse(
      error.code || 'API_ERROR',
      error.message,
      error.details
    ));
  }

  // Default error
  res.status(500).json(createErrorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred'
  ));
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};