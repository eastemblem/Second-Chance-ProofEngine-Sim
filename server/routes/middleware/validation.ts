import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { createErrorResponse } from '../../utils/error-handler';

// Request validation middleware that preserves existing validation behavior
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json(createErrorResponse(400, 'Invalid request data', 'VALIDATION_ERROR', error.errors));
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error: any) {
      return res.status(400).json(createErrorResponse(400, 'Invalid query parameters', 'VALIDATION_ERROR', error.errors));
    }
  };
};