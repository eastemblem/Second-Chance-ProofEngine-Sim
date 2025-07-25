import { Request, Response, NextFunction } from 'express';
import { ZodSchema, z } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  founderId: z.object({
    founderId: z.string().uuid()
  }),
  
  ventureId: z.object({
    ventureId: z.string().uuid()
  }),

  pagination: z.object({
    page: z.string().transform(val => parseInt(val)).optional(),
    limit: z.string().transform(val => parseInt(val)).optional()
  })
};